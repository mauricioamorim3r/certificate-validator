import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all analysis records
  app.get("/api/analysis-records", async (req, res) => {
    try {
      const records = await storage.getAllAnalysisRecords();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis records" });
    }
  });

  // Get single analysis record
  app.get("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const record = await storage.getAnalysisRecord(id);
      if (!record) {
        return res.status(404).json({ message: "Analysis record not found" });
      }

      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analysis record" });
    }
  });

  // Create new analysis record
  app.post("/api/analysis-records", async (req, res) => {
    try {
      console.log("Received data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertAnalysisRecordSchema.parse(req.body);
      const record = await storage.createAnalysisRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Erro de validação", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      res.status(500).json({ message: "Falha ao criar registro de análise", error: error.message });
    }
  });

  // Update analysis record
  app.put("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const validatedData = insertAnalysisRecordSchema.partial().parse(req.body);
      const record = await storage.updateAnalysisRecord(id, validatedData);
      
      if (!record) {
        return res.status(404).json({ message: "Analysis record not found" });
      }

      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update analysis record" });
    }
  });

  // Delete analysis record
  app.delete("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const deleted = await storage.deleteAnalysisRecord(id);
      if (!deleted) {
        return res.status(404).json({ message: "Analysis record not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete analysis record" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
