import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { LATEX_PROCESSING } from '@/constants';
import { 
  Unit, 
  User, 
  Assessment, 
  AssessmentType, 
  AssessmentSample,
  StudyGuide,
  Presentation,
  ApiResponse, 
  PaginatedResponse,
  SceiHEAssessmentMapping,
  LatexProcessingRequest,
  LatexProcessingResponse
} from '@/types';

// SCEI API payload interface - exported for use in components
export interface SceiUnitPayload {
  unit_code: string;
  name: string;
  competency: string;
  elements: Array<{ element: string; criteria: string[] }>;
  evidences: Array<{ element: string; subTopics: string[] }>;
  knowledge: Array<{ element: string; subTopics: string[] }>;
}

// Units
export const useUnits = (page: number = 0, limit: number = 10) => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['units', user?.domain, page, limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<Unit>>>(`/units?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
};

// Hook to fetch all units (for search functionality)
export const useAllUnits = () => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['units', user?.domain, 'all'],
    queryFn: async () => {
      // Fetch with a high limit to get all units
      const response = await api.get<ApiResponse<PaginatedResponse<Unit>>>(`/units?page=0&limit=10000`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

export const useUnit = (id: string) => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['unit', user?.domain, id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Unit>>(`/units/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unitData: SceiUnitPayload) => {
      // For SCEI domain, send data as-is (matches expected API format)
      const response = await api.post<ApiResponse<Unit>>('/units', unitData);
      return response.data;
    },
    onSuccess: () => {
      const { user } = useAuthStore.getState();
      queryClient.invalidateQueries({ queryKey: ['units', user?.domain] });
    },
  });
};

export const useUpdateUnit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...unitData }: { id: string } & SceiUnitPayload) => {
      // For SCEI domain, send data as-is (matches expected API format)
      const response = await api.put<ApiResponse<Unit>>(`/units/${id}`, unitData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      const { user } = useAuthStore.getState();
      queryClient.invalidateQueries({ queryKey: ['units', user?.domain] });
      queryClient.invalidateQueries({ queryKey: ['unit', user?.domain, variables.id] });
    },
  });
};


