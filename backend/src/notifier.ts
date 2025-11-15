import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const INTERESTED_WEBHOOK_URL = process.env.INTERESTED_WEBHOOK_URL;

export async function notifySlack(email: any) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("⚠️ Slack webhook URL not set");
    return;
  }

  try {
    await axios.post(SLACK_WEBHOOK_URL, {
      text: `🎯 *Interested Email Received!*\n\n*From:* ${email.from}\n*Subject:* ${email.subject}\n*Account:* ${email.accountId}`,
    });
    console.log("✅ Slack notification sent");
  } catch (err) {
    console.error("❌ Error sending Slack notification:", err.message);
  }
}

export async function triggerWebhook(email: any) {
  if (!INTERESTED_WEBHOOK_URL) {
    console.warn("⚠️ Webhook URL not set");
    return;
  }

  try {
    await axios.post(INTERESTED_WEBHOOK_URL, {
      event: "interested_email",
      email: {
        from: email.from,
        subject: email.subject,
        accountId: email.accountId,
        date: email.date,
      },
    });
    console.log("✅ Webhook triggered");
  } catch (err) {
    console.error("❌ Error triggering webhook:", err.message);
  }
}