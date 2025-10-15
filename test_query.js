import EmbeddingGenerator from './embeddingGenerator.js';
import { VectorStore } from './vectorStore.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

async function testBasicComponents() {
  try {
    console.log("Testing basic text parsing...");

    // Simple text processing without pdf-parse
    const filePath = path.join(process.cwd(), 'test_docs', 'sample.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    console.log("Parsed text length:", text.length);

    console.log("Testing chunking...");
    const chunks = simpleTextChunk(text);
    console.log("Number of chunks:", chunks.length);

    console.log("Testing EmbeddingGenerator...");
    const embedding = await EmbeddingGenerator.generateEmbedding(chunks[0]);
    console.log("Embedding dimension:", embedding.length);

    console.log("Testing VectorStore...");
    const inMemoryStorage = { vectors: [], documents: [] };
    const vectorStore = new VectorStore(inMemoryStorage);
    vectorStore.addVector(embedding, chunks[0], { source: 'test' });
    console.log("Vectors in store:", inMemoryStorage.vectors.length);

    console.log("Testing search...");
    const searchResults = vectorStore.searchVectors(embedding);
    console.log("Search results:", searchResults.length);

    console.log("✅ All basic components working!");

  } catch (error) {
    console.error("❌ Error in basic components test:", error);
  }
}

// Simple text chunking function
function simpleTextChunk(text, chunkSize = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

async function testFullRag() {
  const inMemoryStorage = { vectors: [], documents: [] };
  const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;

  if (!openRouterApiKey) {
    console.log("❌ No API key found. Skipping LLM test.");
    return;
  }

  try {
    console.log("\nTesting full RAG pipeline...");

    // Create simplified RAG engine
    class TestRAGEngine {
      constructor(apiKey, storage) {
        this.vectorStore = new VectorStore(storage);
        this.embeddingGenerator = EmbeddingGenerator;
        this.openRouter = new OpenAI({
          apiKey: apiKey,
          baseURL: 'https://openrouter.ai/api/v1'
        });
      }

      async ingestText(chunks) {
        const embeddings = await this.embeddingGenerator.generateEmbeddingsForChunks(chunks);
        for (let i = 0; i < chunks.length; i++) {
          this.vectorStore.addVector(embeddings[i], chunks[i]);
        }
        return { success: true, chunksProcessed: chunks.length };
      }

      async query(question, topK = 3) {
        try {
          const queryEmbedding = await this.embeddingGenerator.generateEmbedding(question);
          const relevantDocs = this.vectorStore.searchVectors(queryEmbedding, topK);

          const context = relevantDocs.map(doc => doc.text).join('\n');
          const prompt = `Using these documents, answer the user's question succinctly.\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

          const response = await this.openRouter.chat.completions.create({
            model: 'anthropic/claude-3-haiku:beta',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.7,
          });

          const answer = response.choices[0].message.content.trim();

          return { answer, relevantDocs };
        } catch (error) {
          return { error: error.message };
        }
      }
    }

    const ragEngine = new TestRAGEngine(openRouterApiKey, inMemoryStorage);

    // Load test data
    const testText = fs.readFileSync(path.join(process.cwd(), 'test_docs', 'sample.txt'), 'utf8');
    const chunks = simpleTextChunk(testText);

    // Test ingestion
    console.log("Ingesting test data...");
    const ingestResult = await ragEngine.ingestText(chunks);
    console.log("Ingest result:", ingestResult);

    // Test query
    console.log("\nQuerying...");
    const queryResult = await ragEngine.query("What is RAG?");
    console.log("Query result:", queryResult);

  } catch (error) {
    console.error("❌ Error in full RAG test:", error);
  }
}

// Run tests
async function runTests() {
  await testBasicComponents();
  await testFullRag();
  console.log("\n🎉 Testing completed!");
}

runTests();
