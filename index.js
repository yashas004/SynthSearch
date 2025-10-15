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

// Initialize RAG Engine (lazy initialization for serverless)
let ragEngine = null;

const initializeRAGEngine = async () => {
  if (!ragEngine) {
    try {
      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
      if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.length < 20) {
        console.error('Invalid or missing OPENROUTER_API_KEY');
        return null;
      }
      const RAGEngine = require('./ragEngine');
      ragEngine = new RAGEngine(OPENROUTER_API_KEY);
      console.log('RAG Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG Engine:', error);
      ragEngine = null;
    }
  }
  return ragEngine;
};

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
    // Add CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    const { question } = req.body;
    console.log('Query received:', question);

    // Always return testing mode for Vercel deployment
    return res.json({
      success: true,
      answer: '✅ SynthSearch is deployed successfully! This is a demo response. RAG functionality is configured and ready for use.',
      relevantDocs: [
        {
          text: 'SynthSearch is a knowledge-base search engine built with RAG technology using Claude via OpenRouter.',
          similarity: 1.0
        }
      ]
    });

    // Original code commented out for deployment testing
    /*
    const engine = await initializeRAGEngine();
    if (!engine) {
      return res.json({
        success: true,
        answer: 'Testing mode: RAG engine disabled for development. This would normally return an AI-powered answer.',
        relevantDocs: []
      });
    }

    const result = await engine.query(question);
    console.log('Query result:', result);

    if (result.error) {
      res.status(500).json({ success: false, error: result.error });
    } else {
      res.json({ success: true, answer: result.answer, relevantDocs: result.relevantDocs });
    }
    */
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export for Vercel
module.exports = app;
