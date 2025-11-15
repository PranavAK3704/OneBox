import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const qdrantClient = new QdrantClient({ url: QDRANT_URL });
const COLLECTION_NAME = 'email_context';

// Your product/outreach context
const contextData = [
  {
    id: 1,
    text: "I am applying for software engineering positions. I have experience in full-stack development with React, Node.js, and TypeScript.",
    metadata: { type: "background" }
  },
  {
    id: 2,
    text: "If someone is interested in my application, I should share my calendar booking link: https://cal.com/pranav-interview",
    metadata: { type: "action" }
  },
  {
    id: 3,
    text: "My availability is weekdays 10 AM - 6 PM IST. I prefer video calls via Google Meet or Zoom.",
    metadata: { type: "availability" }
  },
  {
    id: 4,
    text: "My portfolio is at https://github.com/pranavpanna and I'm passionate about building scalable automation systems.",
    metadata: { type: "portfolio" }
  },
  {
    id: 5,
    text: "For salary expectations, mention that I'm looking for competitive compensation based on role & experience.",
    metadata: { type: "negotiation" }
  }
];

// -------------------------------------------------------
// Initialize vector DB
// -------------------------------------------------------
export async function initializeVectorDB() {
  try {
    const collections = await qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c: any) => c.name === COLLECTION_NAME
    );

    if (!exists) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: { size: 384, distance: "Cosine" },
      });

      console.log("🧠 Qdrant collection created");

      await storeContextData();
    } else {
      console.log("🧠 Qdrant collection already exists");
    }
  } catch (err) {
    console.error("❌ Error initializing Qdrant:", err);
  }
}

// -------------------------------------------------------
// Simple embedding generator (fallback)
// -------------------------------------------------------
function generateSimpleEmbedding(text: string): number[] {
  const vector = new Array(384).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1) * (j + 1)) % 384;
      vector[idx] += 1;
    }
  }

  const mag = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
  return vector.map((v) => (mag ? v / mag : 0));
}

// Store seed context
async function storeContextData() {
  try {
    const points = contextData.map((item) => ({
      id: item.id,
      vector: generateSimpleEmbedding(item.text),
      payload: {
        text: item.text,
        metadata: item.metadata,
      },
    }));

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points,
    });

    console.log(`🧠 Stored ${points.length} context docs in Qdrant`);
  } catch (err) {
    console.error("❌ Error storing context:", err);
  }
}

// -------------------------------------------------------
// Search vectors
// -------------------------------------------------------
export async function searchContext(query: string, limit = 3): Promise<string[]> {
  try {
    const queryVec = generateSimpleEmbedding(query);

    const result = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVec,
      limit,
    });

    return result.map((r: any) => r.payload.text);
  } catch (err) {
    console.error("❌ Context search error:", err);
    return contextData.map((i) => i.text);
  }
}

// -------------------------------------------------------
// Generate RAG reply
// -------------------------------------------------------
export async function generateReply(subject: string, body: string): Promise<string> {
  if (!GROQ_API_KEY) {
    return "Error: Missing GROQ_API_KEY in environment.";
  }

  try {
    const retrieved = await searchContext(subject + " " + body);
    const context = retrieved.join("\n\n");

    const prompt = `
You are replying to an email. Use ONLY the context below to craft a concise, friendly, 2-3 sentence reply.

CONTEXT:
${context}

EMAIL:
Subject: ${subject}
Body: ${body}

Reply professionally and include relevant links if needed.

Reply:
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a helpful professional email assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err: any) {
    console.error("❌ Error generating reply:", err.response?.data || err.message);
    return "Thank you for the email! I will get back to you shortly.";
  }
}
