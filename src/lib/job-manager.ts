import { EventEmitter } from 'events';
import api from './api';

export interface JobInfo {
  jobId: string;
  type: 'study_guide' | 'presentation';
  unitId: string;
  estimatedDuration?: string;
  startTime: number;
}

export interface JobStatus {
  job_id: string;
  status: 'queued' | 'started' | 'processing' | 'completed' | 'failed' | 'error';
  progress: number;
  current_step: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface JobResult {
  job_id: string;
  job_type: string;
  result: {
    _id: string;
    unit_id: string;
    latex_content?: string;
    beamer_content?: string;
    content_analysis?: any;
    page_estimate?: any;
    slide_estimate?: any;
    validation_issues?: any[];
    generation_method: string;
    generated_at: string;
    content_type: string;
  };
  processing_stats?: any;
}

export class SCEIJobManager extends EventEmitter {
  private activeJobs = new Map<string, { poll: () => void; startTime: number }>();
  private pollingInterval = 2000; // 2 seconds
  private maxPollingDuration = 45 * 60 * 1000; // 45 minutes

  constructor() {
    super();
  }

  async startGeneration(
    type: 'study_guide' | 'presentation',
    unitId: string,
    options: {
      generation_method?: string;
      theme?: string;
      color_scheme?: string;
      user_timezone?: string;
    } = {}
  ): Promise<{ jobId: string; estimatedDuration?: string }> {
    const endpoint = type === 'study_guide' 
      ? `/study-guides/${unitId}/generate-latex`
      : `/presentations/${unitId}/generate-beamer`;
    
    try {
      const payload = {
        generation_method: type === 'study_guide' ? 'dynamic_chapters' : 'dynamic_slides',
        timezone: options.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...options
      };

      // Use existing Azure API with authentication
      const response = await api.post(endpoint, payload);
      
      console.log('Generation API Response:', {
        status: response.status,
        data: response.data
      });
      
      // Handle 202 response - job started successfully
      if (response.status === 202 && response.data) {
        const result = response.data;
        
        // Check for job_id in various possible response formats
        const jobId = result.job_id || result.data?.job_id;
        const estimatedDuration = result.estimated_duration || result.data?.estimated_duration;
        
        if (jobId) {
          this.startPolling(type, unitId, jobId);
          return {
            jobId: jobId,
            estimatedDuration: estimatedDuration || '10-25 minutes'
          };
        } else {
          console.error('No job_id found in 202 response:', result);
          throw new Error('Invalid response format - missing job_id');
        }
      }
      
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error: any) {
      console.error('Failed to start generation:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Re-throw with original error information for debugging
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Generation start failed (${error.response?.status || 'Network Error'}): ${errorMsg}`);
    }
  }

  private startPolling(type: 'study_guide' | 'presentation', unitId: string, jobId: string) {
    const jobKey = `${type}_${unitId}_${jobId}`;
    const startTime = Date.now();
    let lastProgress = -1;
    let consecutiveNoChanges = 0;
    
    const poll = async () => {
      try {
        const status = await this.checkStatus(type, unitId, jobId);
        
        // Adapt polling interval based on progress changes
        const progressChanged = status.progress !== lastProgress;
        lastProgress = status.progress;
        
        if (!progressChanged) {
          consecutiveNoChanges++;
        } else {
          consecutiveNoChanges = 0;
        }
        
        console.log('Emitting progress event:', { type, unitId, jobId, status });
        
        // Emit progress event
        this.emit('progress', { type, unitId, jobId, status });
        
        if (status.status === 'completed') {
          console.log('Generation completed, fetching result...');
          const result = await this.getResult(type, unitId, jobId);
          this.emit('completed', { type, unitId, jobId, result });
          this.activeJobs.delete(jobKey);
        } else if (status.status === 'failed' || status.status === 'error') {
          console.log('Generation failed:', status.error_message);
          this.emit('failed', { type, unitId, jobId, error: status.error_message || 'Generation failed' });
          this.activeJobs.delete(jobKey);
        } else if (Date.now() - startTime > this.maxPollingDuration) {
          console.log('Generation timed out after', this.maxPollingDuration / 1000 / 60, 'minutes');
          this.emit('timeout', { type, unitId, jobId });
          this.activeJobs.delete(jobKey);
        } else {
          // Continue polling with adaptive interval
          const nextInterval = this.getNextPollingInterval(progressChanged, consecutiveNoChanges);
          console.log(`Continuing to poll in ${nextInterval / 1000}s. Status: ${status.status}, Progress: ${status.progress || 0}%`);
          setTimeout(poll, nextInterval);
        }
      } catch (error: any) {
        console.error('Polling error:', error);
        this.emit('error', { type, unitId, jobId, error: error.message });
        this.activeJobs.delete(jobKey);
      }
    };
    
    this.activeJobs.set(jobKey, { poll, startTime });
    
    // Start polling immediately
    console.log('🚀 Starting immediate polling for job:', jobId);
    poll();
  }

  private getNextPollingInterval(progressChanged: boolean, consecutiveNoChanges: number): number {
    if (progressChanged) {
      // Reset to fast polling when progress is made
      return 2000; // 2 seconds
    }
    
    // Gradually increase interval if no progress (but cap at 10 seconds)
    if (consecutiveNoChanges > 3) {
      return Math.min(this.pollingInterval * 1.5, 10000);
    }
    
    return this.pollingInterval;
  }

  private async checkStatus(type: 'study_guide' | 'presentation', unitId: string, jobId: string): Promise<JobStatus> {
    const endpoint = type === 'study_guide'
      ? `/study-guides/${unitId}/generation-status/${jobId}`
      : `/presentations/${unitId}/generation-status/${jobId}`;
    
    try {
      const response = await api.get(endpoint);
      
      console.log('Status API Response:', {
        status: response.status,
        data: response.data
      });
      
      // Handle different response formats from the API
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Status check failed');
      }
      
      // Return the status data - could be nested in 'data' property
      const statusData = response.data.data || response.data;
      
      // Ensure we have the required fields
      if (!statusData.status) {
        console.error('Invalid status response format:', statusData);
        throw new Error('Invalid status response - missing status field');
      }
      
      return statusData;
    } catch (error: any) {
      console.error('Status check failed:', {
        endpoint,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle different types of errors
      if (error.response?.status === 404) {
        throw new Error('Job not found - it may have expired or been cancelled');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  private async getResult(type: 'study_guide' | 'presentation', unitId: string, jobId: string): Promise<JobResult> {
    // For now, try to get the content from the existing endpoints since generation is complete
    // The document doesn't specify new result endpoints, so we'll use the existing ones
    const endpoint = type === 'study_guide'
      ? `/study-guides/${unitId}/latex`
      : `/presentations/${unitId}/beamer`;
    
    try {
      const response = await api.get(endpoint);
      
      // Handle different response formats from the API
      if (response.data.success === false) {
        throw new Error(response.data.message || 'Failed to get generation result');
      }
      
      const content = response.data.data;
      
      // Transform existing API response to match JobResult interface
      const result: JobResult = {
        job_id: jobId,
        job_type: type,
        result: {
          _id: content._id || '',
          unit_id: unitId,
          latex_content: content.latex_content,
          beamer_content: content.beamer_content,
          content_analysis: content.content_analysis,
          page_estimate: content.page_estimate,
          slide_estimate: content.slide_estimate,
          validation_issues: content.validation_issues || [],
          generation_method: content.generation_method || '',
          generated_at: content.generated_at || new Date().toISOString(),
          content_type: type === 'study_guide' ? 'latex' : 'beamer'
        },
        processing_stats: {
          unit_code: content.unit_code,
          generation_method: content.generation_method
        }
      };
      
      return result;
    } catch (error: any) {
      // Handle different types of errors
      if (error.response?.status === 404) {
        throw new Error('Generation result not found - content may not be ready yet');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error while fetching result - please try again later');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  public cancelJob(type: 'study_guide' | 'presentation', unitId: string, jobId: string) {
    const jobKey = `${type}_${unitId}_${jobId}`;
    const job = this.activeJobs.get(jobKey);
    
    if (job) {
      this.activeJobs.delete(jobKey);
      this.emit('cancelled', { type, unitId, jobId });
    }
  }

  public getActiveJobs(): JobInfo[] {
    const jobs: JobInfo[] = [];
    
    for (const [jobKey, job] of this.activeJobs) {
      const [type, unitId, jobId] = jobKey.split('_');
      jobs.push({
        jobId,
        type: type as 'study_guide' | 'presentation',
        unitId,
        startTime: job.startTime
      });
    }
    
    return jobs;
  }

  public cleanup() {
    this.activeJobs.clear();
    this.removeAllListeners();
  }
}