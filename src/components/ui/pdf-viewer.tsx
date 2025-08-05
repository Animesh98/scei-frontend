'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import { PdfViewerState } from '@/types';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface PdfViewerProps {
  pdfUrl?: string;
  fileName?: string;
  isLoading?: boolean;
  error?: string;
  className?: string;
  showSaveButton?: boolean;
  onSaveAssessorGuide?: () => void;
  isSaving?: boolean;
  saveButtonText?: string;
  saveButtonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

const PdfViewer = ({ 
  pdfUrl, 
  fileName = 'document.pdf', 
  isLoading = false, 
  error,
  className = '',
  showSaveButton = false,
  onSaveAssessorGuide,
  isSaving = false,
  saveButtonText = 'Save Assessor Guide',
  saveButtonVariant = 'default'
}: PdfViewerProps) => {
  const [viewerError, setViewerError] = useState<string | null>(null);

  const handleDownload = () => {
    if (!pdfUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('PDF download started');
    } catch (err) {
      toast.error('Failed to download PDF');
    }
  };


  const handleIframeError = () => {
    setViewerError('Failed to load PDF. Your browser may not support PDF viewing.');
  };

  // Reset viewer error when pdfUrl changes
  useEffect(() => {
    setViewerError(null);
  }, [pdfUrl]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading PDF viewer...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || viewerError) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                PDF Viewer Error
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error || viewerError}
              </p>
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="mt-3"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF Instead
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pdfUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No PDF available to display
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">PDF Viewer</CardTitle>
          <div className="flex items-center space-x-2">
            {showSaveButton && onSaveAssessorGuide && (
              <Button
                variant={saveButtonVariant}
                size="sm"
                onClick={onSaveAssessorGuide}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                    Saving...
                  </>
                ) : (
                  saveButtonText
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <div className="w-full h-[600px] flex items-center justify-center">
            <iframe
              src={pdfUrl}
              title="PDF Viewer"
              className="w-full h-full border-0"
              onError={handleIframeError}
              style={{
                minHeight: '600px',
              }}
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>
            If the PDF doesn&apos;t display properly, try downloading it or opening in a new tab.
            {' '}
            <button
              onClick={() => window.open(pdfUrl, '_blank')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Open in new tab
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PdfViewer;