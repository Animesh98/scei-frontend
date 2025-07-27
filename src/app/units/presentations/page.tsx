'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnitSelector from '@/components/ui/unit-selector';
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
    } catch (error: any) {
      toast.error('Failed to download presentation');
    }
  };

  const handleViewExisting = () => {
    if (existingPresentation?.beamer_content) {
      // You can implement a modal or new page to view the content
      toast.info('Viewing existing presentation content...');
    }
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
                disabled={generateMutation.isPending || !selectedUnit}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Presentation...
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Presentation available for this unit
                      </p>
                      <p className="text-xs text-green-600">
                        Generated on {new Date(existingPresentation.generated_at).toLocaleDateString()} • 
                        Theme: {existingPresentation.theme} • 
                        Colors: {existingPresentation.color_scheme}
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
                  <CardTitle>Generated Presentation</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Beamer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        {generatedContent}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && !existingPresentation && selectedUnit && (
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

export default PresentationsPage;