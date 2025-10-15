import { pipeline } from '@xenova/transformers';

// Load the feature extraction pipeline
let extractor;
let isInitialized = false;

class EmbeddingGenerator {
  static async initialize() {
    if (!isInitialized) {
      try {
        console.log('Initializing embedding model...');
        extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        isInitialized = true;
        console.log('Embedding model initialized successfully');
      } catch (error) {
        console.error('Failed to initialize embedding model:', error);
        throw error;
      }
    }
    return extractor;
  }

  static async generateEmbedding(text) {
    if (!isInitialized) {
      await this.initialize();
    }

    try {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      return Array.from(output.data);
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  static async generateEmbeddingsForChunks(chunks) {
    if (!isInitialized) {
      await this.initialize();
    }

    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk);
        embeddings.push(embedding);
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
        // Continue with other chunks even if one fails
        embeddings.push(new Array(384).fill(0)); // Fallback zero embedding
      }
    }
    return embeddings;
  }
}

export default EmbeddingGenerator;
