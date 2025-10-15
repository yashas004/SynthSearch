// Restore proper embedding generator with Transformers.js for actual functionality
// Use conditional loading to avoid serverless issues

class EmbeddingGenerator {
  static extractor = null;
  static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('Initializing Transformers.js embedding model...');

      // Use dynamic import to avoid static loading issues
      const { pipeline } = await import('@xenova/transformers');

      this.extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      this.isInitialized = true;
      console.log('Embedding model initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      // Fallback to hash-based embeddings
      console.log('Using hash-based embedding fallback');
      return false;
    }
  }

  static async generateEmbedding(text) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.extractor) {
      try {
        const output = await this.extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
      } catch (error) {
        console.error('Transformer embedding failed, using fallback:', error.message);
      }
    }

    // Fallback: hash-based embedding
    const embedding = [];
    for (let i = 0; i < 384; i++) {
      let hash = 0;
      for (let j = 0; j < text.length; j++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(j);
        hash = hash & hash;
      }
      embedding.push((hash % 2000) / 1000 - 1);
    }
    return embedding;
  }

  static async generateEmbeddingsForChunks(chunks) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const embeddings = [];
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk);
        embeddings.push(embedding);
      } catch (error) {
        console.error('Error generating embedding for chunk:', error);
        embeddings.push(new Array(384).fill(0)); // Fallback zero embedding
      }
    }
    return embeddings;
  }
}

export default EmbeddingGenerator;
