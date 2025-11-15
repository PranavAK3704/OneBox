import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

const esClient = new Client({
  node: process.env.ELASTIC_URL || "http://localhost:9200",
});

const INDEX_NAME = "emails";

// Initialize index with mapping
export async function initializeIndex() {
  try {
    const exists = await esClient.indices.exists({ index: INDEX_NAME });
    
    if (!exists) {
      await esClient.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              messageId: { type: "keyword" },
              accountId: { type: "keyword" },
              folder: { type: "keyword" },
              from: { type: "text" },
              to: { type: "text" },
              subject: { type: "text" },
              body: { type: "text" },
              category: { type: "keyword" },
              date: { type: "date" },
              uid: { type: "long" },
            },
          },
        },
      });
      console.log("✅ Elasticsearch index created");
    } else {
      console.log("✅ Elasticsearch index already exists");
    }
  } catch (err) {
    console.error("❌ Error initializing Elasticsearch:", err);
  }
}

// Index an email
export async function indexEmail(email: any) {
  try {
    await esClient.index({
      index: INDEX_NAME,
      id: email.messageId,
      document: email,
    });
  } catch (err) {
    console.error("❌ Error indexing email:", err);
  }
}

// Search emails
export async function searchEmails(query: string, accountId?: string, folder?: string) {
  try {
    const must: any[] = [
      {
        multi_match: {
          query,
          fields: ["subject^2", "body", "from", "to"],
        },
      },
    ];

    if (accountId) must.push({ term: { accountId } });
    if (folder) must.push({ term: { folder } });

    const result = await esClient.search({
      index: INDEX_NAME,
      body: {
        query: { bool: { must } },
        size: 100,
        sort: [{ date: "desc" }],
      },
    });

    return result.hits.hits.map((hit: any) => hit._source);
  } catch (err) {
    console.error("❌ Error searching emails:", err);
    return [];
  }
}

// Get all emails with filters
export async function getAllEmails(accountId?: string, folder?: string, category?: string) {
  try {
    const filter: any[] = [];
    if (accountId) filter.push({ term: { accountId } });
    if (folder) filter.push({ term: { folder } });
    if (category) filter.push({ term: { category } });

    const query = filter.length > 0 ? { bool: { filter } } : { match_all: {} };

    const result = await esClient.search({
      index: INDEX_NAME,
      body: {
        query,
        size: 1000,
        sort: [{ date: "desc" }],
      },
    });

    return result.hits.hits.map((hit: any) => hit._source);
  } catch (err) {
    console.error("❌ Error fetching emails:", err);
    return [];
  }
}

export { esClient };