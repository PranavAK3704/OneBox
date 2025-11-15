import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startImapWorker } from "./imap-worker";
import { initializeIndex } from "./es-utils";
import { initializeVectorDB } from "./rag-service";
import routes from "./routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize Elasticsearch index
  await initializeIndex();
  
  // Start IMAP workers
  await startImapWorker();
  
  console.log("✅ Backend fully initialized");
});