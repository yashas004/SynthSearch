const RAGEngine = require('./ragEngine');

async function testRag() {
  const ragEngine = new RAGEngine("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");

  try {
    // Test ingestion first
    console.log("Ingesting document...");
    const ingestResult = await ragEngine.ingestDocument('./test_docs/sample.txt');
    console.log("Ingest result:", ingestResult);

    // Test query
    console.log("\nQuerying...");
    const queryResult = await ragEngine.query("What is RAG?");
    console.log("Query result:", queryResult);

  } catch (error) {
    console.error("Error:", error);
  }
}

testRag();
