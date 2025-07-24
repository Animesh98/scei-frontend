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

  const handleGenerate = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        unit_id: selectedUnit,
        generation_method: generationMethod,
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
    } catch (error) {
      toast.error('Failed to download study guide');
    }
  };

  const handlePreview = () => {
    if (existingGuide?.latex_content) {
      setGeneratedContent(existingGuide.latex_content);
    } else {
      toast.error('No study guide content available for preview');
    }
  };

  return (
    <AuthGuard>
      <MainLayout title="Generate Study Guides" subtitle="Create comprehensive study materials">
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Study Guide Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Select Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitsData?.rows?.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.unit_code} - {unit.unit_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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

              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !selectedUnit}
                  className="flex-1"
                >
                  {generateMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate Study Guide
                    </>
                  )}
                </Button>

                {existingGuide && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download LaTeX
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Study Guide Status */}
          {existingGuide && (
            <Card>
              <CardHeader>
                <CardTitle>Study Guide Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Generation Method</Label>
                    <p className="font-medium">{generationMethods[existingGuide.generation_method as keyof typeof generationMethods] || existingGuide.generation_method}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Generated At</Label>
                    <p className="font-medium">{new Date(existingGuide.generated_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Estimated Pages</Label>
                    <p className="font-medium">{existingGuide.page_estimate?.estimated_pages || 'N/A'}</p>
                  </div>
                </div>

                {existingGuide.validation_issues && existingGuide.validation_issues.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <Label className="text-sm font-medium text-yellow-800">Validation Issues:</Label>
                    <ul className="text-sm text-yellow-700 mt-1">
                      {existingGuide.validation_issues.map((issue, index) => (
                        <li key={index}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Content Preview */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle>LaTeX Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      This is a preview of the generated LaTeX content. Download the .tex file to compile it into a PDF.
                    </p>
                  </div>
                  
                  <Textarea
                    value={generatedContent}
                    readOnly
                    rows={25}
                    className="font-mono text-xs"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How to use this LaTeX file:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Download the .tex file using the download button</li>
                      <li>2. Open it in a LaTeX editor (like TeXworks, Overleaf, or VS Code with LaTeX extension)</li>
                      <li>3. Compile it to generate a PDF study guide</li>
                      <li>4. Make any necessary edits to customize the content</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && !existingGuide && (
            <EmptyState
              icon={<BookOpen className="h-6 w-6 text-gray-400" />}
              title="No Study Guide Generated"
              description="Select a unit and generation method, then click generate to create your first study guide."
            />
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default StudyGuidesPage;