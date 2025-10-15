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
    console.log('🔥 API ROUTE HIT - INGEST REQUEST RECEIVED');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('File:', req.file ? `Present: ${req.file.originalname}` : 'Not present');

    // Add CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        debug: 'File validation failed'
      });
    }

    console.log('✅ File received successfully:', req.file.originalname, 'Size:', req.file.size);

    // Test response - immediate success to confirm API is working
    return res.json({
      success: true,
      message: `🎉 File uploaded successfully! Name: ${req.file.originalname} (${req.file.size} bytes)`,
      debug: 'API route working, file received correctly'
    });

  } catch (error) {
    console.error('❌ Ingestion error:', error);
    return res.status(500).json({
      success: false,
      error: `Server error: ${error.message}`,
      debug: 'Something went wrong in processing'
    });
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
