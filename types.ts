
export interface TestCase {
  consecutive: number;
  description: string;
  expectedResult: string;
  changeStatus?: 'new' | 'modified' | 'unchanged' | 'deleted';
}

export interface QualityReport {
  functionalCoverage: number;
  semanticConsistency: number;
  structuralCompleteness: number;
  huTestTraceability: number;
  clarityOfExpectedResults: number;
}

export interface TestPlan {
  identifier: string;
  name: string;
  projectName: string;
  userStory: string;
  qaAnalyst: string;
  testEnvironmentAndData: string;
  testCases: TestCase[];
  qualityReport: QualityReport;
}

export type AppStatus = 'idle' | 'parsing' | 'generating' | 'success' | 'error' | 'improving';