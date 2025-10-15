const DocumentParser = require('./docParser');
const EmbeddingGenerator = require('./embeddingGenerator');
const VectorStore = require('./vectorStore');
const OpenAI = require('openai');

class RAGEngine {
  constructor(openRouterApiKey) {
    this.vectorStore = new VectorStore();
    this.embeddingGenerator = EmbeddingGenerator;
    this.openRouter = new OpenAI({
      apiKey: openRouterApiKey,
      baseURL: 'https://openrouter.ai/api/v1'
    });
  }

  async ingestDocument(filePath) {
    try {
      // Parse the document
      const text = await DocumentParser.parseDocument(filePath);

      // Chunk the text
      const chunks = DocumentParser.chunkText(text);

      // Generate embeddings for each chunk
      const embeddings = await this.embeddingGenerator.generateEmbeddingsForChunks(chunks);

      // Store in vector store
      for (let i = 0; i < chunks.length; i++) {
        this.vectorStore.addVector(embeddings[i], chunks[i], { filePath });
      }

      return { success: true, chunksProcessed: chunks.length };
    } catch (error) {
      console.error('Error ingesting document:', error);
      return { success: false, error: error.message };
    }
  }

  async query(question, topK = 5) {
    try {
      // Generate embedding for the question
      const queryEmbedding = await this.embeddingGenerator.generateEmbedding(question);

      // Search for relevant vectors
      const relevantDocs = this.vectorStore.searchVectors(queryEmbedding, topK);

      // Generate answer using LLM
      const answer = await this.generateAnswer(question, relevantDocs);

      return { answer, relevantDocs };
    } catch (error) {
      console.error('Error querying:', error);
      return { error: error.message };
    }
  }

  async generateAnswer(question, relevantDocs) {
    const context = relevantDocs.map(doc => doc.text).join('\n');

    const prompt = `Using these documents, answer the user's question succinctly.

Context:
${context}

Question: ${question}

Answer:`;

    try {
      const response = await this.openRouter.chat.completions.create({
        model: 'anthropic/claude-3-haiku:beta',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating answer:', error);
      return 'Sorry, I could not generate an answer at this time.';
    }
  }
}

module.exports = RAGEngine;
