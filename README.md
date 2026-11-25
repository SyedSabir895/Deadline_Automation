Gmail Form Deadline Automation
Automatically scans Gmail for Google Forms application emails, extracts
the deadline, and creates a Google Calendar event with a 15-minute
popup reminder.
1. What this automation does
1. Searches Gmail for recent emails containing Google Forms links.
2. Looks for a deadline such as
   Application Deadline: 16 November, 9:00 PM.
3. Extracts the date and time.
4. Skips deadlines that have already passed.
5. Creates a Google Calendar event at the deadline.
6. Adds a popup reminder 15 minutes before the deadline.
7. Remembers processed emails so the same event is not created again.
The script uses your Google account's default calendar and the
Asia/Kolkata time zone configured in Apps Script.

2. Requirements
- A Google account with Gmail and Google Calendar.
- A desktop browser.
- Access to Google Apps Script.
- No paid Google Workspace subscription is required for this basic
  setup. Google Apps Script quotas and limits still apply.
3. Create the Apps Script project
1. Open Google Apps Script.
2. Sign in with the Google account that receives the application
   emails.
3. Click New project.
4. Rename the project to Gmail Form Deadline Automation.
5. Open the default Code.gs file.
6. Paste the complete automation JavaScript code into Code.gs.
7. Click Save.
4. Set the project time zone
1. In Apps Script, open Project Settings (gear icon on the left).
2. Find Time zone.
3. Select (GMT+05:30) India Standard Time -- Kolkata or
   Asia/Kolkata.
4. Save the setting.
The time zone matters because the deadline in the email should be
interpreted as Indian Standard Time.
5. Authorize Gmail and Calendar access
1. In the function dropdown near the top, select scanEmails.
2. Click Run.
3. When Google asks for permission, choose Review permissions.
4. Select the Google account that receives the emails.
5. Review and allow the requested Gmail and Calendar permissions.
6. If Google displays an unverified-app warning for your own script,
   use Advanced and continue only if you created and trust this
   script.
The script needs Gmail permission to read matching emails and Calendar
permission to create events.
6. Test the automation manually
Before creating an automatic trigger, send yourself a test email to the
same Gmail account.

Use a clear subject, for example:

Placement Test SSGP-TEST-02

Use a simple email body like this:
Application Deadline : 28 November, 9:00 PM

Google Form: https://forms.gle/your-test-form-link
Use a future date and a real or test Google Forms link. The current
script expects a clear date and time in a supported format, such as:
- 28 November, 9:00 PM
- 28 November 2026, 9:00 PM
- 28/11/2026 at 9:00 PM
Then:
1. Return to Apps Script.
2. Select scanEmails.
3. Click Run.
4. Open Execution log (or Executions) and check the output.
5. Open Google Calendar using the same
   Google account.
6. Navigate to the test deadline date and find the event named
   Application Deadline: Placement Test SSGP-TEST-02.
Check that the event starts at the deadline time and that its popup
reminder is set to 15 minutes before.
Test duplicate prevention
Run scanEmails again without changing the test email. The log should
say:

Calendar event already exists. Skipping duplicate.

The script stores a unique key in Apps Script Script Properties after
creating an event, so it can avoid creating that same event again.
7. Run it automatically every 5 minutes
After the manual test works:
1. In Apps Script, click Triggers (clock icon) in the left sidebar.
2. Click + Add Trigger.
3. Choose function: scanEmails.
4. Choose deployment: Head.
5. Select event source: Time-driven.
6. Select type: Minutes timer.
7. Select interval: Every 5 minutes.
8. Click Save and complete any permission prompt.
You should now see a trigger for scanEmails in the Triggers list. Apps
Script will run it automatically on that schedule.
8. How to check whether it is working
- Apps Script → Executions: check whether scheduled runs completed
  or failed.
- Apps Script → Triggers: confirm that the five-minute trigger
  exists.
- Google Calendar: confirm that the event was created on the
  expected date and time.
- Execution log: look for messages such as
  Calendar event created successfully. or
  Calendar event already exists. Skipping duplicate.
9. Important notes and limitations
- The Gmail search currently looks for messages matching
  newer_than:7d {forms.gle docs.google.com/forms}. You can change
  7d in the code if you want a different search window.
- The current parser supports specific date-and-time formats. It may
  not understand every natural-language deadline.
- Keep the deadline label close to the date and time. Avoid putting
  another unrelated use of the word "deadline" earlier in the email.
- Emails with only a date and no exact time are not scheduled as
  Calendar events by the current version.
- Expired deadlines are skipped.
- Events are created on the Google account's default calendar.
- A Calendar popup reminder is not necessarily the same as a phone
  notification. Enable Google Calendar notifications in your browser
  or phone settings if you want to receive notifications there.
- Apps Script has usage quotas and execution limits. A five-minute
  trigger is subject to Google's limits and may not execute at an
  exact second.
- If you delete a Calendar event manually, the script's saved
  duplicate-prevention record may still exist. The script may
  therefore skip recreating that event unless the corresponding Script
  Property is cleared.
10. Troubleshooting
  Problem                             What to check
  No matching emails                  Confirm the email is in the same
Gmail account and contains a
forms.gle or
docs.google.com/forms link.

  Deadline not detected               Use a clear label such as
Application Deadline: followed by
a supported date and time.

  Event not visible                   Check the Google account, default
calendar, date, and Apps Script
execution log.

  Permission error                    Run scanEmails manually and
complete the Google authorization
flow.

  Duplicate event                     Check whether the event already
exists and review the execution
log.

  Trigger not running                 Open Triggers and
Executions to check the trigger
and any errors.
Reminder not appearing              Open the event in Google Calendar
and verify its notification
settings; also check device/browser
notification permissions.
11. Useful links
- Google Apps Script
- Google Calendar
- Apps Script
  documentation
