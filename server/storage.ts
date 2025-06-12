import { users, analysisRecords, type User, type InsertUser, type AnalysisRecord, type InsertAnalysisRecord } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis records methods
  createAnalysisRecord(record: InsertAnalysisRecord): Promise<AnalysisRecord>;
  getAnalysisRecord(id: number): Promise<AnalysisRecord | undefined>;
  getAllAnalysisRecords(): Promise<AnalysisRecord[]>;
  updateAnalysisRecord(id: number, record: Partial<InsertAnalysisRecord>): Promise<AnalysisRecord | undefined>;
  deleteAnalysisRecord(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analysisRecords: Map<number, AnalysisRecord>;
  private currentUserId: number;
  private currentRecordId: number;

  constructor() {
    this.users = new Map();
    this.analysisRecords = new Map();
    this.currentUserId = 1;
    this.currentRecordId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAnalysisRecord(record: InsertAnalysisRecord): Promise<AnalysisRecord> {
    const id = this.currentRecordId++;
    const now = new Date();
    const analysisRecord: AnalysisRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.analysisRecords.set(id, analysisRecord);
    return analysisRecord;
  }

  async getAnalysisRecord(id: number): Promise<AnalysisRecord | undefined> {
    return this.analysisRecords.get(id);
  }

  async getAllAnalysisRecords(): Promise<AnalysisRecord[]> {
    return Array.from(this.analysisRecords.values()).sort(
      (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
    );
  }

  async updateAnalysisRecord(id: number, record: Partial<InsertAnalysisRecord>): Promise<AnalysisRecord | undefined> {
    const existing = this.analysisRecords.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: AnalysisRecord = {
      ...existing,
      ...record,
      updatedAt: new Date(),
    };
    this.analysisRecords.set(id, updated);
    return updated;
  }

  async deleteAnalysisRecord(id: number): Promise<boolean> {
    return this.analysisRecords.delete(id);
  }
}

export const storage = new MemStorage();