// Users
export const useUsers = (page: number = 0, limit: number = 10) => {
  return useQuery({
    queryKey: ['users', page, limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<User>>>(`/users?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<User> & { password: string }) => {
      const response = await api.post<ApiResponse<User>>('/users', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...userData }: Partial<User> & { id: string }) => {
      const response = await api.put<ApiResponse<User>>(`/users/${id}`, userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Assessment Types
export const useAssessmentTypes = () => {
  const { user } = useAuthStore.getState();
  
  return useQuery({
    queryKey: ['assessment-types', user?.domain],
    queryFn: async () => {
      const endpoint = '/assessments/he/types';
      console.log('Using assessment types endpoint:', endpoint, 'for domain:', user?.domain);
      
      const response = await api.get<ApiResponse<AssessmentType[]>>(endpoint);
      return response.data.data;
    },
  });
};

// Helper function to determine if assessment type is questioning
// Since both SCEI and SCEI-HE use the same assessment_types collection, they share the same IDs
const isQuestioningAssessmentType = (assessmentTypeId: string) => {
  return assessmentTypeId === '6703c26d78548ed67f9862a6';
};

// Assessments
export const useGenerateAssessment = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      type: string;
      question_type?: string;
      include_pc?: boolean;
      include_pe?: boolean;
      include_ke?: boolean;
      suggestion?: string;
      text?: string;
    }) => {
      // Validate authentication state
      const { user, token } = useAuthStore.getState();
      if (!user || !token) {
        throw new Error('User not authenticated. Please login again.');
      }
      
      // Determine if this is a questioning type assessment
      const isQuestioningType = isQuestioningAssessmentType(data.type);
      
      console.log('User authentication state:', {
        userExists: !!user,
        tokenExists: !!token,
        domain: user?.domain,
        tokenLength: token?.length,
        isQuestioningType
      });
      
      // Prepare request data based on assessment type
      const requestData: Record<string, unknown> = {
        unit_id: data.unit_id,
        type: data.type,
        suggestion: data.suggestion || '',
        text: data.text || ''
      };

      if (isQuestioningType) {
        // Questioning assessment - requires question_type, ignores component filtering
        if (!data.question_type) {
          throw new Error('Question type is required for questioning assessments');
        }
        requestData.question_type = data.question_type;
      } else if (user?.domain === 'scei') {
        // Non-questioning SCEI assessment - uses component filtering (PC/PE/KE)
        requestData.include_pc = data.include_pc ?? true;
        requestData.include_pe = data.include_pe ?? true;
        requestData.include_ke = data.include_ke ?? true;
      }
      // SCEI-HE non-questioning assessments don't use component filtering

      console.log('Sending assessment generation request:', requestData);
      
      // Determine the correct endpoint based on domain
      const endpoint = user?.domain === 'scei-he' ? '/assessments/he/generate' : '/assessments/generate';
      console.log('Using assessment generation endpoint:', endpoint, 'for domain:', user?.domain);
      
      try {
        const response = await api.post<ApiResponse<{ text: string }>>(endpoint, requestData);
        console.log('Assessment generation response:', response.data);
        
        // Check if response indicates success but no content
        if (response.data.status && (!response.data.data || !response.data.data.text)) {
          console.warn('API returned success but no content:', response.data);
          throw new Error('Assessment generation returned empty content. This may indicate an issue with the unit ID or assessment type combination.');
        }
        
        return response.data;
      } catch (error: unknown) {
        console.error('Assessment generation failed:', error);
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (axiosError.response?.status === 404) {
          throw new Error('Unit or assessment type not found. Please verify the selection.');
        } else if (axiosError.response?.data?.message) {
          throw new Error(axiosError.response.data.message);
        }
        throw error;
      }
    },
  });
};

export const useSaveAssessment = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      type: string;
      text: string;
      question_type?: string; // For questioning assessments
      mappings?: SceiHEAssessmentMapping[]; // Optional mappings for SCEI-HE
    }) => {
      const { user } = useAuthStore.getState();
      const endpoint = user?.domain === 'scei-he' ? '/assessments/he' : '/assessments';
      console.log('Using save assessment endpoint:', endpoint, 'for domain:', user?.domain);
      
      // Prepare save data based on domain
      const saveData: Record<string, unknown> = {
        unit_id: data.unit_id,
        type: data.type,
        text: data.text,
      };

      // For questioning assessments, include question_type
      const isQuestioningType = isQuestioningAssessmentType(data.type);
      if (isQuestioningType && data.question_type) {
        saveData.question_type = data.question_type;
      }

      // Add mappings for SCEI-HE
      if (user?.domain === 'scei-he') {
        // If mappings are provided, use them; otherwise provide empty array
        saveData.mappings = data.mappings || [
          {
            course_learning_outcome: "",
            unit_learning_outcome: "",
            graduate_attribute: "",
            acecqa_content: "",
            industry_standard: ""
          }
        ];
      }

      console.log('Sending save assessment request:', saveData);
      
      const response = await api.post<ApiResponse<void>>(endpoint, saveData);
      return response.data;
    },
  });
};

export const useAssessment = (unitId: string, type: string, questionType?: string) => {
  const { user } = useAuthStore.getState();
  
  return useQuery({
    queryKey: ['assessment', user?.domain, unitId, type, questionType],
    queryFn: async () => {
      const baseEndpoint = user?.domain === 'scei-he' ? '/assessments/he' : '/assessments';
      let url = `${baseEndpoint}/${unitId}?type=${type}`;
      
      // For questioning assessments, include question_type
      const isQuestioningType = isQuestioningAssessmentType(type);
      if (isQuestioningType && questionType) {
        url += `&question_type=${questionType}`;
      }
      
      console.log('Using assessment fetch endpoint:', url, 'for domain:', user?.domain);
      
      const response = await api.get<ApiResponse<Assessment | Assessment[]>>(url);
      const assessmentData = response.data.data;
      
      // Handle different response formats
      if (Array.isArray(assessmentData)) {
        // For questioning assessments that return arrays, get the first one or create a combined assessment
        if (assessmentData.length > 0) {
          const firstAssessment = assessmentData[0];
          // Normalize the field names for consistent usage
          const normalizedAssessment: Assessment = {
            ...firstAssessment,
            // Ensure both field names are available for backward compatibility
            generated_text: firstAssessment.assessment || firstAssessment.generated_text,
            assessment: firstAssessment.assessment || firstAssessment.generated_text,
          };
          return normalizedAssessment;
        } else {
          return null;
        }
      } else if (assessmentData) {
        // Single assessment - normalize field names
        const normalizedAssessment: Assessment = {
          ...assessmentData,  
          // Ensure both field names are available for backward compatibility
          generated_text: assessmentData.assessment || assessmentData.generated_text,
          assessment: assessmentData.assessment || assessmentData.generated_text,
        };
        return normalizedAssessment;
      }
      
      return null;
    },
    enabled: !!unitId && !!type,
  });
};

// Assessment Samples
export const useAssessmentSamples = (unitId: string, assessmentType: string, questionTypeId?: string) => {
  return useQuery({
    queryKey: ['assessment-samples', unitId, assessmentType, questionTypeId],
    queryFn: async () => {
      let url = `/assessment-samples/${unitId}/${assessmentType}`;
      if (questionTypeId) url += `?question_type_id=${questionTypeId}`;
      
      const response = await api.get<ApiResponse<AssessmentSample[]>>(url);
      return response.data.data;
    },
    enabled: !!unitId && !!assessmentType,
  });
};

export const useSaveAssessmentSample = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      assessment_type: string;
      sample_text: string;
      question_type_id?: string;
    }) => {
      const response = await api.post<ApiResponse<{ id: string }>>('/assessment-samples', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['assessment-samples', variables.unit_id, variables.assessment_type] 
      });
    },
  });
};

// Study Guides - New Asynchronous API (using existing Azure endpoints)
export const useStartStudyGuideGeneration = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      generation_method?: string;
      user_timezone?: string;
    }) => {
      // Use existing Azure API endpoint - now returns 202 with job_id
      const response = await api.post(`/study-guides/${data.unit_id}/generate-latex`, {
        generation_method: data.generation_method || 'dynamic_chapters',
        timezone: data.user_timezone || 'UTC',
      });
      return response.data;
    },
  });
};

export const useCheckStudyGuideStatus = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      job_id: string;
    }) => {
      // New status endpoint added to Azure API
      const response = await api.get(`/study-guides/${data.unit_id}/generation-status/${data.job_id}`);
      return response.data;
    },
  });
};

export const useGetStudyGuideResult = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      job_id: string;
    }) => {
      // Use existing content retrieval endpoint
      const response = await api.get(`/study-guides/${data.unit_id}/latex`);
      return response.data;
    },
  });
};

// Legacy hook - keep for backward compatibility but mark as deprecated
/** @deprecated Use the new asynchronous generation hooks instead */
export const useGenerateStudyGuide = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      generation_method?: string;
      timezone?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(`/study-guides/${data.unit_id}/generate-latex`, {
        generation_method: data.generation_method,
        timezone: data.timezone,
      });
      return response.data;
    },
  });
};

export const useStudyGuide = (unitId: string) => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['study-guide', user?.domain, unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StudyGuide>>(`/study-guides/${unitId}/latex`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
};

// Presentations - New Asynchronous API (using existing Azure endpoints)
export const useStartPresentationGeneration = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      generation_method?: string;
      theme?: string;
      color_scheme?: string;
      user_timezone?: string;
    }) => {
      // Use existing Azure API endpoint - now returns 202 with job_id
      const response = await api.post(`/presentations/${data.unit_id}/generate-beamer`, {
        generation_method: data.generation_method || 'dynamic_slides',
        theme: data.theme || 'madrid',
        color_scheme: data.color_scheme || 'default',
        timezone: data.user_timezone || 'UTC',
      });
      return response.data;
    },
  });
};

export const useCheckPresentationStatus = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      job_id: string;
    }) => {
      // New status endpoint added to Azure API
      const response = await api.get(`/presentations/${data.unit_id}/generation-status/${data.job_id}`);
      return response.data;
    },
  });
};

export const useGetPresentationResult = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      job_id: string;
    }) => {
      // Use existing content retrieval endpoint
      const response = await api.get(`/presentations/${data.unit_id}/beamer`);
      return response.data;
    },
  });
};

// Legacy hooks - keep for backward compatibility but mark as deprecated
/** @deprecated Use the new asynchronous generation hooks instead */
export const useGeneratePresentation = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      generation_method?: string;
      theme?: string;
      color_scheme?: string;
      timezone?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(`/presentations/${data.unit_id}/generate-beamer`, data);
      return response.data;
    },
  });
};

export const usePresentation = (unitId: string) => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['presentation', user?.domain, unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Presentation>>(`/presentations/${unitId}/beamer`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
};

export const useFetchUnitDetails = () => {
  return useMutation({
    mutationFn: async (unitCode: string) => {
      const response = await fetch(`http://localhost:5000/api/unit-details/${unitCode}`, {
        method: 'GET',
        headers: {
          'X-API-Token': LATEX_PROCESSING.API_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unit details: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check if the API returned an error
      if (data.status === 'error') {
        throw new Error(data.message || 'Failed to fetch unit details');
      }
      
      // Map the localhost:5000 API response structure to match what the frontend expects
      // The API returns: { status: "success", unit_code: "...", unit_details: {...} }
      // Frontend expects: { data: {...} }
      return {
        data: {
          unit_code: data.unit_code,
          unit_title: data.unit_details?.unit_title,
          competency: data.unit_details?.competency,
          domain: data.unit_details?.domain,
          unit_elements: data.unit_details?.unit_elements,
          unit_performance_evidences: data.unit_details?.unit_performance_evidences,
          unit_knowledges: data.unit_details?.unit_knowledges
        }
      };
    },
  });
};

// Assessor Guide Upload Hook
export const useUploadAssessorGuide = () => {
  return useMutation({
    mutationFn: async (data: {
      assessor_guide_file: File;
      unit_id: string;
      unit_code: string;
    }) => {
      const formData = new FormData();
      formData.append('assessor_guide_file', data.assessor_guide_file);
      formData.append('unit_id', data.unit_id);
      formData.append('unit_code', data.unit_code);

      const response = await api.post<ApiResponse<{
        total_chunks: number;
        unit_id: string;
        has_embeddings: boolean;
        expected_chunks: number;
        metadata_structure_ok: boolean;
      }>>('/study-guides/assessor-guide', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};

// Assessor Guide Status Hook
export const useAssessorGuideStatus = (unitId: string) => {
  const { user } = useAuthStore.getState();
  return useQuery({
    queryKey: ['assessor-guide-status', user?.domain, unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        total_chunks: number;
        unit_id: string;
        has_embeddings: boolean;
        expected_chunks: number;
        metadata_structure_ok: boolean;
      }>>(`/study-guides/assessor-guide/${unitId}/status`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
};

// LaTeX Processing Hooks
export const useProcessLatex = () => {
  return useMutation({
    mutationFn: async (data: LatexProcessingRequest): Promise<LatexProcessingResponse> => {
      const formData = new FormData();
      formData.append('latex_file', data.latex_file);
      formData.append('auto_fix', data.auto_fix !== false ? 'true' : 'false');

      const response = await fetch(`${LATEX_PROCESSING.API_BASE_URL}${LATEX_PROCESSING.ENDPOINT}`, {
        method: 'POST',
        headers: {
          'X-API-Token': LATEX_PROCESSING.API_TOKEN,
        },
        body: formData,
      });

      if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
        // Success - PDF returned
        const pdfBlob = await response.blob();
        const pdfUrl = URL.createObjectURL(pdfBlob);
        return {
          status: 'success',
          pdf_created: true,
          pdfUrl, // Add the blob URL for immediate viewing
        } as LatexProcessingResponse & { pdfUrl: string };
      } else {
        // Error - JSON response with details
        const errorData = await response.json();
        return {
          status: 'error',
          pdf_created: false,
          ...errorData,
        };
      }
    },
  });
};

export const useDownloadFixedLatex = () => {
  return useMutation({
    mutationFn: async (downloadUrl: string) => {
      const response = await fetch(`${LATEX_PROCESSING.API_BASE_URL}${downloadUrl}`, {
        method: 'GET',
        headers: {
          'X-API-Token': LATEX_PROCESSING.API_TOKEN,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download fixed LaTeX file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fixed_latex.tex';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true };
    },
  });
};

// Assessor Guides
export const useAssessorGuideAssessmentTypes = (unitCode: string) => {
  return useQuery({
    queryKey: ['assessor-guide-assessment-types', unitCode],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        unit_code: string;
        unit_title: string;
        available_assessment_types: Array<{
          assessment_type_id: string;
          assessment_name: string;
          available: boolean;
          has_content: boolean;
        }>;
        total_assessment_types: number;
      }>>(`/assessor-guides/${unitCode}/assessment-types`);
      return response.data.data;
    },
    enabled: !!unitCode,
  });
};

export const useGenerateAssessorGuide = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_code: string;
      selected_assessment_types?: string[];
      generation_options?: {
        professional_format?: boolean;
        include_rubrics?: boolean;
        include_guidelines?: boolean;
        ai_enhanced_content?: boolean;
      };
    }) => {
      const response = await api.post<ApiResponse<{
        pdf_generated: boolean;
        unit_code: string;
        assessment_types_used: string[];
        total_assessment_types_count: number;
        unit_assessment_types_count: number;
        format: string;
        features: {
          ai_content_processing: boolean;
          specific_rubrics: boolean;
          professional_layout: boolean;
          table_of_contents: boolean;
        };
        generated_at: string;
      }>>(`/assessor-guides/generate/${data.unit_code}`, {
        selected_assessment_types: data.selected_assessment_types || [],
        generation_options: {
          professional_format: true,
          include_rubrics: true,
          include_guidelines: true,
          ai_enhanced_content: true,
          ...data.generation_options
        }
      });
      return response.data;
    },
  });
};

export const useAssessorGuidePdfInfo = (unitCode: string) => {
  return useQuery({
    queryKey: ['assessor-guide-pdf-info', unitCode],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{
        unit_info: {
          unit_code: string;
          unit_title: string;
          competency: string;
        };
        pdf_available: boolean;
        generated_at: string;
        status: string;
        file_size_bytes: number;
        assessment_types_included: string[];
        features: {
          ai_enhanced_content: boolean;
          specific_rubrics: boolean;
          professional_layout: boolean;
        };
      }>>(`/assessor-guides/${unitCode}/pdf`);
      return response.data.data;
    },
    enabled: !!unitCode,
  });
};