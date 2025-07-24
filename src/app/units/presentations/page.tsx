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
import { useUnits, useGeneratePresentation, usePresentation } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Presentation, Download, FileText, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const PresentationsPage = () => {
  const searchParams = useSearchParams();
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [generationMethod, setGenerationMethod] = useState('dynamic_slides');
  const [theme, setTheme] = useState('madrid');
  const [colorScheme, setColorScheme] = useState('default');
  const [generatedContent, setGeneratedContent] = useState('');

  const { data: unitsData } = useUnits(0, 100);
  const generateMutation = useGeneratePresentation();
  const { data: existingPresentation, refetch: refetchPresentation } = usePresentation(selectedUnit);

  const generationMethods = {
    'dynamic_slides': 'AI-Generated Slide Structure (Recommended)',
    'dynamic_multi_call': 'Detailed Multi-Call Generation',
    'enhanced_single': 'Enhanced Single Call (Legacy)',
    'multi_call': 'Multi-Call with Predefined Structure (Legacy)',
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

  const handleGenerate = async () => {
    if (!selectedUnit) {
      toast.error('Please select a unit');
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        unit_id: selectedUnit,
        generation_method: generationMethod,
        theme,
        color_scheme: colorScheme,
      });

      if (result.status) {
        setGeneratedContent('Beamer presentation generated successfully! Use the download button to get the .tex file.');
        toast.success('Presentation generated successfully!');
        refetchPresentation();
      }
    } catch (error: any) {
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
    } catch (error) {
      toast.error('Failed to download presentation');
    }
  };

  const handlePreview = () => {
    if (existingPresentation?.beamer_content) {
      setGeneratedContent(existingPresentation.beamer_content);
    } else {
      toast.error('No presentation content available for preview');
    }
  };

  return (
    <AuthGuard>
      <MainLayout title="Generate Presentations" subtitle="Create instructor presentation slides">
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Presentation Configuration</CardTitle>
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
                      Generate Presentation
                    </>
                  )}
                </Button>

                {existingPresentation && (
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
                      Download Beamer
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Presentation Status */}
          {existingPresentation && (
            <Card>
              <CardHeader>
                <CardTitle>Presentation Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Generation Method</Label>
                    <p className="font-medium">{generationMethods[existingPresentation.generation_method as keyof typeof generationMethods] || existingPresentation.generation_method}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Theme</Label>
                    <p className="font-medium">{themes[existingPresentation.theme as keyof typeof themes] || existingPresentation.theme}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Generated At</Label>
                    <p className="font-medium">{new Date(existingPresentation.generated_at).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Estimated Slides</Label>
                    <p className="font-medium">{existingPresentation.slide_estimate?.estimated_slides || 'N/A'}</p>
                  </div>
                </div>

                {existingPresentation.validation_issues && existingPresentation.validation_issues.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <Label className="text-sm font-medium text-yellow-800">Validation Issues:</Label>
                    <ul className="text-sm text-yellow-700 mt-1">
                      {existingPresentation.validation_issues.map((issue, index) => (
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
                <CardTitle>Beamer Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      This is a preview of the generated Beamer LaTeX content. Download the .tex file to compile it into presentation slides.
                    </p>
                  </div>
                  
                  <Textarea
                    value={generatedContent}
                    readOnly
                    rows={25}
                    className="font-mono text-xs"
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How to use this Beamer file:</h4>
                    <ol className="text-sm text-blue-800 space-y-1">
                      <li>1. Download the .tex file using the download button</li>
                      <li>2. Open it in a LaTeX editor that supports Beamer (like Overleaf or TeXworks)</li>
                      <li>3. Compile it to generate PDF presentation slides</li>
                      <li>4. Present directly or make customizations as needed</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && !existingPresentation && (
            <EmptyState
              icon={<Presentation className="h-6 w-6 text-gray-400" />}
              title="No Presentation Generated"
              description="Select a unit and presentation settings, then click generate to create your first presentation."
            />
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default PresentationsPage;