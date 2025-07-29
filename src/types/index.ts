export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isAdmin: boolean;
  domain: 'scei' | 'scei-he';
}

export interface Unit {
  id: string;
  unit_code: string;
  unit_title: string;
  competency?: string;
  unit_outline?: string;
  domain: 'scei' | 'scei-he';
  unit_elements?: UnitElement[];
  unit_performance_evidences?: PerformanceEvidence[];
  unit_knowledges?: KnowledgeEvidence[];
  learning_outcome?: string[];
  attributes?: string[];
  contents?: Content[];
  standards?: string[];
  benchmarks?: Benchmark[];
}

export interface UnitElement {
  element: string;
  criterias: string[];
}

export interface PerformanceEvidence {
  evidence: string;
  subtopics: string[];
}

export interface KnowledgeEvidence {
  topic: string;
  subtopics: string[];
}

export interface Content {
  content: string;
  criteria: string[];
}

export interface Benchmark {
  uni_name: string;
  course_outline: string;
  units: string[];
}

export interface Assessment {
  id: string;
  unit_id?: string;
  assessment_type?: string;
  // SCEI uses generated_text, SCEI-HE uses assessment
  generated_text?: string;
  assessment?: string;
  element_id?: number;
  criteria_id?: number;
  question_type_name?: string; // For SCEI-HE questioning assessments
  mappings?: AssessmentMapping | SceiHEAssessmentMapping[];
  scei_mappings?: SceiAssessmentMapping[]; // For SCEI assessments
}

// SCEI Assessment Mapping
export interface SceiAssessmentMapping {
  performance_criteria?: string;
  performance_evidence?: string;
  knowledge_evidence?: string;
}

// SCEI-HE Assessment Mapping  
export interface SceiHEAssessmentMapping {
  course_learning_outcome?: string;
  unit_learning_outcome?: string;
  graduate_attribute?: string;
  acecqa_content?: string;
  industry_standard?: string;
  learning_outcome?: string;
  assessment_criteria?: string;
  mapping_rationale?: string;
}

// Legacy mapping interface for backward compatibility
export interface AssessmentMapping {
  performance_criteria?: string;
  performance_evidence?: string;
  knowledge_evidence?: string;
  course_learning_outcome?: string;
  unit_learning_outcome?: string;
  graduate_attribute?: string;
  acecqa_content?: string;
  industry_standard?: string;
}

export interface AssessmentType {
  id: string;
  assessment_name: string;
  support_text?: string;
}

export interface AssessmentSample {
  id: string;
  unit_id: string;
  assessment_type: string;
  sample_text: string;
  question_type_id?: string;
  created_at: string;
  created_by: string;
}

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  rows: T[];
  hasMorePages: boolean;
  count: number;
}

export type Domain = 'scei' | 'scei-he';

export interface LoginFormData {
  email: string;
  password: string;
  domain: Domain;
}

export interface StudyGuide {
  unit_id: string;
  latex_content: string;
  content_analysis: any;
  page_estimate: any;
  validation_issues: string[];
  generation_stats: any;
  generated_at: string;
  content_type: string;
  generation_method: string;
}

export interface Presentation {
  unit_id: string;
  beamer_content: string;
  content_analysis: any;
  slide_estimate: any;
  validation_issues: string[];
  generation_stats: any;
  generated_at: string;
  content_type: string;
  generation_method: string;
  theme: string;
  color_scheme: string;
}

// LaTeX Processing Types
export interface LatexProcessingRequest {
  latex_file: File;
  auto_fix?: boolean;
}

export interface LatexProcessingResponse {
  status: 'success' | 'error';
  message?: string;
  errors_found?: string[];
  errors_fixed?: boolean;
  pdf_created: boolean;
  compilation_log_excerpt?: string;
  fixed_latex_available?: boolean;
  download_fixed_latex_url?: string;
}

export interface PdfViewerState {
  pdfUrl?: string;
  isLoading: boolean;
  error?: string;
}

export interface LatexEditorState {
  content: string;
  isModified: boolean;
  isLoading: boolean;
  error?: string;
}

export type ProcessingState = 'idle' | 'generating_latex' | 'processing_pdf' | 'completed' | 'error';
export type ViewMode = 'pdf' | 'latex';