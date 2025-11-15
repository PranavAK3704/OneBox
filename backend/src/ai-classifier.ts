import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

/**
 * 🔥 MAIN AI CLASSIFIER (Groq)
 * Falls back to keywordClassify() on:
 *  - No API key
 *  - Rate limit errors
 *  - Invalid responses
 */
export async function classifyEmail(subject: string, body: string): Promise<string> {
  if (!GROQ_API_KEY) {
    console.warn("⚠️ No Groq API key found, using keyword-based classification");
    return keywordClassify(subject, body);
  }

  try {
    const prompt = `
Classify this email into EXACTLY ONE of the following categories:
- Interested
- Meeting Booked
- Not Interested
- Spam
- Out of Office

Email Subject: ${subject}
Email Body: ${body.slice(0, 500)}

Return ONLY the category name.`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are an email classifier. Respond ONLY with one of these categories: Interested, Meeting Booked, Not Interested, Spam, Out of Office.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 20,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = (response.data.choices?.[0]?.message?.content || "").trim();

    const validCategories = [
      "Interested",
      "Meeting Booked",
      "Not Interested",
      "Spam",
      "Out of Office",
    ];

    const match = validCategories.find((v) =>
      raw.toLowerCase().includes(v.toLowerCase())
    );

    if (match) return match;

    console.warn(`⚠️ Invalid Groq category "${raw}", falling back`);
    return keywordClassify(subject, body);
  } catch (err: any) {
    console.error("❌ Groq API error → fallback:", err.response?.data || err.message);
    return keywordClassify(subject, body);
  }
}

/**
 * 🧠 LOCAL KEYWORD CLASSIFIER (FALLBACK)
 * Used for:
 *  - Old emails
 *  - No Groq key
 *  - Rate limits
 *  - Groq failures
 */
export function keywordClassify(subject: string, body: string): string {
  const text = `${subject} ${body}`.toLowerCase();

  // Interested
  if (
    /interested|keen|sounds good|looks good|yes please|love to|let's discuss|follow up|connect soon/.test(
      text
    )
  ) {
    return "Interested";
  }

  // Meeting Booked
  if (/calendar invite|meeting scheduled|meeting confirmed|zoom link|booked/.test(text)) {
    return "Meeting Booked";
  }

  // Out of Office
  if (/out of office|ooo|vacation|on leave|away from keyboard|auto.?reply/.test(text)) {
    return "Out of Office";
  }

  // Spam
  if (/unsubscribe|click here|limited offer|act now|congratulations|winner|spam/.test(text)) {
    return "Spam";
  }

  // Not Interested
  if (/not interested|no thanks|pass|decline|stop emailing|not at this time/.test(text)) {
    return "Not Interested";
  }

  return "Not Interested";
}
