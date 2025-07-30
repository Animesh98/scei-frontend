'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnitSelector from '@/components/ui/unit-selector';
import { useUnits, useGeneratePresentation, usePresentation, useProcessLatex } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import PdfViewer from '@/components/ui/pdf-viewer';
import LatexEditor from '@/components/ui/latex-editor';
import ViewToggle from '@/components/ui/view-toggle';
import { Presentation, Download, FileText, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PROCESSING_STATES, VIEW_MODES } from '@/constants';
import { ProcessingState, ViewMode } from '@/types';

const PresentationsPage = () => {
  const searchParams = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [generationMethod, setGenerationMethod] = useState('dynamic_slides');
  const [theme, setTheme] = useState('madrid');
  const [colorScheme, setColorScheme] = useState('default');
  const [generatedContent, setGeneratedContent] = useState('');
  
  // Enhanced state for LaTeX processing workflow
  const [processingState, setProcessingState] = useState<ProcessingState>(PROCESSING_STATES.IDLE);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_MODES.PDF);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [latexContent, setLatexContent] = useState('');
  const [latexModified, setLatexModified] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const { data: unitsData } = useUnits(0, 100);
  const generateMutation = useGeneratePresentation();
  const processLatexMutation = useProcessLatex();
  const { data: existingPresentation, refetch: refetchPresentation } = usePresentation(selectedUnit);

  const generationMethods = {
    'dynamic_slides': 'Standard Generation - Generates a standard document, takes 8-10 mins to render',
    'dynamic_multi_call': 'Detailed Generation - Generates much detailed and longer document, takes 12-15 mins',
  };

  const themes = {
    'madrid': 'Professional Madrid Theme',
    'berlin': 'Clean Berlin Theme',
    'warsaw': 'Corporate Warsaw Theme',
    'copenhagen': 'Minimal Copenhagen Theme',
    'singapore': 'Simple Singapore Theme',
  };

  const colorSchemes = {
    'default': 'Blue-based Professional Scheme',
    'educational': 'Green and Orange Educational Scheme',
    'corporate': 'Gray and Blue Corporate Scheme',
    'modern': 'Purple and Teal Modern Scheme',
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setGeneratedContent('');
    resetProcessingState();
  };

  const resetProcessingState = () => {
    setProcessingState(PROCESSING_STATES.IDLE);
    setViewMode(VIEW_MODES.PDF);
    setPdfUrl(null);
    setLatexContent('');
    setLatexModified(false);
    setProcessingError(null);
  };
  
  const processLatexToPdf = async (latexFileContent: string) => {
    try {
      setProcessingState(PROCESSING_STATES.PROCESSING_PDF);
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
        setProcessingState(PROCESSING_STATES.COMPLETED);
        toast.success('PDF generated successfully!');
      } else {
        setProcessingState(PROCESSING_STATES.ERROR);
        setProcessingError(result.message || 'Failed to generate PDF');
        
        if (result.errors_found && result.errors_found.length > 0) {
          toast.error(`LaTeX compilation errors: ${result.errors_found.join(', ')}`);
        } else {
          toast.error(result.message || 'Failed to generate PDF');
        }
      }
    } catch (error: any) {
      setProcessingState(PROCESSING_STATES.ERROR);
      setProcessingError(error.message || 'An unexpected error occurred');
      toast.error('Failed to process LaTeX file');
    }
  };

  const handleGenerate = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      setProcessingState(PROCESSING_STATES.GENERATING_LATEX);
      resetProcessingState();
      setProcessingState(PROCESSING_STATES.GENERATING_LATEX);
      
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const result = await generateMutation.mutateAsync({
        unit_id: selectedUnit,
        generation_method: generationMethod,
        theme,
        color_scheme: colorScheme,
        timezone: userTimezone,
      });

      if (result.status) {
        setGeneratedContent('LaTeX generated, now processing to generate PDF...');
        toast.success('Beamer LaTeX generated successfully!');
        refetchPresentation();
        
        // Fetch the generated LaTeX content
        const updatedPresentation = await refetchPresentation();
        if (updatedPresentation.data?.beamer_content) {
          setLatexContent(updatedPresentation.data.beamer_content);
          // Auto-process to PDF
          await processLatexToPdf(updatedPresentation.data.beamer_content);
        }
      }
    } catch (error: any) {
      setProcessingState(PROCESSING_STATES.ERROR);
      setProcessingError(error.response?.data?.message || 'Failed to generate presentation');
      toast.error(error.response?.data?.message || 'Failed to generate presentation');
    }
  };

  const handleDownload = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      // Create download URL
      const downloadUrl = `http://localhost:7071/api/presentations/${selectedUnit}/download-beamer`;
      window.open(downloadUrl, '_blank');
      toast.success('Download started!');
    } catch (error: any) {
      toast.error('Failed to download presentation');
    }
  };

  const handleViewExisting = async () => {
    if (existingPresentation?.beamer_content) {
      setLatexContent(existingPresentation.beamer_content);
      setProcessingState(PROCESSING_STATES.COMPLETED);
      
      // Auto-process existing LaTeX to PDF
      await processLatexToPdf(existingPresentation.beamer_content);
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

  const getProcessingMessage = () => {
    switch (processingState) {
      case PROCESSING_STATES.GENERATING_LATEX:
        return 'Generating Beamer LaTeX content...';
      case PROCESSING_STATES.PROCESSING_PDF:
        return 'LaTeX generated, now processing to generate PDF...';
      case PROCESSING_STATES.COMPLETED:
        return 'Presentation generated successfully!';
      case PROCESSING_STATES.ERROR:
        return `Error: ${processingError}`;
      default:
        return '';
    }
  };

  const isProcessing = processingState === PROCESSING_STATES.GENERATING_LATEX || 
                     processingState === PROCESSING_STATES.PROCESSING_PDF;

  return (
    <AuthGuard>
      <MainLayout 
        title="Generate Presentations" 
        subtitle="Create professional presentation slides for units"
        showBackButton={true}
        backHref="/units"
      >
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Presentation Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Enhanced Unit Selector */}
                <UnitSelector
                  units={unitsData?.rows || []}
                  selectedUnit={selectedUnit}
                  onUnitSelect={handleUnitSelect}
                  label="Select Unit"
                  placeholder="Search units..."
                />

                <div className="space-y-2">
                  <Label>Generation Method</Label>
                  <Select value={generationMethod} onValueChange={setGenerationMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose generation method" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(generationMethods).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(themes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={setColorScheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose color scheme" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(colorSchemes).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isProcessing || !selectedUnit}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {processingState === PROCESSING_STATES.GENERATING_LATEX ? 'Generating LaTeX...' : 'Processing PDF...'}
                  </>
                ) : (
                  <>
                    <Presentation className="mr-2 h-4 w-4" />
                    Generate Presentation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

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

          {/* Processing Status */}
          {isProcessing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getProcessingMessage()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      This may take a few moments...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF/LaTeX Viewer */}
          {processingState === PROCESSING_STATES.COMPLETED && (latexContent || pdfUrl) && (
            <div className="space-y-4">
              {/* View Toggle */}
              <div className="flex justify-center">
                <ViewToggle
                  currentView={viewMode}
                  onViewChange={setViewMode}
                  disabled={isProcessing}
                />
              </div>

              {/* Content Viewer */}
              {viewMode === VIEW_MODES.PDF ? (
                <PdfViewer
                  pdfUrl={pdfUrl || undefined}
                  fileName={`${selectedUnit}_presentation.pdf`}
                  isLoading={processingState === PROCESSING_STATES.PROCESSING_PDF}
                  error={processingState === PROCESSING_STATES.ERROR ? processingError : undefined}
                />
              ) : (
                <LatexEditor
                  content={latexContent}
                  isLoading={isProcessing}
                  isModified={latexModified}
                  error={processingState === PROCESSING_STATES.ERROR ? processingError : undefined}
                  onContentChange={handleLatexContentChange}
                  onRenderPdf={handleRenderPdf}
                  fileName={`${selectedUnit}_presentation.tex`}
                />
              )}
            </div>
          )}

          {/* Error State */}
          {processingState === PROCESSING_STATES.ERROR && !isProcessing && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full">
                      <RefreshCw className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Generation Failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {processingError}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerate}
                    disabled={isProcessing}
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {processingState === PROCESSING_STATES.IDLE && !existingPresentation && selectedUnit && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<Presentation />}
                  title="Ready to Generate"
                  description="Click the generate button above to create professional presentation slides for this unit."
                />
              </CardContent>
            </Card>
          )}

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