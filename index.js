const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RAGEngine = require('./ragEngine');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Initialize RAG Engine
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "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";
if (!OPENROUTER_API_KEY) {
  console.error('Please set the OPENROUTER_API_KEY environment variable');
  process.exit(1);
}
const ragEngine = new RAGEngine(OPENROUTER_API_KEY);

// Routes
app.post('/ingest', upload.single('document'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await ragEngine.ingestDocument(filePath);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    if (result.success) {
      res.json({ success: true, message: `Document ingested successfully. ${result.chunksProcessed} chunks processed.` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/query', async (req, res) => {
  try {
    const { question } = req.body;
    const result = await ragEngine.query(question);

    if (result.error) {
      res.status(500).json({ success: false, error: result.error });
    } else {
      res.json({ success: true, answer: result.answer, relevantDocs: result.relevantDocs });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Knowledge-base Search Engine running at http://localhost:${port}`);
});
