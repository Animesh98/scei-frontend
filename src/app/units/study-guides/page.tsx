'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnitSelector from '@/components/ui/unit-selector';
import { useUnits, useGenerateStudyGuide, useStudyGuide } from '@/hooks/use-api';
import { downloadFile } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { BookOpen, Download, FileText, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const StudyGuidesPage = () => {
  const searchParams = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [generationMethod, setGenerationMethod] = useState('dynamic_chapters');
  const [generatedContent, setGeneratedContent] = useState('');

  const { data: unitsData } = useUnits(0, 100);
  const generateMutation = useGenerateStudyGuide();
  const { data: existingGuide, refetch: refetchGuide } = useStudyGuide(selectedUnit);

  const generationMethods = {
    'dynamic_chapters': 'AI-Generated Chapter Structure (Recommended)',
    'dynamic_multi_call': 'Detailed Multi-Call Generation',
    'enhanced_single': 'Enhanced Single Call (Legacy)',
    'multi_call': 'Multi-Call with Predefined Structure (Legacy)',
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setGeneratedContent('');
  };

  const handleGenerate = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      // Get user's timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const result = await generateMutation.mutateAsync({
        unit_id: selectedUnit,
        generation_method: generationMethod,
        timezone: userTimezone,
      });

      if (result.status) {
        setGeneratedContent('LaTeX content generated successfully! Use the download button to get the .tex file.');
        toast.success('Study guide generated successfully!');
        refetchGuide();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate study guide');
    }
  };

  const handleDownload = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      // Create download URL
      const downloadUrl = `http://localhost:7071/api/study-guides/${selectedUnit}/download-latex`;
      window.open(downloadUrl, '_blank');
      toast.success('Download started!');
    } catch (error: any) {
      toast.error('Failed to download study guide');
    }
  };

  const handleViewExisting = () => {
    if (existingGuide?.latex_content) {
      // You can implement a modal or new page to view the content
      toast.info('Viewing existing guide content...');
    }
  };

  return (
    <AuthGuard>
      <MainLayout 
        title="Generate Study Guides" 
        subtitle="Create comprehensive study materials for units"
        showBackButton={true}
        backHref="/units"
      >
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Study Guide Configuration</CardTitle>
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
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending || !selectedUnit}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Study Guide...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Generate Study Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Guide */}
          {existingGuide && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Existing Study Guide</CardTitle>
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
                      Download LaTeX
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
                        Study guide available for this unit
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Generated on {new Date(existingGuide.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Content Status */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Study Guide</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download LaTeX
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {generatedContent}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && !existingGuide && selectedUnit && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<BookOpen />}
                  title="Ready to Generate"
                  description="Click the generate button above to create a comprehensive study guide for this unit."
                />
              </CardContent>
            </Card>
          )}

          {!selectedUnit && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<BookOpen />}
                  title="Select a Unit"
                  description="Choose a unit from the dropdown above to get started with study guide generation."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default StudyGuidesPage;