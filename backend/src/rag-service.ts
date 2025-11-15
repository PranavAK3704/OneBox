import { QdrantClient } from '@qdrant/js-client-rest';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const qdrantClient = new QdrantClient({ url: QDRANT_URL });
const COLLECTION_NAME = 'email_context';

// Your product/outreach context - CUSTOMIZE THIS!
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
    text: "For meeting requests, my availability is weekdays 10 AM - 6 PM IST. I prefer video calls via Google Meet or Zoom.",
    metadata: { type: "availability" }
  },
  {
    id: 4,
    text: "My portfolio is at https://github.com/pranavpanna and I'm passionate about building scalable email automation systems.",
    metadata: { type: "portfolio" }
  },
  {
    id: 5,
    text: "When someone asks about salary expectations, mention that I'm looking for market-competitive rates based on the role and my experience level.",
    metadata: { type: "negotiation" }
  }
];

// Initialize vector database
export async function initializeVectorDB() {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections();
    const collectionExists = collections.collections.some(
      (c: any) => c.name === COLLECTION_NAME
    );

    if (!collectionExists) {
      // Create collection
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 384, // Using smaller embeddings for speed
          distance: 'Cosine',
        },
      });
      console.log('✅ Qdrant collection created');

      // Store context data with embeddings
      await storeContextData();
    } else {
      console.log('✅ Qdrant collection already exists');
    }
  } catch (err) {
    console.error('❌ Error initializing Qdrant:', err);
  }
}

// Generate simple embeddings using text statistics (fallback, no API needed)
function generateSimpleEmbedding(text: string): number[] {
  const embedding = new Array(384).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  // Simple hash-based embedding
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const index = (charCode * (i + 1) * (j + 1)) % 384;
      embedding[index] += 1;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

// Store context data in vector database
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

    console.log(`✅ Stored ${contextData.length} context items in Qdrant`);
  } catch (err) {
    console.error('❌ Error storing context data:', err);
  }
}

// Search for relevant context
export async function searchContext(query: string, limit: number = 3): Promise<string[]> {
  try {
    const queryVector = generateSimpleEmbedding(query);

    const searchResult = await qdrantClient.search(COLLECTION_NAME, {
      vector: queryVector,
      limit,
    });

    return searchResult.map((result: any) => result.payload.text);
  } catch (err) {
    console.error('❌ Error searching context:', err);
    // Fallback: return all context if search fails
    return contextData.map(item => item.text);
  }
}

// Generate reply using RAG
export async function generateReply(emailSubject: string, emailBody: string): Promise<string> {
  if (!GROQ_API_KEY) {
    return "Error: Groq API key not configured. Please add GROQ_API_KEY to .env file.";
  }

  try {
    // 1. Retrieve relevant context
    const relevantContext = await searchContext(emailSubject + ' ' + emailBody);
    
    // 2. Build prompt with context
    const contextText = relevantContext.join('\n\n');
    
    const prompt = `You are replying to an email. Use the context below to write a professional, personalized reply.

CONTEXT (use this information):
${contextText}

EMAIL TO REPLY TO:
Subject: ${emailSubject}
Body: ${emailBody}

Write a brief, professional reply (2-3 sentences). Include relevant links or information from the context if applicable.

Reply:`;

    // 3. Generate reply with Groq
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a professional email assistant. Write concise, friendly replies.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err: any) {
    console.error('❌ Error generating reply:', err.response?.data || err.message);
    
    // Fallback reply
    return "Thank you for your email. I'll review this and get back to you shortly.";
  }
}