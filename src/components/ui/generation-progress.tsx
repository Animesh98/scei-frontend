import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { GenerationProgress as GenerationProgressType } from '@/hooks/use-job-manager';

interface GenerationProgressProps {
  progress: GenerationProgressType;
  onCancel?: () => void;
  unitInfo?: {
    unitCode?: string;
    unitTitle?: string;
  };
  type: 'study_guide' | 'presentation';
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  onCancel,
  unitInfo,
  type
}) => {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'completed':
        return 'bg-green-600';
      case 'failed':
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const isActive = ['queued', 'started', 'processing'].includes(progress.status);
  const isCompleted = progress.status === 'completed';
  const hasError = progress.status === 'failed' || progress.status === 'error';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Generating {type === 'study_guide' ? 'Study Guide' : 'Presentation'}
          </CardTitle>
          
          {isActive && onCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{progress.progress}%</span>
          </div>
          
          <Progress 
            value={progress.progress} 
            className="w-full h-2"
          />
        </div>

        {/* Current Step */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {isActive ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            ) : isCompleted ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${getStatusColor()}`}>
              {progress.currentStep}
            </p>
            {hasError && progress.error && (
              <p className="text-sm text-red-600 mt-1">
                {progress.error}
              </p>
            )}
          </div>
        </div>

        {/* Simple completion message */}
        {isCompleted && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ {type === 'study_guide' ? 'Study guide' : 'Presentation'} generated successfully!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerationProgress;