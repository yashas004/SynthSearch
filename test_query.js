import { RAGEngine } from './ragEngine.js';
import fs from 'fs';
import path from 'path';

// Simple test to verify basic functionality without complex PDF parsing
async function runSimpleTest() {
  try {
    console.log("🧪 Running simplified SynthSearch test...");

    // Test RAG engine initialization
    const inMemoryStorage = { vectors: [], documents: [] };
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;

    if (!openRouterApiKey) {
      console.log("❌ No API key found in environment variables");
      console.log("Available env vars:", Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')));
      return;
    }

    console.log("🔑 API key found, initializing RAG engine...");

    const ragEngine = new RAGEngine(openRouterApiKey, inMemoryStorage);
    console.log("✅ RAG engine initialized successfully");

    // Test with simple text file
    console.log("📄 Testing document ingestion...");
    const filePath = path.join(process.cwd(), 'test_docs', 'sample.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    console.log("📏 Sample text length:", text.length);

    // Test chunking (this should work without errors)
    const chunks = text.match(/.{1,1000}/g) || [text]; // Simple chunking
    console.log("📦 Number of chunks:", chunks.length);

    // Test basic ingestion
    console.log("🔄 Testing ingestion...");
    const ingestResult = await ragEngine.ingestDocument(Buffer.from(text), 'sample.txt');
    console.log("📊 Ingest result:", ingestResult);

    if (ingestResult.success) {
      console.log("🎉 Basic functionality test PASSED!");
      console.log("📈 Vectors in storage:", inMemoryStorage.vectors.length);
    } else {
      console.log("❌ Ingestion failed:", ingestResult.error);
    }

  } catch (error) {
    console.error("❌ Test failed with error:", error.message);
    console.error("Full error:", error);
  }
}

runSimpleTest();
