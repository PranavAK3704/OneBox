import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function classifyEmail(subject: string, body: string): Promise<string> {
  // Fallback to keyword-based if no API key
  if (!GROQ_API_KEY) {
    console.warn("⚠️ No Groq API key found, using keyword-based classification");
    return keywordClassify(subject, body);
  }

  try {
    const prompt = `Classify this email into ONE category: Interested, Meeting Booked, Not Interested, Spam, or Out of Office.

Email Subject: ${subject}
Email Body: ${body.slice(0, 500)}

Reply with ONLY the category name, nothing else.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are an email classifier. Respond only with one of these categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const category = response.data.choices[0].message.content.trim();
    
    const validCategories = ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"];
    if (validCategories.includes(category)) {
      return category;
    }

    console.warn(`⚠️ Invalid category: ${category}, using fallback`);
    return keywordClassify(subject, body);
  } catch (err: any) {
    console.error("❌ Groq API error:", err.response?.data || err.message);
    return keywordClassify(subject, body);
  }
}

// Keyword-based fallback
function keywordClassify(subject: string, body: string): string {
  const text = (subject + ' ' + body).toLowerCase();

  if (text.match(/interested|sounds good|look forward|let's discuss|yes please|love to/i)) {
    return "Interested";
  }
  
  if (text.match(/meeting scheduled|calendar invite|zoom link|meeting confirmed|booked|appointment/i)) {
    return "Meeting Booked";
  }
  
  if (text.match(/out of office|ooo|vacation|away|unavailable|auto.?reply/i)) {
    return "Out of Office";
  }
  
  if (text.match(/unsubscribe|click here|limited offer|act now|special deal|spam/i)) {
    return "Spam";
  }
  
  if (text.match(/not interested|no thank|pass|decline|not at this time/i)) {
    return "Not Interested";
  }

  return "Not Interested";
}