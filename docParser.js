import pdfParse from 'pdf-parse';

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
    try {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing failed:', error);
      throw new Error('Failed to parse PDF document');
    }
  }

  static parseText(fileBuffer) {
    return fileBuffer.toString('utf8');
  }

  static chunkText(text, chunkSize = 1000) {
    const words = text.trim().split(/\s+/);
    const chunks = [];

    for (let i = 0; i < words.length; i += Math.floor(chunkSize / 7)) { // Approx 7 chars per word
      const chunkWords = words.slice(i, i + Math.floor(chunkSize / 7));
      chunks.push(chunkWords.join(' '));
    }

    return chunks.length > 0 ? chunks : [text];
  }
}

export default DocumentParser;
