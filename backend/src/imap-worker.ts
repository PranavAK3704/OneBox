import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";
import { indexEmail } from "./es-utils";
import { classifyEmail } from "./ai-classifier";
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
    // Account 2 - Comment out if not configured
    // {
    //   host: process.env.IMAP_ACCOUNT2_HOST!,
    //   port: Number(process.env.IMAP_ACCOUNT2_PORT!),
    //   secure: process.env.IMAP_ACCOUNT2_SECURE === "true",
    //   auth: {
    //     user: process.env.IMAP_ACCOUNT2_USER!,
    //     pass: process.env.IMAP_ACCOUNT2_PASS!,
    //   },
    //   accountId: "account2",
    // },
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

  client.on("error", async (err) => {
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

    // Fetch last 30 days
    const since = new Date();
    since.setDate(since.getDate() - 30);

    console.log(`📩 Fetching last 30 days for ${account.accountId}...`);

    const messages = [];
    for await (const msg of client.fetch({ since }, { 
      envelope: true, 
      source: true,
      uid: true 
    })) {
      messages.push(msg);
    }

    console.log(`📨 Found ${messages.length} emails to process`);

    // Process emails with delay to avoid rate limits
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      console.log(`📨 Processing ${i + 1}/${messages.length}...`);
      await processEmail(msg, account.accountId, client);
      
      // Add delay between emails to avoid rate limits (only if more emails to process)
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay
      }
    }

    console.log(`✅ Finished processing ${messages.length} emails`);
    console.log(`👀 Listening for new emails (IDLE) on ${account.accountId}...`);

    // Listen for new emails
    client.on("exists", async (data) => {
      console.log(`🆕 New email detected on ${account.accountId}`);
      
      const mailbox = await client.mailboxOpen("INBOX");
      const seq = `${mailbox.exists}:${mailbox.exists}`;

      for await (const msg of client.fetch(seq, { 
        envelope: true, 
        source: true,
        uid: true 
      })) {
        await processEmail(msg, account.accountId, client);
      }
    });

    // Keep IDLE connection alive
    await client.idle();
  } catch (err: any) {
    console.error(`❌ Connection failed for ${account.accountId}:`, err.message);
    setTimeout(() => createConnection(account), 5000);
  }
}

async function processEmail(msg: any, accountId: string, client: ImapFlow) {
  try {
    // Parse email content
    const parsed = await simpleParser(msg.source);
    
    const emailData: any = {
      messageId: msg.envelope.messageId || msg.uid,
      accountId,
      folder: "INBOX",
      from: parsed.from?.text || "",
      to: parsed.to?.text || "",
      subject: parsed.subject || "",
      body: parsed.text || parsed.html || "",
      date: parsed.date || new Date(),
      uid: msg.uid,
    };

    console.log(`📧 Processing: ${emailData.subject.substring(0, 50)}...`);

    // 1. Classify email using AI (with built-in retry logic)
    try {
      const category = await classifyEmail(emailData.subject, emailData.body);
      emailData.category = category;
      console.log(`🏷️ Classified as: ${category}`);
    } catch (classifyError: any) {
      console.error(`⚠️ Classification failed, using default:`, classifyError.message);
      emailData.category = "Not Interested";
    }

    // 2. Index in Elasticsearch
    await indexEmail(emailData);

    // 3. Send notifications if "Interested"
    if (emailData.category === "Interested") {
      console.log(`🎯 Interested email detected! Sending notifications...`);
      await notifySlack(emailData);
      await triggerWebhook(emailData);
    }

    console.log(`✅ Processed: ${emailData.subject.substring(0, 50)}... [${emailData.category}]`);
  } catch (err: any) {
    console.error("❌ Error processing email:", err.message);
  }
}