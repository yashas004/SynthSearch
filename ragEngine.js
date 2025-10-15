import DocumentParser from './docParser.js';
import EmbeddingGenerator from './embeddingGenerator.js';
import { VectorStore } from './vectorStore.js';

class RAGEngine {
  constructor(apiKey, inMemoryStorage) {
    this.vectorStore = new VectorStore(inMemoryStorage);
    this.embeddingGenerator = EmbeddingGenerator;
    this.apiKey = apiKey;
  }

  async callOpenRouter(messages) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku:beta',
          messages: messages,
          max_tokens: 300,
          temperature: 0.3,
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenRouter API call failed:', error);
      throw error;
    }
  }

  async ingestDocument(fileBuffer, fileName) {
    try {
      console.log(`Ingesting document: ${fileName}`);

      // Parse the document from buffer
      const text = await DocumentParser.parseDocument(fileBuffer, fileName);
      console.log(`Parsed text length: ${text.length}`);

      // Chunk the text
      const chunks = DocumentParser.chunkText(text);
      console.log(`Created ${chunks.length} chunks`);

      // Generate embeddings for each chunk
      const embeddings = await this.embeddingGenerator.generateEmbeddingsForChunks(chunks);
      console.log(`Generated ${embeddings.length} embeddings`);

      // Store in vector store
      for (let i = 0; i < chunks.length; i++) {
        this.vectorStore.addVector(embeddings[i], chunks[i], { fileName, chunkId: i });
      }

      console.log(`Successfully ingested document with ${chunks.length} chunks`);
      return { success: true, chunksProcessed: chunks.length };
    } catch (error) {
      console.error('Error ingesting document:', error);
      return { success: false, error: error.message };
    }
  }

  async query(question, topK = 5) {
    try {
      console.log(`Processing query: "${question}"`);

      // Check if any documents have been ingested
      if (!this.vectorStore.data || this.vectorStore.data.vectors.length === 0) {
        return { answer: "No documents have been uploaded yet. Please upload a document first before asking questions.", relevantDocs: [] };
      }

      // Generate embedding for the question
      const queryEmbedding = await this.embeddingGenerator.generateEmbedding(question);
      console.log('Generated query embedding');

      // Search for relevant vectors
      const relevantDocs = this.vectorStore.searchVectors(queryEmbedding, topK);
      console.log(`Found ${relevantDocs.length} relevant documents`);

      // Generate answer using LLM
      const answer = await this.generateAnswer(question, relevantDocs);

      return { answer, relevantDocs };
    } catch (error) {
      console.error('Error querying:', error);
      return { answer: 'Sorry, I could not process your query at this time. Please try again.', relevantDocs: [], error: error.message };
    }
  }

  async generateAnswer(question, relevantDocs) {
    if (relevantDocs.length === 0) {
      return "I couldn't find any relevant information in the uploaded documents to answer your question.";
    }

    const context = relevantDocs.map(doc => doc.text).join('\n\n');

    const messages = [
      {
        role: 'user',
        content: `You are an AI assistant helping users find information in their documents.

Using the provided document excerpts, answer the user's question accurately and concisely. If the information isn't available in the context, say so clearly.

Document context:
${context}

User question: ${question}

Answer based only on the document content provided. Be helpful and direct.`
      }
    ];

    try {
      console.log('Calling OpenRouter API...');
      const answer = await this.callOpenRouter(messages);
      console.log('Generated answer successfully');
      return answer;
    } catch (error) {
      console.error('Error generating answer:', error);
      return 'Sorry, I could not generate an answer at this time. Please check your API key configuration.';
    }
  }
}

export { RAGEngine };
