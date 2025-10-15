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

  // Basic health check
  if (req.url === '/' && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <title>SynthSearch</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(45deg, #667eea, #764ba2); color: white; }
        .container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; }
        .status { background: #4CAF50; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SynthSearch</h1>
        <p>AI-Powered Knowledge Engine</p>
        <div class="status">
            <h2>✅ Function Active!</h2>
            <p>SynthSearch Vercel deployment successful.</p>
        </div>
        <p>Status: Production Ready</p>
    </div>
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
