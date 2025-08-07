/**
 * Test utility for validating the new asynchronous generation system
 * This file can be used for development testing and debugging
 */

import { SCEIJobManager } from '@/lib/job-manager';

interface TestConfig {
  unitId: string;
  type: 'study_guide' | 'presentation';
  options?: {
    generation_method?: string;
    theme?: string;
    color_scheme?: string;
    user_timezone?: string;
  };
}

export class GenerationTester {
  private jobManager: SCEIJobManager;
  
  constructor() {
    this.jobManager = new SCEIJobManager();
  }

  async testGeneration(config: TestConfig): Promise<void> {
    console.log(`🧪 Testing ${config.type} generation for unit: ${config.unitId}`);
    
    try {
      // Set up event listeners for testing
      this.jobManager.on('progress', (data) => {
        console.log('📈 Progress:', {
          jobId: data.jobId,
          status: data.status.status,
          progress: data.status.progress,
          step: data.status.current_step
        });
      });

      this.jobManager.on('completed', (data) => {
        console.log('✅ Generation completed:', {
          jobId: data.jobId,
          type: data.type,
          hasContent: !!data.result.result.latex_content || !!data.result.result.beamer_content
        });
      });

      this.jobManager.on('failed', (data) => {
        console.error('❌ Generation failed:', {
          jobId: data.jobId,
          error: data.error
        });
      });

      this.jobManager.on('timeout', (data) => {
        console.warn('⏱️ Generation timed out:', data.jobId);
      });

      this.jobManager.on('error', (data) => {
        console.error('🚨 System error:', {
          jobId: data.jobId,
          error: data.error
        });
      });

      // Start the generation
      const result = await this.jobManager.startGeneration(
        config.type,
        config.unitId,
        config.options || {}
      );

      console.log('🚀 Generation started:', {
        jobId: result.jobId,
        estimatedDuration: result.estimatedDuration
      });

    } catch (error: any) {
      console.error('💥 Failed to start generation:', error.message);
    }
  }

  cleanup(): void {
    this.jobManager.cleanup();
  }

  getActiveJobs() {
    return this.jobManager.getActiveJobs();
  }
}

// Example usage for development/testing
export const runGenerationTest = async () => {
  const tester = new GenerationTester();
  
  try {
    // Test study guide generation
    await tester.testGeneration({
      unitId: 'your-unit-id-here',
      type: 'study_guide',
      options: {
        generation_method: 'dynamic_chapters',
        user_timezone: 'UTC'
      }
    });

    // Test presentation generation
    await tester.testGeneration({
      unitId: 'your-unit-id-here', 
      type: 'presentation',
      options: {
        generation_method: 'dynamic_slides',
        theme: 'madrid',
        color_scheme: 'default',
        user_timezone: 'UTC'
      }
    });

    console.log('Active jobs:', tester.getActiveJobs());
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up after testing
    tester.cleanup();
  }
};

// Validation helper
export const validateApiConfiguration = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_AZURE_FUNCTIONS_KEY'
  ];

  // Optional for LaTeX processing (separate service)
  const optionalEnvVars = [
    'NEXT_PUBLIC_LATEX_API_BASE_URL',
    'NEXT_PUBLIC_LATEX_API_TOKEN'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return false;
  }

  console.log('✅ API configuration validated');
  console.log('Azure API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
  
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn('⚠️ Optional LaTeX processing env vars missing:', missingOptional);
    console.warn('LaTeX-to-PDF processing will not be available');
  } else {
    console.log('✅ LaTeX processing configuration available');
  }
  
  return true;
};