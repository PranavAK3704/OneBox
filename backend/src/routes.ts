import express from "express";
import { searchEmails, getAllEmails } from "./es-utils";
import { generateReply } from "./rag-service";

const router = express.Router();

// Get all emails with optional filters
router.get("/emails", async (req, res) => {
  try {
    const { accountId, folder, category } = req.query;
    
    const emails = await getAllEmails(
      accountId as string,
      folder as string,
      category as string
    );
    
    res.json({ success: true, count: emails.length, emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search emails
router.get("/emails/search", async (req, res) => {
  try {
    const { q, accountId, folder } = req.query;
    
    if (!q) {
      return res.status(400).json({ success: false, error: "Query parameter 'q' is required" });
    }
    
    const emails = await searchEmails(
      q as string,
      accountId as string,
      folder as string
    );
    
    res.json({ success: true, count: emails.length, emails });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;