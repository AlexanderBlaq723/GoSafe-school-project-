Environment variables and setup

1. Copy the example to a local env file (do NOT commit .env.local):

   cp .env.example .env.local

2. Fill in the secrets in `.env.local`:
   - For development you can set `RETURN_RESET_TOKEN=true` to get reset tokens in API responses.
   - To enable SMS notifications set Twilio variables and install `twilio`.
   - To enable SendGrid email set `SENDGRID_API_KEY` and install `@sendgrid/mail`.
   - Alternatively configure SMTP variables and install `nodemailer`.

3. Restart the Next dev server after editing `.env.local`.

Notes:
- `.env*` are ignored by git in this project; keep secrets out of source control.
- Example DB variables are provided as comments: configure `lib/db` to match your connection method.
