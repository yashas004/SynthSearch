// Vercel serverless function export
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const RAGEngine = require('./ragEngine');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Set up multer for file uploads
const storage = multer.memoryStorage(); // Use memory storage for Vercel
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .pdf files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Initialize RAG Engine
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
const ragEngine = new RAGEngine(OPENROUTER_API_KEY);

// Routes
app.post('/api/ingest', upload.single('document'), async (req, res) => {
  try {
    console.log('API route hit - processing ingest request');

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname, 'Size:', req.file.size);

    // Skip actual processing for now - just test file reception
    return res.json({
      success: true,
      message: `File received: ${req.file.originalname} (${req.file.size} bytes). Processing disabled for testing.`
    });

    // Temporarily commented out processing
    /*
    // For Vercel, we need to process the file from memory
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    console.log('Processing file:', fileName, 'Size:', fileBuffer.length);

    // Create a temporary file from buffer for processing
    const tempPath = `/tmp/${Date.now()}-${fileName}`;
    fs.writeFileSync(tempPath, fileBuffer);

    console.log('Created temp file:', tempPath);
    const result = await ragEngine.ingestDocument(tempPath);

    // Clean up temp file
    fs.unlinkSync(tempPath);

    if (result.success) {
      res.json({ success: true, message: `Document ingested successfully. ${result.chunksProcessed} chunks processed.` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
    */

  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ success: false, error: `Server error: ${error.message}` });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    console.log('Query received:', question);

    const result = await ragEngine.query(question);
    console.log('Query result:', result);

    if (result.error) {
      res.status(500).json({ success: false, error: result.error });
    } else {
      res.json({ success: true, answer: result.answer, relevantDocs: result.relevantDocs });
    }
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for Vercel
module.exports = app;
