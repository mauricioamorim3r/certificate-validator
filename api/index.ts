import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Mock API endpoints para manter compatibilidade
app.post("/api/analyze", (req, res) => {
  res.json({ 
    success: true, 
    message: "Análise em desenvolvimento",
    data: req.body 
  });
});

app.get("/api/regulatory-data", (req, res) => {
  res.json({
    data: [],
    message: "Dados regulatórios em desenvolvimento"
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

// Serve static files or fallback HTML
app.use("*", (req, res) => {
  // For API routes, return 404
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // For all other routes, serve the main application
  res.status(200).set({ "Content-Type": "text/html" }).send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <title>Certificate Validator</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Sistema de análise de certificados de calibração conforme ISO/IEC 17025">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            padding: 3rem 2rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
          }
          
          .card:hover {
            transform: translateY(-5px);
          }
          
          h1 {
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
            line-height: 1.6;
          }
          
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
          }
          
          .feature {
            background: rgba(255, 255, 255, 0.05);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .feature-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          
          .status {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 12px;
            color: #86efac;
          }
          
          @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .card { padding: 2rem 1rem; }
            .features { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <h1>Certificate Validator</h1>
            <p class="subtitle">
              Sistema de análise de certificados de calibração conforme ISO/IEC 17025
            </p>
            
            <div class="features">
              <div class="feature">
                <div class="feature-icon">📋</div>
                <div>Análise Abrangente</div>
              </div>
              <div class="feature">
                <div class="feature-icon">✅</div>
                <div>ISO/IEC 17025</div>
              </div>
              <div class="feature">
                <div class="feature-icon">📄</div>
                <div>Relatórios PDF</div>
              </div>
              <div class="feature">
                <div class="feature-icon">🚀</div>
                <div>Interface Moderna</div>
              </div>
            </div>
            
            <div class="status">
              ✅ Sistema Online - Deploy Realizado com Sucesso
            </div>
          </div>
        </div>
        
        <script>
          // Basic health check
          fetch('/api/health')
            .then(response => response.json())
            .then(data => console.log('API Status:', data))
            .catch(error => console.log('API not available:', error));
        </script>
      </body>
    </html>
  `);
});

export default app; 