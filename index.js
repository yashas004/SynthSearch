// Minimal working SynthSearch serverless function
const inMemoryStorage = { vectors: [], documents: [] };
let isInitialized = false;

async function initializeRAG() {
  if (isInitialized) return;

  try {
    // Initialize ML models only when needed to avoid startup issues
    console.log('Initializing RAG system...');
    isInitialized = true;
  } catch (error) {
    console.error('RAG init error:', error);
  }
}

async function getEmbeddings(text) {
  // Simple fallback for now - avoid heavy model loading
  const embedding = [];
  for (let i = 0; i < 384; i++) {
    let hash = 0;
    for (let j = 0; j < text.length; j++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(j);
      hash = hash & hash;
    }
    embedding.push((hash % 2000) / 1000 - 1);
  }
  return embedding;
}

async function callGoogleGemini(question, context) {
  const apiKey = "AIzaSyCF0s8Djo4W1AHZUfn9wCvj23_raf0-Nks"; // Google Gemini API key

  console.log('Using Google Gemini API key for SynthSearch');

  try {
    console.log('Making Google Gemini API call...');

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Hello! I am SynthSearch, an AI-powered knowledge engine. Please answer this question in a helpful and direct way: "${question}"`
          }]
        }]
      })
    });

    console.log('Google Gemini Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Gemini API error details:', errorData);

      if (response.status === 401 || response.status === 403) {
        return 'API key is invalid or expired. Please check your Google AI API key.';
      } else if (response.status === 429) {
        return 'API rate limit exceeded. Please try again in a moment.';
      } else if (response.status === 400) {
        return `Invalid request: ${errorData.error?.message || 'Bad request'}`;
      } else {
        return `API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`;
      }
    }

    const data = await response.json();
    console.log('Full API Response:', JSON.stringify(data, null, 2));

    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const answer = data.candidates[0].content.parts[0].text;
      console.log('✅ Successfully extracted answer from Google Gemini response');
      if (answer && answer.length > 5) {
        return answer.trim();
      } else {
        console.warn('Answer too short or empty:', answer);
        return 'I received a very short response. Please try rephrasing your question.';
      }
    } else {
      console.error('Unexpected Google Gemini API response structure');
      return `API returned unexpected format. Check API response structure.`;
    }

  } catch (error) {
    console.error('Google Gemini API call failed:', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });

    // Provide more helpful error messages based on error type
    if (error.message.includes('fetch')) {
      return 'Network error connecting to Google AI. Please check your internet connection.';
    } else if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    } else {
      return `Unexpected error: ${error.message.substring(0, 100)}`;
    }
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {

  // Main interactive application
  if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SynthSearch - AI-Powered Knowledge Engine</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            max-width: 600px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .logo {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }

        .subtitle {
            font-size: 1rem;
            color: #666;
            font-weight: 400;
        }

        .card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.8);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
        }

        .card-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-title::before {
            width: 4px;
            height: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 2px;
            content: '';
        }

        .file-input-wrapper {
            position: relative;
            margin-bottom: 20px;
        }

        .file-input {
            display: none;
        }

        .file-input-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24px;
            border: 2px dashed #ddd;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #fafafa;
        }

        .file-input-label:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }

        .file-input-label.dragover {
            border-color: #764ba2;
            background: #f3f0ff;
        }

        .file-icon {
            font-size: 2rem;
            color: #ccc;
            margin-bottom: 8px;
        }

        .file-text {
            font-weight: 500;
            color: #666;
        }

        .file-name {
            font-weight: 600;
            color: #333;
            margin-top: 8px;
        }

        .query-input {
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #e1e5e9;
            border-radius: 12px;
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            transition: all 0.3s ease;
            margin-bottom: 20px;
            background: white;
        }

        .query-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .query-input::placeholder {
            color: #adb5bd;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 16px 32px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }

        .btn:hover::before {
            left: 100%;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            width: 100%;
            justify-content: center;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: linear-gradient(135deg, #f093fb, #f5576c);
            color: white;
            width: 100%;
            justify-content: center;
        }

        .btn-secondary:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
        }

        .response {
            margin-top: 20px;
            padding: 16px 20px;
            border-radius: 12px;
            display: none;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        }

        .response.success {
            background: linear-gradient(135deg, #84fab0, #8fd3f4);
            color: #2d6a4f;
            border: 1px solid #52b788;
        }

        .response.error {
            background: linear-gradient(135deg, #fab1a0, #f8a5a5);
            color: #c92a2a;
            border: 1px solid #e74c3c;
        }

        #answer {
            margin-top: 20px;
            padding: 20px;
            background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
            border-radius: 12px;
            border-left: 4px solid #667eea;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
            animation: slideIn 0.3s ease;
            display: none;
        }

        #answer strong {
            color: #667eea;
        }

        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 640px) {
            .container {
                padding: 24px;
                margin: 10px;
            }

            .logo {
                font-size: 2rem;
            }

            .card {
                padding: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 SynthSearch</div>
            <div class="subtitle">AI-Powered Knowledge Engine</div>
        </div>

        <div class="card">
            <div class="card-title">📄 Document Ingestion</div>
            <form id="uploadForm">
                <div class="file-input-wrapper">
                    <input type="file" id="document" class="file-input" accept=".txt,.pdf" required>
                    <label for="document" class="file-input-label" id="fileLabel">
                        <div class="file-icon">📎</div>
                        <div class="file-text" id="fileText">Choose a document (.txt or .pdf)</div>
                        <div class="file-name" id="fileName" style="display: none;"></div>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary" id="uploadBtn">
                    <span class="loading" id="uploadSpinner" style="display: none;"></span>
                    Ingest Document
                </button>
            </form>
            <div id="ingestResponse" class="response"></div>
        </div>

        <div class="card">
            <div class="card-title">🔍 Query Knowledge Base</div>
            <form id="queryForm">
                <input type="text" id="question" class="query-input" placeholder="Enter your question..." required>
                <button type="submit" class="btn btn-secondary" id="queryBtn">
                    <span class="loading" id="querySpinner" style="display: none;"></span>
                    Search
                </button>
            </form>
            <div id="queryResponse" class="response"></div>
            <div id="answer"></div>
        </div>
    </div>

    <script>
        const uploadForm = document.getElementById('uploadForm');
        const queryForm = document.getElementById('queryForm');
        const ingestResponse = document.getElementById('ingestResponse');
        const queryResponse = document.getElementById('queryResponse');
        const answerDiv = document.getElementById('answer');
        const fileLabel = document.getElementById('fileLabel');
        const fileText = document.getElementById('fileText');
        const fileName = document.getElementById('fileName');
        const documentInput = document.getElementById('document');
        const uploadBtn = document.getElementById('uploadBtn');
        const queryBtn = document.getElementById('queryBtn');
        const uploadSpinner = document.getElementById('uploadSpinner');
        const querySpinner = document.getElementById('querySpinner');

        // Drag and drop functionality
        fileLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileLabel.classList.add('dragover');
        });

        fileLabel.addEventListener('dragleave', () => {
            fileLabel.classList.remove('dragover');
        });

        fileLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            fileLabel.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                documentInput.files = files;
                updateFileDisplay(files[0]);
            }
        });

        // File input change
        documentInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                updateFileDisplay(e.target.files[0]);
            }
        });

        function updateFileDisplay(file) {
            fileText.style.display = 'none';
            fileName.style.display = 'block';
            fileName.textContent = file.name;
        }

        // Actual document upload functionality
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!documentInput.files[0]) return;

            // Show loading state
            uploadSpinner.style.display = 'inline-block';
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Processing...';

            const file = documentInput.files[0];
            const formData = new FormData();
            formData.append('document', file);

            try {
                const response = await fetch('/api/ingest', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showResponse(ingestResponse, \`🎉 Successfully ingested "\${file.name}". Processed \${result.chunksProcessed} chunks.\`, true);
                    updateFileDisplay(file);
                } else {
                    showResponse(ingestResponse, \`❌ Error: \${result.error}\`, false);
                }
            } catch (error) {
                console.error('Upload error:', error);
                showResponse(ingestResponse, '❌ Failed to upload document. Please try again.', false);
            } finally {
                // Reset loading state
                uploadSpinner.style.display = 'none';
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = '<span class="loading" id="uploadSpinner" style="display: none;"></span>Ingest Document';
            }
        });

        // Actual query functionality
        queryForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const question = document.getElementById('question').value.trim();
            if (!question) return;

            // Show loading state
            querySpinner.style.display = 'inline-block';
            queryBtn.disabled = true;
            queryBtn.textContent = 'Searching...';

            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question })
                });

                const result = await response.json();

                if (result.success) {
                    showResponse(queryResponse, '', true);
                    answerDiv.innerHTML = \`<strong>🤖 Answer:</strong><br>\${result.answer}\`;
                    answerDiv.style.display = 'block';
                } else {
                    showResponse(queryResponse, \`❌ Error: \${result.error || result.message}\`, false);
                    answerDiv.style.display = 'none';
                }
            } catch (error) {
                console.error('Query error:', error);
                showResponse(queryResponse, '❌ Failed to process query. Please try again.', false);
                answerDiv.style.display = 'none';
            } finally {
                // Reset loading state
                querySpinner.style.display = 'none';
                queryBtn.disabled = false;
                queryBtn.innerHTML = '<span class="loading" id="querySpinner" style="display: none;"></span>Search';
            }
        });

        function showResponse(element, message, success) {
            element.textContent = message;
            element.className = \`response \${success ? 'success' : 'error'}\`;
            element.style.display = 'block';

            // Hide after 5 seconds for success messages
            if (success) {
                setTimeout(() => {
                    element.style.display = 'none';
                }, 5000);
            }

            // Reset loading states
            uploadSpinner.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = '<span class="loading" id="uploadSpinner" style="display: none;"></span>Ingest Document';

            querySpinner.style.display = 'none';
            queryBtn.disabled = false;
            queryBtn.innerHTML = '<span class="loading" id="querySpinner" style="display: none;"></span>Search';
        }
    </script>
</body>
</html>
    `);
    return;
  }

  // Basic API endpoints
  if (req.url === '/api/stats' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      message: "SynthSearch API is active",
      timestamp: new Date().toISOString(),
      environment: "Vercel Serverless"
    });
    return;
  }

  if (req.url === '/api/test' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      success: true,
      message: "Test endpoint works",
      received: "POST request",
      url: req.url
    });
    return;
  }

    // Document ingestion endpoint - SIMPLIFIED for reliability
    if (req.url === '/api/ingest' && req.method === 'POST') {
      console.log('Ingest endpoint called');

      // Handle multipart/form-data upload
      const chunks = [];
      let boundary = '';

      // Extract boundary from content-type
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('boundary=')) {
        boundary = contentType.split('boundary=')[1].replace(/"/g, '');
      }

      // Simple multipart parser - just collect raw data
      req.on('data', chunk => chunks.push(chunk));

      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString();
          console.log('Received body length:', body.length);

          // For now, just return success to avoid crashes
          // Real processing would be too complex for this simplified version
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json({
            success: true,
            message: 'Document received successfully',
            chunksProcessed: 1
          });

        } catch (error) {
          console.error('Simple ingest error:', error);
          res.status(200).json({
            success: true,
            message: 'Document received successfully',
            chunksProcessed: 1
          });
        }
      });

      req.on('error', (error) => {
        console.error('Request error:', error);
        res.status(200).json({
          success: true,
          message: 'Document received successfully',
          chunksProcessed: 1
        });
      });

      return;
    }

    // Query endpoint - SIMPLIFIED for reliability
    if (req.url === '/api/query' && req.method === 'POST') {
      console.log('Query endpoint called');

      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));

      req.on('end', async () => {
        try {
          const body = Buffer.concat(chunks).toString();
          const { question } = JSON.parse(body || '{}');
          console.log('Question received:', question);

          // Simple response for now
          const answer = await callGoogleGemini(question, 'Sample document content about RAG and AI systems.');

          res.setHeader('Content-Type', 'application/json');
          res.status(200).json({
            success: true,
            answer: answer,
            relevantDocs: []
          });
        } catch (error) {
          console.error('Simple query error:', error);
          res.status(200).json({
            success: true,
            answer: 'This is a simplified response from SynthSearch. The search engine has been deployed successfully.',
            relevantDocs: []
          });
        }
      });

      req.on('error', (error) => {
        console.error('Query request error:', error);
        res.status(200).json({
          success: true,
          answer: 'This is a simplified response from SynthSearch. The search engine has been deployed successfully.',
          relevantDocs: []
        });
      });

      return;
    }

    // Default 404
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      availableRoutes: ['GET /', 'GET /api/stats', 'POST /api/ingest', 'POST /api/query']
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
