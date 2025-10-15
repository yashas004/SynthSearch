const fs = require('fs');
const pdf = require('pdf-parse');

class DocumentParser {
  static async parseDocument(filePath) {
    const extension = filePath.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      return await this.parsePDF(filePath);
    } else if (extension === 'txt') {
      return this.parseText(filePath);
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  static async parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  static parseText(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  static chunkText(text, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

module.exports = DocumentParser;
