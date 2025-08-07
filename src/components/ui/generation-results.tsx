import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  FileCheck, 
  BarChart3,
  Clock
} from 'lucide-react';
import { GenerationResult } from '@/hooks/use-job-manager';

interface GenerationResultsProps {
  result: GenerationResult;
  onView?: () => void;
  onDownload?: () => void;
  className?: string;
}

const GenerationResults: React.FC<GenerationResultsProps> = ({
  result,
  onView,
  onDownload,
  className = ''
}) => {
  const isStudyGuide = result.type === 'study_guide';
  const content = result.result;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getContentStats = () => {
    if (isStudyGuide) {
      return {
        pageEstimate: content.page_estimate?.estimated_pages || 0,
        wordCount: content.page_estimate?.word_count || 0,
        sectionsCount: content.content_analysis?.total_sections || 0
      };
    } else {
      return {
        slideEstimate: content.slide_estimate?.estimated_slides || 0,
        sectionsCount: content.content_analysis?.total_slides || 0
      };
    }
  };

  const stats = getContentStats();

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-600" />
            <span>
              {isStudyGuide ? 'Study Guide' : 'Presentation'} Generated
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              Success
            </Badge>
          </CardTitle>
          
          <div className="flex space-x-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
            )}
            
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Simple success message */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✅ {isStudyGuide ? 'Study guide' : 'Presentation'} generated successfully! 
            The content is ready for viewing and download.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerationResults;