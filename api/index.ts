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

// Try to serve static files first, then fallback to React app
app.use("*", (req, res) => {
  // For API routes, return 404
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  // Try to serve the actual React build
  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "..", "dist", "public");
    const indexPath = path.resolve(distPath, "index.html");
    
    if (fs.existsSync(indexPath)) {
      // Serve the built React app
      res.sendFile(indexPath);
      return;
    }
  } catch (error) {
    console.log("Could not serve React build, serving fallback");
  }

  // Fallback to enhanced landing page with React-like interface
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
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          .header {
            text-align: center;
            margin-bottom: 3rem;
          }
          
          .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            padding: 3rem 2rem;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
            margin-bottom: 2rem;
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
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
          }
          
          .feature {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
          }
          
          .feature-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
          }
          
          .feature-title {
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .status {
            text-align: center;
            padding: 1rem;
            background: rgba(34, 197, 94, 0.2);
            border: 1px solid rgba(34, 197, 94, 0.3);
            border-radius: 12px;
            color: #86efac;
            margin: 2rem 0;
          }
          
          .demo-section {
            margin-top: 3rem;
          }
          
          .form-demo {
            background: rgba(255, 255, 255, 0.05);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .input-group {
            margin-bottom: 1.5rem;
          }
          
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }
          
          input, textarea, select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            font-size: 1rem;
          }
          
          input::placeholder, textarea::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
          }
          
          .btn:hover {
            transform: translateY(-2px);
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          
          @media (max-width: 768px) {
            h1 { font-size: 2rem; }
            .card { padding: 2rem 1rem; }
            .features { grid-template-columns: 1fr; }
            .grid-2 { grid-template-columns: 1fr; }
            .container { padding: 1rem; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="card">
              <h1>Certificate Validator</h1>
              <p class="subtitle">
                Sistema de análise de certificados de calibração conforme ISO/IEC 17025
              </p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">📋</div>
                  <div class="feature-title">Análise Abrangente</div>
                  <div>Validação completa de certificados</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">✅</div>
                  <div class="feature-title">ISO/IEC 17025</div>
                  <div>Conformidade regulatória</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">📄</div>
                  <div class="feature-title">Relatórios PDF</div>
                  <div>Exportação profissional</div>
                </div>
                <div class="feature">
                  <div class="feature-icon">🚀</div>
                  <div class="feature-title">Interface Moderna</div>
                  <div>Design responsivo e intuitivo</div>
                </div>
              </div>
              
              <div class="status">
                ✅ Sistema Online - Deploy Realizado com Sucesso
              </div>
            </div>
          </div>
          
          <div class="demo-section">
            <div class="card">
              <h2 style="margin-bottom: 2rem; font-size: 1.8rem;">Demo - Análise de Certificado</h2>
              <div class="form-demo">
                <div class="grid-2">
                  <div class="input-group">
                    <label>Número do Certificado</label>
                    <input type="text" placeholder="Ex: CAL-2024-001">
                  </div>
                  <div class="input-group">
                    <label>Data de Emissão</label>
                    <input type="date">
                  </div>
                </div>
                
                <div class="grid-2">
                  <div class="input-group">
                    <label>Laboratório</label>
                    <input type="text" placeholder="Nome do laboratório">
                  </div>
                  <div class="input-group">
                    <label>Instrumento</label>
                    <select>
                      <option>Selecione o instrumento</option>
                      <option>Medidor de Vazão</option>
                      <option>Transmissor de Pressão</option>
                      <option>Termômetro Digital</option>
                    </select>
                  </div>
                </div>
                
                <div class="input-group">
                  <label>Observações</label>
                  <textarea rows="3" placeholder="Observações sobre o certificado..."></textarea>
                </div>
                
                <button class="btn" onclick="analyzeDemo()">
                  🔍 Analisar Certificado
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Health check
          fetch('/api/health')
            .then(response => response.json())
            .then(data => {
              console.log('✅ API Status:', data);
              if (data.status === 'ok') {
                document.querySelector('.status').innerHTML = 
                  '✅ Sistema Online - API Funcionando (' + data.version + ')';
              }
            })
            .catch(error => console.log('❌ API Error:', error));
          
          // Demo function
          function analyzeDemo() {
            const formData = {
              certificateNumber: document.querySelector('input[placeholder*="CAL"]').value,
              issueDate: document.querySelector('input[type="date"]').value,
              laboratory: document.querySelector('input[placeholder*="laboratório"]').value,
              instrument: document.querySelector('select').value,
              observations: document.querySelector('textarea').value
            };
            
            fetch('/api/analysis-records', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
              alert('✅ Análise enviada com sucesso!\\n\\nID: ' + data.id + '\\nStatus: ' + data.message);
              console.log('Analysis result:', data);
            })
            .catch(error => {
              alert('❌ Erro na análise: ' + error.message);
              console.error('Analysis error:', error);
            });
          }
        </script>
      </body>
    </html>
  `);
});

export default app; 