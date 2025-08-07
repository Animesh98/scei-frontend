import { useState, useCallback, useRef, useEffect } from 'react';
import { SCEIJobManager, JobStatus, JobResult } from '@/lib/job-manager';

export interface GenerationProgress {
  jobId: string;
  status: JobStatus['status'];
  progress: number;
  currentStep: string;
  estimatedDuration?: string;
  error?: string;
}

export interface GenerationResult {
  jobId: string;
  type: 'study_guide' | 'presentation';
  unitId: string;
  result: JobResult['result'];
  processingStats?: JobResult['processing_stats'];
}

export const useJobManager = () => {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const jobManagerRef = useRef<SCEIJobManager | null>(null);

  // Initialize job manager
  const getJobManager = useCallback(() => {
    if (!jobManagerRef.current) {
      jobManagerRef.current = new SCEIJobManager();
    }
    return jobManagerRef.current;
  }, []);

  // Start generation
  const startGeneration = useCallback(async (
    type: 'study_guide' | 'presentation',
    unitId: string,
    options: {
      generation_method?: string;
      theme?: string;
      color_scheme?: string;
      user_timezone?: string;
    } = {}
  ) => {
    const jobManager = getJobManager();
    
    try {
      setIsGenerating(true);
      setProgress(null);
      setResult(null);

      // Set up event listeners
      const handleProgress = (data: any) => {
        console.log('📈 Progress event received:', data);
        setProgress({
          jobId: data.jobId,
          status: data.status.status,
          progress: data.status.progress || 0,
          currentStep: data.status.current_step || 'Starting...',
          estimatedDuration: data.estimatedDuration
        });
      };

      const handleCompleted = (data: any) => {
        console.log('✅ Completed event received:', data);
        setResult({
          jobId: data.jobId,
          type: data.type,
          unitId: data.unitId,
          result: data.result.result,
          processingStats: data.result.processing_stats
        });
        setIsGenerating(false);
        
        // Update progress to completed
        setProgress(prev => prev ? {
          ...prev,
          status: 'completed',
          progress: 100,
          currentStep: 'Generation completed successfully!'
        } : null);
      };

      const handleFailed = (data: any) => {
        console.log('❌ Failed event received:', data);
        setProgress(prev => prev ? {
          ...prev,
          status: 'failed',
          error: data.error
        } : {
          jobId: data.jobId,
          status: 'failed',
          progress: 0,
          currentStep: 'Generation failed',
          error: data.error
        });
        setIsGenerating(false);
      };

      const handleTimeout = (data: any) => {
        setProgress(prev => prev ? {
          ...prev,
          status: 'failed',
          error: 'Generation timeout - please try again'
        } : {
          jobId: data.jobId,
          status: 'failed',
          progress: 0,
          currentStep: 'Generation timed out',
          error: 'Generation timeout - please try again'
        });
        setIsGenerating(false);
      };

      const handleError = (data: any) => {
        setProgress(prev => prev ? {
          ...prev,
          status: 'error',
          error: data.error
        } : {
          jobId: data.jobId,
          status: 'error',
          progress: 0,
          currentStep: 'Generation error',
          error: data.error
        });
        setIsGenerating(false);
      };

      // Remove existing listeners and add new ones
      jobManager.removeAllListeners();
      jobManager.on('progress', handleProgress);
      jobManager.on('completed', handleCompleted);
      jobManager.on('failed', handleFailed);
      jobManager.on('timeout', handleTimeout);
      jobManager.on('error', handleError);

      // Start the generation
      const { jobId, estimatedDuration } = await jobManager.startGeneration(type, unitId, options);
      
      // Set initial progress
      setProgress({
        jobId,
        status: 'queued',
        progress: 0,
        currentStep: 'Starting generation...',
        estimatedDuration
      });

      return { jobId, estimatedDuration };
      
    } catch (error: any) {
      setIsGenerating(false);
      setProgress({
        jobId: 'error',
        status: 'error',
        progress: 0,
        currentStep: 'Failed to start generation',
        error: error.message
      });
      throw error;
    }
  }, [getJobManager]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    if (progress && jobManagerRef.current) {
      const [type, unitId] = progress.jobId.includes('study_guide') 
        ? ['study_guide', progress.jobId] 
        : ['presentation', progress.jobId];
      
      jobManagerRef.current.cancelJob(type as any, unitId, progress.jobId);
      setIsGenerating(false);
      setProgress(null);
      setResult(null);
    }
  }, [progress]);

  // Reset state
  const reset = useCallback(() => {
    setProgress(null);
    setResult(null);
    setIsGenerating(false);
    if (jobManagerRef.current) {
      jobManagerRef.current.removeAllListeners();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (jobManagerRef.current) {
        jobManagerRef.current.cleanup();
      }
    };
  }, []);

  return {
    startGeneration,
    cancelGeneration,
    reset,
    progress,
    result,
    isGenerating,
    // Helper computed values
    isCompleted: progress?.status === 'completed',
    isFailed: progress?.status === 'failed' || progress?.status === 'error',
    hasError: !!progress?.error,
  };
};