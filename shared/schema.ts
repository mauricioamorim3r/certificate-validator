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
  
  // Section 1: Certificate/Laboratory identification
  certificateNumber: text("certificate_number"),
  certificateNumberStatus: varchar("certificate_number_status", { length: 20 }),
  certificateNumberObs: text("certificate_number_obs"),
  issuingLaboratory: text("issuing_laboratory"),
  issuingLaboratoryStatus: varchar("issuing_laboratory_status", { length: 20 }),
  issuingLaboratoryObs: text("issuing_laboratory_obs"),
  issueDate: text("issue_date"),
  issueDateStatus: varchar("issue_date_status", { length: 20 }),
  issueDateObs: text("issue_date_obs"),
  calibrationDate: text("calibration_date"),
  calibrationDateStatus: varchar("calibration_date_status", { length: 20 }),
  calibrationDateObs: text("calibration_date_obs"),
  calibrationValidity: text("calibration_validity"),
  validityStatus: varchar("validity_status", { length: 20 }),
  validityObservations: text("validity_observations"),
  technicalResponsible: text("technical_responsible"),
  responsibleStatus: varchar("responsible_status", { length: 20 }),
  responsibleObservations: text("responsible_observations"),
  
  // Section 2: Accreditation and scope
  accreditedLabStatus: varchar("accredited_lab_status", { length: 20 }),
  accreditedLabObservations: text("accredited_lab_observations"),
  adequateScopeStatus: varchar("adequate_scope_status", { length: 20 }),
  adequateScopeObservations: text("adequate_scope_observations"),
  accreditationSymbolStatus: varchar("accreditation_symbol_status", { length: 20 }),
  accreditationSymbolObservations: text("accreditation_symbol_observations"),
  
  // Section 3: Instrument identification
  equipmentType: text("equipment_type"),
  manufacturerModel: text("manufacturer_model"),
  serialNumber: text("serial_number"),
  tagIdInternal: text("tag_id_internal"),
  application: text("application"),
  location: text("location"),
  
  // Section 4: Environmental conditions and calibration method
  tempReported: text("temp_reported"),
  tempLimit: text("temp_limit"),
  tempOk: text("temp_ok"),
  tempObs: text("temp_obs"),
  humidityReported: text("humidity_reported"),
  humidityLimit: text("humidity_limit"),
  humidityOk: text("humidity_ok"),
  humidityObs: text("humidity_obs"),
  pressureReported: text("pressure_reported"),
  pressureLimit: text("pressure_limit"),
  pressureOk: text("pressure_ok"),
  pressureObs: text("pressure_obs"),
  fluidReported: text("fluid_reported"),
  fluidLimit: text("fluid_limit"),
  fluidOk: text("fluid_ok"),
  fluidObs: text("fluid_obs"),
  calibrationLocation: varchar("calibration_location", { length: 20 }),
  calibrationLocationOk: text("calibration_location_ok"),
  calibrationLocationObs: text("calibration_location_obs"),
  methodUsed: text("method_used"),
  methodUsedOk: text("method_used_ok"),
  methodUsedObs: text("method_used_obs"),
  
  // Section 5: ISO/IEC 17025 essential elements checklist
  isoRequirements: jsonb("iso_requirements"),
  
  // Section 6: Metrological traceability and uncertainty of standards
  standards: jsonb("standards"),
  
  // Section 7: Measurement uncertainty evaluation
  uncertaintyDeclared: text("uncertainty_declared"),
  uncertaintyDeclaredOk: text("uncertainty_declared_ok"),
  uncertaintyDeclaredObs: text("uncertainty_declared_obs"),
  calculationMethod: text("calculation_method"),
  calculationMethodOk: text("calculation_method_ok"),
  calculationMethodObs: text("calculation_method_obs"),
  contributions: text("contributions"),
  contributionsOk: text("contributions_ok"),
  contributionsObs: text("contributions_obs"),
  confidenceLevel: text("confidence_level"),
  confidenceLevelOk: text("confidence_level_ok"),
  confidenceLevelObs: text("confidence_level_obs"),
  compatibility: text("compatibility"),
  compatibilityOk: text("compatibility_ok"),
  compatibilityObs: text("compatibility_obs"),
  
  // Section 8: Calibration results and operational range
  calibrationResults: jsonb("calibration_results"),
  calibrationRange: text("calibration_range"),
  operationalRange: text("operational_range"),
  resultsComments: text("results_comments"),
  
  // Section 9: Adjustment/repair analysis
  asFoundStatus: varchar("as_found_status", { length: 20 }),
  asFoundObs: text("as_found_obs"),
  asLeftStatus: varchar("as_left_status", { length: 20 }),
  asLeftObs: text("as_left_obs"),
  adjustmentsStatus: varchar("adjustments_status", { length: 20 }),
  adjustmentsObs: text("adjustments_obs"),
  retroactiveActions: text("retroactive_actions"),
  
  // Section 10: Conformity declaration and decision rules
  conformityDeclarationPresent: varchar("conformity_declaration_present", { length: 20 }),
  conformityDeclarationObs: text("conformity_declaration_obs"),
  specificationLimit: varchar("specification_limit", { length: 20 }),
  specificationLimitObs: text("specification_limit_obs"),
  decisionRule: varchar("decision_rule", { length: 20 }),
  decisionRuleObs: text("decision_rule_obs"),
  riskLevel: varchar("risk_level", { length: 20 }),
  riskLevelObs: text("risk_level_obs"),
  
  // Section 11: Environmental conditions post-calibration/use
  tempUse: text("temp_use"),
  tempUseLimit: text("temp_use_limit"),
  tempUseOk: text("temp_use_ok"),
  tempUseObs: text("temp_use_obs"),
  humidityUse: text("humidity_use"),
  humidityUseLimit: text("humidity_use_limit"),
  humidityUseOk: text("humidity_use_ok"),
  humidityUseObs: text("humidity_use_obs"),
  pressureUse: text("pressure_use"),
  pressureUseLimit: text("pressure_use_limit"),
  pressureUseOk: text("pressure_use_ok"),
  pressureUseObs: text("pressure_use_obs"),
  fluidUse: text("fluid_use"),
  fluidUseLimit: text("fluid_use_limit"),
  fluidUseOk: text("fluid_use_ok"),
  fluidUseObs: text("fluid_use_obs"),
  
  // Section 12: Calibration periodicity
  lastCalibrationDate: text("last_calibration_date"),
  lastCalibrationObs: text("last_calibration_obs"),
  intervalRealized: text("interval_realized"),
  intervalRealizedObs: text("interval_realized_obs"),
  periodicityDefined: text("periodicity_defined"),
  periodicityAtends: varchar("periodicity_atends", { length: 20 }),
  periodicityObs: text("periodicity_obs"),
  
  // Section 13: Specific evaluations by instrument type
  pressureCriteria: jsonb("pressure_criteria"),
  flowCriteria: jsonb("flow_criteria"),
  
  // Section 14: Non-conformities and proposed actions
  nonConformities: jsonb("non_conformities"),
  additionalRecommendations: text("additional_recommendations"),
  
  // Section 15: Fitness for use and final conclusion
  errorLimits: varchar("error_limits", { length: 20 }),
  errorLimitsObs: text("error_limits_obs"),
  adequateUncertainty: varchar("adequate_uncertainty", { length: 20 }),
  adequateUncertaintyObs: text("adequate_uncertainty_obs"),
  rtmRequirements: varchar("rtm_requirements", { length: 20 }),
  rtmRequirementsObs: text("rtm_requirements_obs"),
  finalStatus: varchar("final_status", { length: 30 }),
  conclusionJustification: text("conclusion_justification"),
  
  // Section 16: Signatures
  analystName: text("analyst_name"),
  analystDate: text("analyst_date"),
  approverName: text("approver_name"),
  approverDate: text("approver_date"),
  
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
