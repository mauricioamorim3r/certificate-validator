import { pgTable, text, serial, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (keeping existing structure)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Analysis records table
export const analysisRecords = pgTable("analysis_records", {
  id: serial("id").primaryKey(),
  documentCode: varchar("document_code", { length: 50 }).default("RAC-001"),
  version: varchar("version", { length: 10 }).default("2.1"),
  analysisDate: text("analysis_date"),
  analyzedBy: text("analyzed_by"),
  approvedBy: text("approved_by"),
  
  // Certificate/Laboratory identification
  certificateNumber: text("certificate_number"),
  issuingLaboratory: text("issuing_laboratory"),
  issueDate: text("issue_date"),
  calibrationDate: text("calibration_date"),
  calibrationValidity: text("calibration_validity"),
  validityStatus: varchar("validity_status", { length: 20 }),
  validityObservations: text("validity_observations"),
  technicalResponsible: text("technical_responsible"),
  responsibleStatus: varchar("responsible_status", { length: 20 }),
  responsibleObservations: text("responsible_observations"),
  
  // Accreditation and scope
  accreditedLabStatus: varchar("accredited_lab_status", { length: 20 }),
  accreditedLabObservations: text("accredited_lab_observations"),
  adequateScopeStatus: varchar("adequate_scope_status", { length: 20 }),
  adequateScopeObservations: text("adequate_scope_observations"),
  accreditationSymbolStatus: varchar("accreditation_symbol_status", { length: 20 }),
  accreditationSymbolObservations: text("accreditation_symbol_observations"),
  
  // Instrument identification
  equipmentType: text("equipment_type"),
  manufacturerModel: text("manufacturer_model"),
  serialNumber: text("serial_number"),
  tagIdInternal: text("tag_id_internal"),
  application: text("application"),
  location: text("location"),
  
  // Environmental conditions
  environmentalConditions: jsonb("environmental_conditions"),
  calibrationLocation: varchar("calibration_location", { length: 20 }),
  locationAdequate: text("location_adequate"),
  locationObservations: text("location_observations"),
  
  // Measurement results
  measurementResultsStatus: varchar("measurement_results_status", { length: 20 }),
  measurementResultsObservations: text("measurement_results_observations"),
  uncertaintiesStatus: varchar("uncertainties_status", { length: 20 }),
  uncertaintiesObservations: text("uncertainties_observations"),
  conformityStatus: varchar("conformity_status", { length: 20 }),
  conformityObservations: text("conformity_observations"),
  
  // Traceability
  traceabilityStatus: varchar("traceability_status", { length: 20 }),
  traceabilityObservations: text("traceability_observations"),
  standardsStatus: varchar("standards_status", { length: 20 }),
  standardsObservations: text("standards_observations"),
  certificatesStatus: varchar("certificates_status", { length: 20 }),
  certificatesObservations: text("certificates_observations"),
  
  // Final analysis
  overallStatus: varchar("overall_status", { length: 20 }),
  finalComments: text("final_comments"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisRecordSchema = createInsertSchema(analysisRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAnalysisRecord = z.infer<typeof insertAnalysisRecordSchema>;
export type AnalysisRecord = typeof analysisRecords.$inferSelect;
