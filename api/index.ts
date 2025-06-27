import express, { type Request, Response, NextFunction } from "express";

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

// Simple health check for API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve a simple HTML page for all other routes
app.use("*", (_req, res) => {
  res.status(200).set({ "Content-Type": "text/html" }).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Certificate Validator</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
          }
          .content {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 2rem;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          h1 {
            margin: 0 0 1rem 0;
            font-size: 2.5rem;
            font-weight: 300;
          }
          p {
            margin: 0;
            opacity: 0.8;
            font-size: 1.1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>Certificate Validator</h1>
            <p>Sistema de análise de certificados de calibração conforme ISO/IEC 17025</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Export the Express app as a Vercel handler
export default app; 