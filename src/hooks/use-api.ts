import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  Unit, 
  User, 
  Assessment, 
  AssessmentType, 
  AssessmentSample,
  StudyGuide,
  Presentation,
  ApiResponse, 
  PaginatedResponse 
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
  return useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AssessmentType[]>>('/assessments/he/types');
      return response.data.data;
    },
  });
};

// Assessments
export const useGenerateAssessment = () => {
  return useMutation({
    mutationFn: async (data: {
      unit_id: string;
      type: string;
      q_type?: string;
      include_pc?: boolean;
      include_pe?: boolean;
      include_ke?: boolean;
      custom_suggestion?: string;
    }) => {
      const response = await api.post<ApiResponse<{ text: string }>>('/assessments/generate', data);
      return response.data;
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
    }) => {
      const response = await api.post<ApiResponse<void>>('/assessments', data);
      return response.data;
    },
  });
};

export const useAssessment = (unitId: string, type: string, elementId?: number, criteriaId?: number) => {
  return useQuery({
    queryKey: ['assessment', unitId, type, elementId, criteriaId],
    queryFn: async () => {
      let url = `/assessments/${unitId}?type=${type}`;
      if (elementId !== undefined) url += `&element_id=${elementId}`;
      if (criteriaId !== undefined) url += `&criteria_id=${criteriaId}`;
      
      const response = await api.get<ApiResponse<Assessment>>(url);
      return response.data.data;
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
    }) => {
      const response = await api.post<ApiResponse<any>>(`/study-guides/${data.unit_id}/generate-latex`, {
        generation_method: data.generation_method,
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