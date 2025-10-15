const { pipeline } = require('@xenova/transformers');

// Load the feature extraction pipeline
let extractor;

class EmbeddingGenerator {
  static async initialize() {
    if (!extractor) {
      extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return extractor;
  }

  static async generateEmbedding(text) {
    if (!extractor) {
      await this.initialize();
    }

    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  }

  static async generateEmbeddingsForChunks(chunks) {
    const embeddings = [];
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

module.exports = EmbeddingGenerator;
