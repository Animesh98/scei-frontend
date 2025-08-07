'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnitSelector from '@/components/ui/unit-selector';
import { useUnits, usePresentation, useProcessLatex } from '@/hooks/use-api';
import { useJobManager } from '@/hooks/use-job-manager';
import GenerationOptions from '@/components/ui/generation-options';
import GenerationProgress from '@/components/ui/generation-progress';
import GenerationResults from '@/components/ui/generation-results';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import PdfViewer from '@/components/ui/pdf-viewer';
import LatexEditor from '@/components/ui/latex-editor';
import ViewToggle from '@/components/ui/view-toggle';
import { Presentation, Download, FileText, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VIEW_MODES, API_BASE_URL } from '@/constants';
import { ViewMode } from '@/types';
import { GenerationConfig } from '@/components/ui/generation-options';

const PresentationsPage = () => {
  const searchParams = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.PDF);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [latexContent, setLatexContent] = useState('');
  const [latexModified, setLatexModified] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const { data: unitsData } = useUnits(0, 100);
  const processLatexMutation = useProcessLatex();
  const { data: existingPresentation, refetch: refetchPresentation } = usePresentation(selectedUnit);
  
  // New job manager for asynchronous generation
  const {
    startGeneration,
    cancelGeneration,
    reset: resetJobManager,
    progress,
    result,
    isGenerating,
    isCompleted,
    isFailed,
    hasError
  } = useJobManager();

  // Debug logging
  React.useEffect(() => {
    console.log('Presentations Page - State Update:', {
      isGenerating,
      hasProgress: !!progress,
      progress: progress,
      isCompleted,
      isFailed,
      hasError,
      hasResult: !!result
    });
  }, [isGenerating, progress, isCompleted, isFailed, hasError, result]);

  const selectedUnitData = unitsData?.rows?.find(unit => unit._id === selectedUnit);


  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    resetJobManager();
    resetProcessingState();
  };

  const resetProcessingState = () => {
    setViewMode(VIEW_MODES.PDF);
    setPdfUrl(null);
    setLatexContent('');
    setLatexModified(false);
    setProcessingError(null);
  };
  
  const processLatexToPdf = async (latexFileContent: string) => {
    try {
      setProcessingError(null);
      
      // Create a file from the LaTeX content
      const latexBlob = new Blob([latexFileContent], { type: 'text/plain' });
      const latexFile = new File([latexBlob], `${selectedUnit}_presentation.tex`, { type: 'text/plain' });
      
      const result = await processLatexMutation.mutateAsync({
        latex_file: latexFile,
        auto_fix: true,
      });

      if (result.status === 'success' && result.pdf_created) {
        setPdfUrl((result as any).pdfUrl);
        toast.success('PDF generated successfully!');
      } else {
        setProcessingError(result.message || 'Failed to generate PDF');
        
        if (result.errors_found && result.errors_found.length > 0) {
          toast.error(`LaTeX compilation errors: ${result.errors_found.join(', ')}`);
        } else {
          toast.error(result.message || 'Failed to generate PDF');
        }
      }
    } catch (error: any) {
      setProcessingError(error.message || 'An unexpected error occurred');
      toast.error('Failed to process LaTeX file');
    }
  };

  const handleGenerate = async (config: GenerationConfig) => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      resetProcessingState();
      
      await startGeneration('presentation', selectedUnit, {
        generation_method: config.generation_method,
        theme: config.theme,
        color_scheme: config.color_scheme,
        user_timezone: config.user_timezone
      });
      
      toast.success('Presentation generation started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start presentation generation');
    }
  };

  // Handle completed generation - extract Beamer content and process to PDF
  React.useEffect(() => {
    if (isCompleted && result?.result?.beamer_content) {
      setLatexContent(result.result.beamer_content);
      // Auto-process to PDF
      processLatexToPdf(result.result.beamer_content);
    }
  }, [isCompleted, result]);

  const handleDownload = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      // Create download URL using Azure API
      const downloadUrl = `${API_BASE_URL}/presentations/${selectedUnit}/download-beamer`;
      window.open(downloadUrl, '_blank');
      toast.success('Download started!');
    } catch (error: any) {
      toast.error('Failed to download presentation');
    }
  };

  const handleViewExisting = async () => {
    if (existingPresentation?.beamer_content) {
      setLatexContent(existingPresentation.beamer_content);
      
      // Auto-process existing LaTeX to PDF
      await processLatexToPdf(existingPresentation.beamer_content);
    }
  };

  const handleViewResult = () => {
    if (result?.result?.beamer_content) {
      setLatexContent(result.result.beamer_content);
      processLatexToPdf(result.result.beamer_content);
    }
  };

  const handleDownloadResult = () => {
    if (result?.result?.beamer_content) {
      const blob = new Blob([result.result.beamer_content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedUnitData?.unit_code || selectedUnit}_presentation.tex`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Beamer LaTeX file downloaded!');
    }
  };

  const handleLatexContentChange = (content: string) => {
    setLatexContent(content);
    setLatexModified(true);
  };

  const handleRenderPdf = async () => {
    if (!latexContent) {
      toast.error('No LaTeX content to render');
      return;
    }
    await processLatexToPdf(latexContent);
    setLatexModified(false);
  };


  return (
    <AuthGuard>
      <MainLayout 
        title="Generate Presentations" 
        subtitle="Create professional presentation slides for units"
        showBackButton={true}
        backHref="/units"
      >
        <div className="space-y-6">
          {/* Unit Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Unit</CardTitle>
            </CardHeader>
            <CardContent>
              <UnitSelector
                units={unitsData?.rows || []}
                selectedUnit={selectedUnit}
                onUnitSelect={handleUnitSelect}
                label="Select Unit"
                placeholder="Search units..."
              />
            </CardContent>
          </Card>

          {/* Generation Options - Show only if unit is selected and not generating */}
          {selectedUnit && !isGenerating && (
            <GenerationOptions
              type="presentation"
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
              disabled={!selectedUnit}
            />
          )}

          {/* Existing Presentation */}
          {existingPresentation && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Existing Presentation</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleViewExisting}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Beamer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Presentation available for this unit
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Generated on {new Date(existingPresentation.generated_at).toLocaleString()} • 
                        Theme: {existingPresentation.theme} • 
                        Colors: {existingPresentation.color_scheme}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Progress */}
          {isGenerating && progress && (
            <GenerationProgress
              progress={progress}
              onCancel={cancelGeneration}
              unitInfo={selectedUnitData ? {
                unitCode: selectedUnitData.unit_code,
                unitTitle: selectedUnitData.name
              } : undefined}
              type="presentation"
            />
          )}

          {/* Generation Results */}
          {isCompleted && result && (
            <GenerationResults
              result={result}
              onView={handleViewResult}
              onDownload={handleDownloadResult}
            />
          )}

          {/* PDF/LaTeX Viewer - Show when content is available */}
          {(latexContent || pdfUrl) && (
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex justify-center">
                <ViewToggle
                  currentView={viewMode}
                  onViewChange={setViewMode}
                  disabled={false}
                />
              </div>

              {/* Content Viewer */}
              {viewMode === VIEW_MODES.PDF ? (
                <PdfViewer
                  pdfUrl={pdfUrl || undefined}
                  fileName={`${selectedUnitData?.unit_code || selectedUnit}_presentation.pdf`}
                  isLoading={processLatexMutation.isPending}
                  error={processingError}
                />
              ) : (
                <LatexEditor
                  content={latexContent}
                  isLoading={false}
                  isModified={latexModified}
                  error={processingError}
                  onContentChange={handleLatexContentChange}
                  onRenderPdf={handleRenderPdf}
                  fileName={`${selectedUnitData?.unit_code || selectedUnit}_presentation.tex`}
                />
              )}
            </div>
          )}


          {/* Empty State - Show when no unit selected */}
          {!selectedUnit && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<Presentation />}
                  title="Select a Unit"
                  description="Choose a unit from the dropdown above to get started with presentation generation."
                />
              </CardContent>
            </Card>
          )}

          {/* Ready State - Show when unit selected but no generation in progress */}
          {selectedUnit && !isGenerating && !result && !existingPresentation && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<Presentation />}
                  title="Ready to Generate"
                  description="Configure your generation options above and click generate to create professional presentation slides for this unit."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

const PresentationsPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresentationsPage />
    </Suspense>
  );
};

export default PresentationsPageWithSuspense;