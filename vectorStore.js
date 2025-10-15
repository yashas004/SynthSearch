class VectorStore {
  constructor(inMemoryStorage) {
    // Use in-memory storage object passed from serverless function
    this.data = inMemoryStorage || { vectors: [], documents: [] };
  }

  addVector(vector, text, meta = {}) {
    const id = Date.now().toString();
    this.data.vectors.push({ id, vector, text, meta });
    return id;
  }

  searchVectors(queryVector, topK = 5) {
    const similarities = this.data.vectors.map(item => ({
      ...item,
      similarity: this.cosineSimilarity(queryVector, item.vector)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, a) => sum + a * a, 0));
    return dotProduct / (normA * normB);
  }

  getAllVectors() {
    return this.data.vectors;
  }

  clear() {
    this.data = { vectors: [], documents: [] };
  }
}

export { VectorStore };
