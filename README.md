# SynthSearch

A search engine that provides synthesized answers using Retrieval-Augmented Generation (RAG) across text and PDF documents.

## Features

- Document ingestion for text (.txt) and PDF (.pdf) files
- Vector embeddings for semantic search
- LLM-powered answer synthesis
- REST API for document ingestion and querying
- Simple web interface for interacting with the system

## Tech Stack

- Node.js and Express.js for backend API
- Transformers.js for generating embeddings (all-MiniLM-L6-v2 model)
- Claude via OpenRouter for answer synthesis
- Simple JSON-based vector storage


## Deployment

### GitHub
All code has been pushed to: https://github.com/yashas004/SynthSearch

### Vercel Deployment
SynthSearch is configured for Vercel deployment:

1. **Requirements**: OpenRouter API key for LLM functionality
2. **Configuration**: `vercel.json` and `.vercelignore` files included
3. **Build**: No build step required (Node.js serverless functions)

**To deploy:**
```bash
# Install Vercel CLI (already done)
npm install -g vercel

# Deploy
vercel --prod

# Set environment variable when prompted
# OPENROUTER_API_KEY=your-openrouter-api-key-here
```

### Local Development
```bash
# Install dependencies
npm install

# Set API key
export OPENROUTER_API_KEY="your-key-here"

# Start development server
npm start

# Access at: http://localhost:3000
```

## Usage

### API Endpoints

#### Ingest Document
```
POST /ingest
Content-Type: multipart/form-data

Form field: document (file)
```

#### Query Documents
```
POST /query
Content-Type: application/json

{
  "question": "Your question here"
}
```

### Web Interface

1. **Document Ingestion**: Upload text or PDF files to build your knowledge base
2. **Query**: Ask questions about your ingested documents

## Project Structure

```
├── index.js                    # Main server file
├── ragEngine.js               # RAG engine implementation
├── docParser.js               # Document parsing utilities
├── embeddingGenerator.js      # Embedding generation using Transformers.js
├── vectorStore.js             # Vector storage and retrieval
├── public/                    # Static web files
│   └── index.html
├── package.json
├── README.md
└── uploads/                   # Temporary upload directory (created automatically)
```

## How it Works

1. **Document Ingestion**:Uploaded documents are parsed, chunked into smaller pieces, and converted into vector embeddings using a pre-trained transformer model.

2. **Query Processing**: User questions are converted to embeddings, and the system performs semantic search to find the most relevant document chunks.

3. **Answer Generation**: The retrieved chunks are sent to Claude via OpenRouter along with the original question to generate a synthesized answer.

## Limitations

- Vector storage is file-based and not optimized for production use
- No advanced chunking strategies or preprocessing
- Simple cosine similarity for retrieval (could be improved with better ranking)

## Future Improvements

- Implement persistent vector database (e.g., Pinecone, Weaviate)
- Add support for more document formats
- Implement advanced chunking and preprocessing
- Add user authentication and document management
- Improve answer quality with prompt engineering

## Prohibited Use

This software is proprietary. No one is permitted to:
- Copy, modify, or distribute this software
- Use it commercially without written permission
- Create derivative works
- Share or publish the source code

## License

All Rights Reserved - Copyright (c) 2025 Yashas Yadav
No permission granted for any use, copying, or distribution without explicit written consent.

See LICENSE file for details.
