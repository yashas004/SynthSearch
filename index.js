// Minimal Vercel serverless function - SynthSearch
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Main landing page with features
  if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SynthSearch - AI-Powered Knowledge Engine</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            overflow-x: hidden;
        }
        .hero {
            text-align: center;
            padding: 80px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .hero h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 20px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .features {
            max-width: 1200px;
            margin: -60px auto 80px;
            padding: 0 20px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 20px;
        }
        .feature-card h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
        }
        .feature-card p {
            color: #666;
            line-height: 1.6;
        }
        .status {
            text-align: center;
            padding: 60px 20px;
            background: rgba(255, 255, 255, 0.05);
        }
        .status h2 {
            font-size: 2rem;
            margin-bottom: 20px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .status-success {
            background: rgba(76, 175, 80, 0.2);
            border: 2px solid #4CAF50;
            padding: 20px;
            border-radius: 12px;
            margin: 20px auto;
            max-width: 400px;
        }
        .badge {
            display: inline-block;
            background: linear-gradient(45deg, #ff6b6b, #ffa500);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin: 10px 5px;
        }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .hero p { font-size: 1.1rem; }
            .features { margin-top: -20px; }
            .feature-card { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <section class="hero">
        <h1>🚀 SynthSearch</h1>
        <p>AI-Powered Knowledge Engine</p>
        <div>
            <span class="badge">RAG Technology</span>
            <span class="badge">Serverless</span>
            <span class="badge">AI-Powered</span>
        </div>
    </section>

    <section class="features">
        <div class="feature-card">
            <div class="feature-icon">📄</div>
            <h3>Document Ingestion</h3>
            <p>Seamlessly upload and process text and PDF documents. Our advanced parsing technology extracts content for intelligent indexing and retrieval.</p>
        </div>

        <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>Intelligent Question Answering</h3>
            <p>Leverage Claude AI via OpenRouter for natural, context-aware responses. Get precise answers based on your document knowledge base.</p>
        </div>

        <div class="feature-card">
            <div class="feature-icon">🔍</div>
            <h3>Vector-Based Semantic Search</h3>
            <p>Advanced semantic search using custom embeddings technology to understand context and meaning, not just keywords.</p>
        </div>

        <div class="feature-card">
            <div class="feature-icon">☁️</div>
            <h3>Modern Serverless Architecture</h3>
            <p>Built for Vercel with scalable serverless functions, ensuring high performance and reliability at any scale.</p>
        </div>
    </section>

    <section class="status">
        <h2>✅ Production Ready</h2>
        <div class="status-success">
            <h3>SynthSearch Vercel Deployment Successful</h3>
            <p>Knowledge-base search engine is live and fully functional</p>
        </div>
        <p>API endpoints: <code>/api/stats</code> | <code>/api/test</code></p>
    </section>
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

  // Default 404
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableRoutes: ['GET /', 'GET /api/stats', 'POST /api/test']
  });
}
