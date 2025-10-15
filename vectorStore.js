const fs = require('fs');
const path = require('path');

class VectorStore {
  constructor(storagePath = './vectorstore.json') {
    this.storagePath = storagePath;
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading vector store data:', error);
    }
    return { vectors: [], documents: [] };
  }

  saveData() {
    try {
      fs.writeFileSync(this.storagePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving vector store data:', error);
    }
  }

  addVector(vector, text, meta = {}) {
    const id = Date.now().toString();
    this.data.vectors.push({ id, vector, text, meta });
    this.saveData();
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
    this.saveData();
  }
}

module.exports = VectorStore;
