import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
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
  SceiHEAssessmentMapping
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
  return useQuery({
    queryKey: ['units', page, limit],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PaginatedResponse<Unit>>>(`/units?page=${page}&limit=${limit}`);
      return response.data.data;
    },
  });
};

// Hook to fetch all units (for search functionality)
export const useAllUnits = () => {
  return useQuery({
    queryKey: ['units', 'all'],
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
  return useQuery({
    queryKey: ['unit', id],
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
      queryClient.invalidateQueries({ queryKey: ['units'] });
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
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['unit', variables.id] });
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
      element_id?: number;
      criteria_id?: number;
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

      // Add element_id and criteria_id for both domains if provided
      if (data.element_id !== undefined) {
        saveData.element_id = data.element_id;
      }
      if (data.criteria_id !== undefined) {
        saveData.criteria_id = data.criteria_id;
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

export const useAssessment = (unitId: string, type: string, elementId?: number, criteriaId?: number) => {
  const { user } = useAuthStore.getState();
  
  return useQuery({
    queryKey: ['assessment', user?.domain, unitId, type, elementId, criteriaId],
    queryFn: async () => {
      const baseEndpoint = user?.domain === 'scei-he' ? '/assessments/he' : '/assessments';
      let url = `${baseEndpoint}/${unitId}?type=${type}`;
      if (elementId !== undefined) url += `&element_id=${elementId}`;
      if (criteriaId !== undefined) url += `&criteria_id=${criteriaId}`;
      
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

// Study Guides
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
  return useQuery({
    queryKey: ['study-guide', unitId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StudyGuide>>(`/study-guides/${unitId}/latex`);
      return response.data.data;
    },
    enabled: !!unitId,
  });
};

// Presentations
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
  return useQuery({
    queryKey: ['presentation', unitId],
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
      const response = await api.get<ApiResponse<{
        unit_code: string;
        unit_title: string;
        competency: string;
        domain: string;
        unit_elements: Array<{
          element: string;
          criterias: string[];
        }>;
        unit_performance_evidences: Array<{
          evidence: string;
          subtopics: string[];
        }>;
        unit_knowledges: Array<{
          topic: string;
          subtopics: string[];
        }>;
      }>>(`/unit-details/${unitCode}`);
      return response.data;
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
  return useQuery({
    queryKey: ['assessor-guide-status', unitId],
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