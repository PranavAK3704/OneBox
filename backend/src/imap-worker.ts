import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import { indexEmail } from "./es-utils";
import { classifyEmail, keywordClassify } from "./ai-classifier";
import { notifySlack, triggerWebhook } from "./notifier";

dotenv.config();

export async function startImapWorker() {
  console.log("🚀 Starting IMAP worker...");

  const accounts = [
    {
      host: process.env.IMAP_ACCOUNT1_HOST!,
      port: Number(process.env.IMAP_ACCOUNT1_PORT!),
      secure: process.env.IMAP_ACCOUNT1_SECURE === "true",
      auth: {
        user: process.env.IMAP_ACCOUNT1_USER!,
        pass: process.env.IMAP_ACCOUNT1_PASS!,
      },
      accountId: "account1",
    },
  ];

  for (const acc of accounts) {
    if (!acc.auth.user || !acc.auth.pass) {
      console.log(`⚠️ Skipping ${acc.accountId}, missing creds`);
      continue;
    }
    createConnection(acc);
  }
}

async function createConnection(account: any) {
  console.log(`🔌 Connecting to IMAP for ${account.accountId}...`);

  const client = new ImapFlow({
    host: account.host,
    port: account.port,
    secure: account.secure,
    auth: account.auth,
    logger: false,
  });

  client.on("error", (err) => {
    console.error(`❌ IMAP Error (${account.accountId}):`, err.message);
    setTimeout(() => createConnection(account), 5000);
  });

  client.on("close", () => {
    console.log(`🔌 Connection closed for ${account.accountId}, reconnecting...`);
    setTimeout(() => createConnection(account), 5000);
  });

  try {
    await client.connect();
    console.log(`✅ Connected: ${account.accountId}`);

    await client.mailboxOpen("INBOX");

    // Fetch last 30 days of emails
    const since = new Date();
    since.setDate(since.getDate() - 30);

    console.log(`📩 Fetching last 30 days for ${account.accountId}...`);

    const messages = [];
    for await (const msg of client.fetch({ since }, { envelope: true, source: true, uid: true })) {
      messages.push(msg);
    }

    console.log(`📨 Found ${messages.length} emails to process`);

    // Process historical emails fast
    for (let i = 0; i < messages.length; i++) {
      console.log(`📨 Processing ${i + 1}/${messages.length}...`);
      await processEmail(messages[i], account.accountId, false);

      await new Promise((r) => setTimeout(r, 250)); // small throttle
    }

    console.log(`👀 Listening for new emails on ${account.accountId}...`);

    client.on("exists", async () => {
      console.log(`🆕 New email detected on ${account.accountId}`);
      const mailbox = await client.mailboxOpen("INBOX");
      const seq = `${mailbox.exists}:${mailbox.exists}`;

      for await (const msg of client.fetch(seq, { envelope: true, source: true, uid: true })) {
        await processEmail(msg, account.accountId, true);
      }
    });

    await client.idle();
  } catch (err: any) {
    console.error(`❌ Connection failed (${account.accountId}):`, err.message);
    setTimeout(() => createConnection(account), 5000);
  }
}

async function processEmail(msg: any, accountId: string, isNewEmail: boolean) {
  try {
    const parsed = await simpleParser(msg.source);

    const rawBody = parsed.text || parsed.html || "";
    const body = typeof rawBody === "string" ? rawBody : "";

    const emailData: any = {
      messageId: msg.envelope.messageId || msg.uid,
      accountId,
      folder: "INBOX",
      from: parsed.from?.text || "",
      to: parsed.to?.text || "",
      subject: parsed.subject || "",
      body,
      date: parsed.date || new Date(),
      uid: msg.uid,
    };

    console.log(`📧 Processing: ${emailData.subject.substring(0, 60)}...`);

    // Determine if email is new (use 1-day threshold)
    const isRecent =
      Date.now() - new Date(emailData.date).getTime() <
      24 * 60 * 60 * 1000;

    // === Classification Logic ===
    try {
      if (isNewEmail || isRecent) {
        emailData.category = await classifyEmail(emailData.subject, emailData.body);
      } else {
        emailData.category = keywordClassify(emailData.subject, emailData.body);
      }

      console.log(`🏷️ Classified as: ${emailData.category}`);
    } catch (err: any) {
      console.error("⚠️ AI classification failed, using keyword fallback:", err.message);
      emailData.category = keywordClassify(emailData.subject, emailData.body);
    }

    // === Store in Elasticsearch ===
    await indexEmail(emailData);

    // === Notifications ===
    if (emailData.category === "Interested") {
      console.log(`🎯 Interested email detected! Sending notifications...`);
      await notifySlack(emailData);
      try {
        await triggerWebhook(emailData);
      } catch (err: any) {
        console.error("❌ Webhook failed:", err.message);
      }
    }

    console.log(`✅ Processed: ${emailData.subject.substring(0, 60)} [${emailData.category}]`);
  } catch (err: any) {
    console.error("❌ Error processing email:", err.message);
  }
}
