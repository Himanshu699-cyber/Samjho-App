export interface EvidenceVerification {
  verified: boolean;
  confidence: number;
  matchedPage: number | null;
  matchedText: string | null;
  contextSnippet: string | null;
  reason: string;
}

export interface ActionItem {
  id: string;
  action: string;
  action_hindi: string;
  quote?: string;
  page?: number;
  urgency: 'high' | 'medium' | 'low';
  verification?: EvidenceVerification;
}

export interface DeadlineInfo {
  date: string;
  has_deadline: boolean;
  quote?: string | null;
  page?: number | null;
  hindi_explanation: string;
  verification?: EvidenceVerification;
}

export interface CostInfo {
  amount: string;
  has_fee: boolean;
  quote?: string | null;
  page?: number | null;
  hindi_explanation: string;
  verification?: EvidenceVerification;
}

export interface ImportantPoint {
  point: string;
  point_hindi: string;
  quote?: string;
  page?: number;
  severity: 'critical' | 'warning' | 'info';
  verification?: EvidenceVerification;
}

export interface DocumentUnderstandingResult {
  document_type: string;
  summary: string;
  summary_hindi: string;
  summary_hinglish: string;
  actions: ActionItem[];
  deadline: DeadlineInfo;
  cost: CostInfo;
  important_points: ImportantPoint[];
  where_to_submit?: string;
  where_to_submit_hindi?: string;
  what_happens_if_ignored?: string;
  what_happens_if_ignored_hindi?: string;
}

export interface DocumentPage {
  pageNumber: number;
  text: string;
  canvasImage?: string; // data URL of rendered page if available
}

export interface UploadedDocument {
  id: string;
  name: string;
  fileSize: number;
  fileType: string;
  pages: DocumentPage[];
  fullText: string;
  isScanned: boolean;
  uploadedAt: string;
}

export type ExplanationLanguage = 'hinglish' | 'hindi' | 'simple_english';

export type AIModelEngine = 'gemini' | 'ollama';

export interface OllamaSettings {
  baseUrl: string;
  model: string;
  isAvailable?: boolean;
}
