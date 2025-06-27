export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  certificateNumber: string;
  laboratory: string;
  instrument: string;
  calibrationDate: string;
  validityDate: string;
  status: string;
  analysisData: object;
  createdAt: string;
  updatedAt: string;
}

// In a real application, this would be stored in a database
const storage = {
  users: new Map<string, User>(),
  analysisRecords: new Map<string, AnalysisRecord>(),
};

export default storage;
