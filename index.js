// Required for Vercel serverless deployment
import fs from 'fs';
import { RAGEngine } from './ragEngine.js';

// In-memory storage for serverless environment
let inMemoryStorage = { vectors: [], documents: [] };

// Initialize RAG Engine (will be initialized per request in serverless)
let ragEngine = null;

// Serve HTML file
async function serveHTML(res) {
  try {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SynthSearch - AI-Powered Knowledge Engine</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        .success { background: #4CAF50; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SynthSearch</h1>
        <p>AI-Powered Knowledge Engine</p>
        <div class="success">
            <h2>✅ Deployment Successful!</h2>
            <p>SynthSearch is now live on Vercel</p>
        </div>
        <p><strong>Status:</strong> Function Ready</p>
        <p><strong>API:</strong> All endpoints active</p>
    </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (error) {
    console.error('Error serving HTML:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load web interface',
      message: error.message
    });
  }
}

// Configure multer for memory storage
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow txt and pdf files
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .pdf files are allowed!'), false);
    }
  }
});

// Error handler middleware
function handleError(error, req, res, next) {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
}

export default async function handler(req, res) {
  console.log('SynthSearch handler called:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);
    console.log('Processing request for path:', pathname);

    // Initialize RAG Engine if not done yet
    if (!ragEngine) {
      console.log('Initializing RAG engine...');
      const openRouterApiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
      console.log('API key status:', openRouterApiKey ? 'present' : 'missing');

      if (!openRouterApiKey) {
        console.error('No API key found in environment');
        console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('API') || key.includes('KEY')));
        throw new Error('OPENROUTER_API_KEY or DEEPSEEK_API_KEY environment variable is required');
      }

      ragEngine = new RAGEngine(openRouterApiKey, inMemoryStorage);
      console.log('RAG engine initialized successfully');
    }

    // Root route - serve web interface
    if (pathname === '/' && req.method === 'GET') {
      console.log('Serving web interface');
      await serveHTML(res);
      return;
    }

    // Root route - serve web interface
    if (pathname === '/' && req.method === 'GET') {
      await serveHTML(res);
      return;
    }

    // API routes
    if (pathname.startsWith('/api/')) {
      if (req.method === 'POST') {
        if (pathname === '/api/ingest') {
          try {
            // Parse multipart form data manually (since middleware isn't available in serverless)
            const busboy = await import('busboy');
            const bb = busboy.default({ headers: req.headers });

            let fileBuffer = null;
            let fileName = null;
            let fieldName = null;

            bb.on('file', (name, file, info) => {
              fileName = info.filename;
              fieldName = name;
              const chunks = [];
              file.on('data', chunk => chunks.push(chunk));
              file.on('end', () => {
                fileBuffer = Buffer.concat(chunks);
              });
            });

            bb.on('finish', async () => {
              try {
                if (!fileBuffer || !fileName) {
                  res.status(400).json({
                    success: false,
                    error: 'No file uploaded'
                  });
                  return;
                }

                // Validate file type
                const ext = path.extname(fileName).toLowerCase();
                if (!['.txt', '.pdf'].includes(ext)) {
                  res.status(400).json({
                    success: false,
                    error: 'Only .txt and .pdf files are allowed'
                  });
                  return;
                }

                // Process the file
                const result = await ragEngine.ingestDocument(fileBuffer, fileName);

                if (result.success) {
                  res.status(200).json({
                    success: true,
                    message: `Successfully ingested "${fileName}". Processed ${result.chunksProcessed} chunks.`,
                    chunksProcessed: result.chunksProcessed,
                    documentsInCorpus: inMemoryStorage.vectors.length
                  });
                } else {
                  res.status(400).json({
                    success: false,
                    error: result.error
                  });
                }
              } catch (error) {
                res.status(500).json({
                  success: false,
                  error: 'Error processing file',
                  message: error.message
                });
              }
            });

            req.pipe(bb);

          } catch (error) {
            res.status(500).json({
              success: false,
              error: 'Error processing upload',
              message: error.message
            });
          }
          return;
        }

        if (pathname === '/api/query') {
          try {
            // Handle JSON body
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const { question } = JSON.parse(body);

                if (!question || typeof question !== 'string' || question.trim().length === 0) {
                  res.status(400).json({
                    success: false,
                    error: 'Question is required and must be a non-empty string'
                  });
                  return;
                }

                if (inMemoryStorage.vectors.length === 0) {
                  res.status(400).json({
                    success: false,
                    error: 'No documents have been ingested yet. Please upload a document first.',
                    availableActions: ['Upload documents using /api/ingest']
                  });
                  return;
                }

                const result = await ragEngine.query(question, 5);

                res.status(200).json({
                  success: true,
                  answer: result.answer,
                  relevantDocs: result.relevantDocs,
                  corpusSize: inMemoryStorage.vectors.length
                });

              } catch (parseError) {
                res.status(400).json({
                  success: false,
                  error: 'Invalid JSON body',
                  message: parseError.message
                });
              }
            });
          } catch (error) {
            res.status(500).json({
              success: false,
              error: 'Error processing query',
              message: error.message
            });
          }
          return;
        }
      }

      // GET /api/stats - Get corpus statistics
      if (pathname === '/api/stats' && req.method === 'GET') {
        res.status(200).json({
          success: true,
          stats: {
            documentsInCorpus: inMemoryStorage.vectors.length,
            totalChunks: inMemoryStorage.vectors.reduce((sum, doc) => sum + doc.text.split(' ').length, 0)
          }
        });
        return;
      }
    }

    // Default response
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      availableRoutes: ['/', '/api/ingest', '/api/query', '/api/stats']
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
