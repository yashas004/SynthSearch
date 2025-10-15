import fs from 'fs';
import pdf from 'pdf-parse';

class DocumentParser {
  static async parseDocument(fileBuffer, fileName) {
    const extension = fileName.split('.').pop().toLowerCase();

    if (extension === 'pdf') {
      return await this.parsePDF(fileBuffer);
    } else if (extension === 'txt') {
      return this.parseText(fileBuffer);
    } else {
      throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  static async parsePDF(fileBuffer) {
    const data = await pdf(fileBuffer);
    return data.text;
  }

  static parseText(fileBuffer) {
    return fileBuffer.toString('utf8');
  }

  static chunkText(text, chunkSize = 1000) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

export default DocumentParser;
