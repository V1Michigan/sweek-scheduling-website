# 📧 Startup Week Email Sender

This script sends personalized emails to all students with their company match links.

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   pip install -r email_requirements.txt
   ```

2. **Set up environment variables** in `.env.local`:

   ```bash
   # Supabase (required)
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Email settings (required)
   SMTP_USERNAME=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   FROM_EMAIL=your_email@gmail.com
   FROM_NAME="V1 @ Michigan"

   # Optional
   APP_BASE_URL=https://your-domain.com
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587

   # Rate limiting (optional - defaults shown)
   EMAIL_DELAY_MIN=1.0
   EMAIL_DELAY_MAX=3.0
   BATCH_SIZE=50
   BATCH_DELAY=60
   MAX_RETRIES=3
   ```

3. **Run the script:**
   ```bash
   python send_emails.py
   ```

## 📋 What It Does

- ✅ Reads all active students from `sweek_students` table
- ✅ Creates personalized magic links (`/s/{token}`)
- ✅ Sends emails with the exact message you requested
- ✅ Tracks success/failure for each email
- ✅ Provides detailed summary report

## 📧 Email Content

The script sends this exact message:

```
Hey {name},

Congrats on getting into Startup Week! 🎉

Click the link below to see who your matches are:
{magic_link}

Please do not share this link with anyone or our matches will be invalidated.

Also feel free to email us if you have any questions.

Good luck!

Best,
The V1 Team
```

## 🔧 Gmail Setup

For Gmail, you'll need an **App Password**:

1. Enable 2-Factor Authentication on your Google account
2. Go to [Google Account Settings](https://myaccount.google.com/)
3. Security → 2-Step Verification → App passwords
4. Generate a new app password for "Mail"
5. Use this password (not your regular Gmail password) in `SMTP_PASSWORD`

## 🛡️ Safety Features

- **Confirmation prompt** before sending emails
- **Advanced rate limiting** with random delays (1-3s between emails)
- **Batch processing** (50 emails per batch with 60s breaks)
- **Retry logic** with exponential backoff (up to 3 retries per email)
- **Detailed logging** to JSON file with timestamps
- **Error handling** for different SMTP error types
- **Summary report** showing success/failure counts

## ⚙️ Rate Limiting Configuration

The script includes sophisticated rate limiting to prevent getting blocked:

- **`EMAIL_DELAY_MIN/MAX`**: Random delay between emails (1-3 seconds)
- **`BATCH_SIZE`**: Number of emails per batch (50 default)
- **`BATCH_DELAY`**: Seconds to wait between batches (60 default)
- **`MAX_RETRIES`**: Retry attempts for failed emails (3 default)

**For Gmail limits:**

- Gmail allows ~100 emails/day for free accounts
- Gmail allows ~500 emails/day for paid accounts
- The script is configured to stay well under these limits

## 📊 Example Output

```
🎯 Startup Week Email Sender
========================================
⚠️  This will send emails to ALL active students in the database.
Are you sure you want to continue? (yes/no): yes

🚀 Starting email sending process...
📝 Logging to: email_log_20241207_143022.json
⚙️  Rate limiting: 1.0-3.0s between emails
📦 Batch size: 50 emails per batch
⏱️  Batch delay: 60s between batches
🔄 Max retries: 3 per email
📧 Found 150 students to email

📦 Processing batch 1/3 (50 emails)
------------------------------------------------------------
📤 [1/150] Sending to John Doe (john@umich.edu)...
✅ Email sent successfully to John Doe
⏳ Waiting 2.3s before next email...
📤 [2/150] Sending to Jane Smith (jane@umich.edu)...
✅ Email sent successfully to Jane Smith
⏳ Waiting 1.7s before next email...
...

⏸️  Batch 1 complete. Waiting 60s before next batch...

📦 Processing batch 2/3 (50 emails)
------------------------------------------------------------
...

============================================================
📊 EMAIL SENDING SUMMARY
============================================================
✅ Successful: 148
❌ Failed: 2
📧 Total: 150
📝 Log file: email_log_20241207_143022.json

❌ Failed emails:
  - Bob Wilson (bob@umich.edu) - send failed
  - Alice Brown (alice@umich.edu) - missing data

🎉 Email sending process completed!
💡 Check email_log_20241207_143022.json for detailed logs
```

## 🔍 Troubleshooting

**"Missing required environment variables"**

- Make sure all required variables are set in `.env.local`

**"Authentication failed"**

- Check your SMTP credentials
- For Gmail, use an App Password, not your regular password

**"No students found"**

- Verify your Supabase connection
- Check that students exist in `sweek_students` table with `is_active = true`

**"Failed to send email"**

- Check your internet connection
- Verify SMTP server settings
- Check if your email provider has sending limits
