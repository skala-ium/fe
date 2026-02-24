// src/types/Assignment.ts

export interface Assignment {
  id: number;
  title: string;
  className: string;
  professor: string;
  description: string;
  completePercent: number;
  deadline: string;
  submitCount: string; // '7/8' format
  submitRate: number;
  isPassed: boolean; // deadline passed flag
  week?: string;
  topic?: string;
  requirements?: string[];
}
