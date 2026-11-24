
function scanEmails() {

  const query = 'newer_than:7d {forms.gle docs.google.com/forms}';
  const threads = GmailApp.search(query, 0, 50);

  const properties = PropertiesService.getScriptProperties();

  Logger.log("Matching threads: " + threads.length);

  for (const thread of threads) {
    for (const message of thread.getMessages()) {

      const subject = message.getSubject();
      const body = message.getPlainBody();
      const receivedAt = message.getDate();
      const content = subject + "\n" + body;

      const formRegex =
        /https?:\/\/(?:docs\.google\.com\/forms\/[^\s"'<>]+|forms\.gle\/[^\s"'<>]+)/gi;

      const links = content.match(formRegex) || [];

      const uniqueLinks = [...new Set(
        links.map(link => link.replace(/[),.;]+$/, ""))
      )];

      if (uniqueLinks.length === 0) continue;

      Logger.log("----------------------");
      Logger.log("Subject: " + subject);

      const result = extractDeadline(content, receivedAt);

      if (result.status === "FOUND") {

        Logger.log("Deadline found: " + result.deadline);

        if (result.expired) {

          Logger.log("Status: EXPIRED");
          Logger.log("Skipping Calendar event.");

        } else {

          Logger.log("Status: UPCOMING");

          createCalendarReminder(
            message,
            subject,
            result.deadline,
            uniqueLinks,
            properties
          );
        }

      } else if (result.status === "DATE_ONLY") {

        Logger.log("Date found, but exact time is missing.");

      } else {

        Logger.log("No clear submission deadline found.");
      }

      Logger.log("Form links: " + uniqueLinks.join(", "));
    }
  }
}


// Extract deadline from email
function extractDeadline(text, receivedAt) {

  text = text.replace(/\*/g, "");
  text = text.replace(/[\u00A0\u202F\u2007]/g, " ");
  text = text.replace(/\s+/g, " ");

  const match = text.match(
    /(?:application\s+deadline|submission\s+deadline|deadline|due\s+date|due|last\s+date|closing\s+date)\s*[:\-–]?\s*([^.!?]{1,150})/i
  );

  if (!match) {
    return { status: "NOT_FOUND" };
  }

  const candidate = match[1].trim();

  Logger.log("Deadline text detected: " + candidate);

  const months = [
    "january", "february", "march", "april",
    "may", "june", "july", "august",
    "september", "october", "november", "december"
  ];

  // Example: 16 November, 9:00 PM
  let dateMatch = candidate.match(
    /\b(\d{1,2})\s+([a-z]{3,9})\s*,?\s*(?:(\d{4})\s*,?\s*)?(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)\b/i
  );

  if (dateMatch) {

    const day = Number(dateMatch[1]);

    const month = months.findIndex(m =>
      m.startsWith(dateMatch[2].toLowerCase())
    );

    const year = dateMatch[3]
      ? Number(dateMatch[3])
      : receivedAt.getFullYear();

    if (month === -1) {
      return { status: "NOT_FOUND" };
    }

    return createDeadline(
      year, month, day,
      dateMatch[4], dateMatch[5], dateMatch[6]
    );
  }

  // Example: 16/11/2026 at 9:00 PM
  dateMatch = candidate.match(
    /\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s*(?:at\s*)?(\d{1,2}):(\d{2})\s*(am|pm)\b/i
  );

  if (dateMatch) {

    return createDeadline(
      Number(dateMatch[3]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[1]),
      dateMatch[4],
      dateMatch[5],
      dateMatch[6]
    );
  }

  const hasDate =
    /\b(today|tomorrow|\d{1,2}\s+[a-z]+|\d{1,2}[/-]\d{1,2}[/-]\d{4})\b/i.test(candidate);

  if (hasDate) {
    return { status: "DATE_ONLY" };
  }

  return { status: "NOT_FOUND" };
}


// Create and validate deadline
function createDeadline(year, month, day, hour, minute, period) {

  const h = Number(hour);
  const min = Number(minute);

  if (
    month < 0 || month > 11 ||
    day < 1 || day > 31 ||
    h < 1 || h > 12 ||
    min < 0 || min > 59
  ) {
    return { status: "NOT_FOUND" };
  }

  const deadline = new Date(year, month, day);

  if (
    deadline.getFullYear() !== year ||
    deadline.getMonth() !== month ||
    deadline.getDate() !== day
  ) {
    return { status: "NOT_FOUND" };
  }

  setTime(deadline, h, min, period);

  return {
    status: "FOUND",
    deadline: deadline,
    expired: deadline.getTime() <= new Date().getTime()
  };
}


// Convert AM/PM to 24-hour time
function setTime(date, hour, minute, period) {

  let h = Number(hour);

  if (period.toLowerCase() === "pm" && h !== 12) {
    h += 12;
  }

  if (period.toLowerCase() === "am" && h === 12) {
    h = 0;
  }

  date.setHours(h, Number(minute), 0, 0);
}


// Create Google Calendar event with 15-minute reminder
function createCalendarReminder(
  message,
  subject,
  deadline,
  links,
  properties
) {

  // Generate a unique key for this email and deadline
  const uniqueText = message.getId() + "_" + deadline.getTime();

  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    uniqueText
  );

  const uniqueKey =
    "CALENDAR_EVENT_" + Utilities.base64EncodeWebSafe(digest);

  // Check whether this email was already processed
  if (properties.getProperty(uniqueKey)) {

    Logger.log("Calendar event already exists. Skipping duplicate.");
    return;
  }

  const calendar = CalendarApp.getDefaultCalendar();

  // Event starts at the exact deadline
  // It lasts for 15 minutes
  const eventStart = deadline;
  const eventEnd = new Date(deadline.getTime() + 15 * 60 * 1000);

  const description =
    "Application submission deadline.\n\n" +
    "Google Form link(s):\n" +
    links.join("\n") +
    "\n\nOriginal email subject: " + subject;

  const event = calendar.createEvent(
    "Application Deadline: " + subject,
    eventStart,
    eventEnd,
    {
      description: description
    }
  );

  // Remove default reminders and add our 15-minute popup reminder
  event.removeAllReminders();
  event.addPopupReminder(15);

  // Save the event ID to prevent duplicates
  properties.setProperty(uniqueKey, event.getId());

  Logger.log("Calendar event created successfully.");
  Logger.log("Event: " + event.getTitle());
  Logger.log("Reminder: 15 minutes before deadline.");
}
