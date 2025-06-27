import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

// Logging middleware para debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body ? Object.keys(req.body) : '');
  next();
});

// Static files - serve React build assets
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.resolve(__dirname, "..", "dist", "public");

// Serve static assets (CSS, JS, images, etc.)
app.use("/assets", express.static(path.resolve(publicPath, "assets")));
app.use("/manifest.json", express.static(path.resolve(publicPath, "manifest.json")));
app.use("/sw.js", express.static(path.resolve(publicPath, "sw.js")));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: "production"
  });
});

// Analysis records API
app.get("/api/analysis-records", (req, res) => {
  res.json([]);
});

app.post("/api/analysis-records", (req, res) => {
  console.log("Creating analysis record:", req.body);
  res.status(201).json({ 
    success: true, 
    message: "Registro de análise criado com sucesso",
    id: Date.now(),
    data: req.body 
  });
});

app.get("/api/analysis-records/:id", (req, res) => {
  res.json({
    id: req.params.id,
    message: "Record found"
  });
});

// Regulatory data endpoints
app.get("/api/regulatory/max-uncertainty-systems", (req, res) => {
  res.json({
    data: [],
    message: "Dados de incerteza máxima em desenvolvimento"
  });
});

app.get("/api/regulatory/max-uncertainty-components", (req, res) => {
  res.json({
    data: [],
    message: "Componentes de incerteza em desenvolvimento"
  });
});

app.get("/api/regulatory/inspection-periodicities", (req, res) => {
  res.json({
    data: [],
    message: "Periodicidades de inspeção em desenvolvimento"
  });
});

app.get("/api/regulatory/calibration-periodicities-gas", (req, res) => {
  res.json({
    data: [],
    message: "Periodicidades de calibração para gás em desenvolvimento"
  });
});

app.get("/api/regulatory/calibration-periodicities-petroleum", (req, res) => {
  res.json({
    data: [],
    message: "Periodicidades de calibração para petróleo em desenvolvimento"
  });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API Error:", err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

// Serve React app for all other routes
app.use("*", (req, res) => {
  // For API routes that don't exist, return 404
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Serve the React app index.html for all other routes
  const indexPath = path.resolve(publicPath, "index.html");
  
  if (fs.existsSync(indexPath)) {
    console.log("Serving React app from:", indexPath);
    res.sendFile(indexPath);
  } else {
    console.log("React build not found, serving fallback");
    res.status(200).set({ "Content-Type": "text/html" }).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <title>Certificate Validator - Loading...</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0;
            }
            .loading {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 16px;
              backdrop-filter: blur(20px);
            }
          </style>
        </head>
        <body>
          <div class="loading">
            <h1>Certificate Validator</h1>
            <p>Carregando aplicação React...</p>
            <p>Build não encontrado em: ${indexPath}</p>
          </div>
        </body>
      </html>
    `);
  }
});

export default app; 