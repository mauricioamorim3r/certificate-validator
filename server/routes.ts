import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisRecordSchema } from "@shared/schema";
import { z } from "zod";
import { RegulatoryDataService } from "./regulatory-data";

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
      // Log only in development
      if (process.env.NODE_ENV === "development") {
        console.log("Received data:", JSON.stringify(req.body, null, 2));
      }
      const validatedData = insertAnalysisRecordSchema.parse(req.body);
      const record = await storage.createAnalysisRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating record:", error);
      }
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Erro de validação",
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      res.status(500).json({
        message: "Falha ao criar registro de análise",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // Update analysis record
  app.put("/api/analysis-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid record ID" });
      }

      const validatedData = insertAnalysisRecordSchema
        .partial()
        .parse(req.body);
      const record = await storage.updateAnalysisRecord(id, validatedData);

      if (!record) {
        return res.status(404).json({ message: "Analysis record not found" });
      }

      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
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

  // Regulatory Data API Routes
  app.get("/api/regulatory/max-uncertainty-systems", async (req, res) => {
    try {
      const category = req.query.category as "petroleum" | "natural_gas" | undefined;
      const data = category 
        ? RegulatoryDataService.getMaxUncertaintySystemsByCategory(category)
        : RegulatoryDataService.getAllMaxUncertaintySystems();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch max uncertainty systems" });
    }
  });

  app.get("/api/regulatory/max-uncertainty-components", async (req, res) => {
    try {
      const data = RegulatoryDataService.getAllMaxUncertaintyComponents();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch max uncertainty components" });
    }
  });

  app.get("/api/regulatory/inspection-periodicities", async (req, res) => {
    try {
      const category = req.query.category as "petroleum" | "natural_gas" | undefined;
      const data = category 
        ? RegulatoryDataService.getInspectionPeriodicitiesByCategory(category)
        : [...RegulatoryDataService.getInspectionPeriodicitiesByCategory("petroleum"), 
           ...RegulatoryDataService.getInspectionPeriodicitiesByCategory("natural_gas")];
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspection periodicities" });
    }
  });

  app.get("/api/regulatory/calibration-periodicities-gas", async (req, res) => {
    try {
      const data = RegulatoryDataService.getAllCalibrationPeriodicitiesGas();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gas calibration periodicities" });
    }
  });

  app.get("/api/regulatory/calibration-periodicities-petroleum", async (req, res) => {
    try {
      const data = RegulatoryDataService.getAllCalibrationPeriodicitiesPetroleum();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch petroleum calibration periodicities" });
    }
  });

  app.get("/api/regulatory/search-max-uncertainty", async (req, res) => {
    try {
      const system = req.query.system as string;
      const category = req.query.category as "petroleum" | "natural_gas";
      
      if (!system || !category) {
        return res.status(400).json({ message: "System and category parameters are required" });
      }

      const maxUncertainty = RegulatoryDataService.findMaxUncertaintyForSystem(system, category);
      res.json({ maxUncertainty });
    } catch (error) {
      res.status(500).json({ message: "Failed to search max uncertainty" });
    }
  });

  app.get("/api/regulatory/search-calibration-periodicity", async (req, res) => {
    try {
      const instrument = req.query.instrument as string;
      const category = req.query.category as "petroleum" | "natural_gas";
      const applicationType = req.query.applicationType as string;
      
      if (!instrument || !category) {
        return res.status(400).json({ message: "Instrument and category parameters are required" });
      }

      const periodicity = RegulatoryDataService.findCalibrationPeriodicity(
        instrument, 
        applicationType || "", 
        category
      );
      res.json({ periodicity });
    } catch (error) {
      res.status(500).json({ message: "Failed to search calibration periodicity" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
