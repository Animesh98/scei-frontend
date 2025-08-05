'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import UnitSelector from '@/components/ui/unit-selector';
import { useUnits, useUploadAssessorGuide, useAssessorGuideStatus } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import PdfViewer from '@/components/ui/pdf-viewer';
import { UserCheck, Download, FileText, Eye, RefreshCw, Loader2, ChevronDown, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/constants';
import { useRouter } from 'next/navigation';

interface AssessmentType {
  assessment_type_id: string;
  assessment_name: string;
  available: boolean;
  has_content: boolean;
}

interface AssessmentTypesResponse {
  unit_code: string;
  unit_title: string;
  available_assessment_types: AssessmentType[];
  total_assessment_types: number;
}

const AssessorGuidesPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [selectedAssessmentTypes, setSelectedAssessmentTypes] = useState<string[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [unitInfo, setUnitInfo] = useState<{ unit_code: string; unit_title: string } | null>(null);
  const [isLoadingAssessmentTypes, setIsLoadingAssessmentTypes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatedGuide, setGeneratedGuide] = useState<any>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssessorGuideSaved, setIsAssessorGuideSaved] = useState(false);

  const { data: unitsData } = useUnits(0, 100);
  const uploadAssessorGuideMutation = useUploadAssessorGuide();
  const { data: assessorGuideStatus, refetch: refetchAssessorGuideStatus } = useAssessorGuideStatus(selectedUnit);

  const fetchAssessmentTypes = async (unitCode: string) => {
    setIsLoadingAssessmentTypes(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assessor-guides/${unitCode}/assessment-types`);
      const data = await response.json();
      
      if (data.status && data.data) {
        setAssessmentTypes(data.data.available_assessment_types || []);
        setUnitInfo({
          unit_code: data.data.unit_code,
          unit_title: data.data.unit_title
        });
        // Initially select all available assessment types
        setSelectedAssessmentTypes(
          data.data.available_assessment_types?.map((type: AssessmentType) => type.assessment_type_id) || []
        );
      } else {
        toast.error(data.message || 'Failed to fetch assessment types');
        setAssessmentTypes([]);
        setUnitInfo(null);
      }
    } catch (error: any) {
      toast.error('Failed to fetch assessment types');
      setAssessmentTypes([]);
      setUnitInfo(null);
    } finally {
      setIsLoadingAssessmentTypes(false);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setSelectedAssessmentTypes([]);
    setAssessmentTypes([]);
    setUnitInfo(null);
    setPdfUrl(null);
    setGeneratedGuide(null);
    setIsAssessorGuideSaved(false);
    
    // Find the selected unit to get its unit_code
    const selectedUnitData = unitsData?.rows?.find(unit => unit._id === unitId);
    if (selectedUnitData?.unit_code) {
      fetchAssessmentTypes(selectedUnitData.unit_code);
    }
  };

  const handleAssessmentTypeToggle = (assessmentTypeId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssessmentTypes(prev => [...prev, assessmentTypeId]);
    } else {
      setSelectedAssessmentTypes(prev => prev.filter(id => id !== assessmentTypeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAssessmentTypes(assessmentTypes.map(type => type.assessment_type_id));
    } else {
      setSelectedAssessmentTypes([]);
    }
  };

  const generateAssessorGuide = async () => {
    if (!unitInfo?.unit_code) {
      toast.error('Please select a unit');
      return;
    }

    if (selectedAssessmentTypes.length === 0) {
      toast.error('Please select at least one assessment type');
      return;
    }

    setIsGenerating(true);
    setIsAssessorGuideSaved(false); // Reset saved state when generating new guide
    try {
      const response = await fetch(`${API_BASE_URL}/assessor-guides/generate/${unitInfo.unit_code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected_assessment_types: selectedAssessmentTypes,
          generation_options: {
            professional_format: true,
            include_rubrics: true,
            include_guidelines: true,
            ai_enhanced_content: true
          }
        })
      });

      const data = await response.json();
      
      if (data.status) {
        setGeneratedGuide(data.data);
        toast.success('Assessor guide generated successfully!');
        
        // Fetch the PDF
        await fetchGeneratedPdf();
      } else {
        toast.error(data.message || 'Failed to generate assessor guide');
      }
    } catch (error: any) {
      toast.error('Failed to generate assessor guide');
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchGeneratedPdf = async () => {
    if (!unitInfo?.unit_code) return;

    try {
      const response = await fetch(`${API_BASE_URL}/assessor-guides/${unitInfo.unit_code}/download-pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        toast.error('Failed to fetch generated PDF');
      }
    } catch (error: any) {
      toast.error('Failed to fetch PDF');
    }
  };

  const downloadPdf = () => {
    if (!unitInfo?.unit_code) return;
    
    const downloadUrl = `${API_BASE_URL}/assessor-guides/${unitInfo.unit_code}/download-pdf`;
    window.open(downloadUrl, '_blank');
    toast.success('Download started!');
  };

  const handleSaveAssessorGuide = async () => {
    // If already saved, navigate to study guide page
    if (isAssessorGuideSaved) {
      handleGenerateStudyGuide();
      return;
    }

    if (!pdfUrl || !selectedUnit || !unitInfo?.unit_code) {
      toast.error('Unable to save assessor guide');
      return;
    }

    setIsSaving(true);
    
    // Show initial processing message
    toast.info(`Preparing to save assessor guide for ${unitInfo.unit_code}...`);
    
    try {
      // Convert the PDF URL to a File object
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], `${unitInfo.unit_code}_AssessorGuide.pdf`, { type: 'application/pdf' });

      // Show upload progress message
      toast.info('Uploading assessor guide to unit database...');

      await uploadAssessorGuideMutation.mutateAsync({
        assessor_guide_file: file,
        unit_id: selectedUnit,
        unit_code: unitInfo.unit_code
      });

      toast.success(`Assessor guide saved to ${unitInfo.unit_code}! You can now generate study guides.`);
      setIsAssessorGuideSaved(true);
      refetchAssessorGuideStatus();
    } catch (error: any) {
      toast.error('Failed to save assessor guide. Please try again.');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateStudyGuide = () => {
    router.push(`/units/study-guides?unit=${selectedUnit}`);
  };

  const allSelected = selectedAssessmentTypes.length === assessmentTypes.length;
  const someSelected = selectedAssessmentTypes.length > 0;

  return (
    <AuthGuard>
      <MainLayout 
        title="Generate Assessor Guides" 
        subtitle="Create comprehensive assessor guides with rubrics for units"
        showBackButton={true}
        backHref="/units"
      >
        <div className="space-y-6">
          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Assessor Guide Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unit Selector */}
                <UnitSelector
                  units={unitsData?.rows || []}
                  selectedUnit={selectedUnit}
                  onUnitSelect={handleUnitSelect}
                  label="Select Unit"
                  placeholder="Search units..."
                />

                {/* Assessment Types Multiselect */}
                {selectedUnit && (
                  <div className="space-y-2">
                    <Label>Assessment Types to Include</Label>
                    {isLoadingAssessmentTypes ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">Loading assessment types...</span>
                      </div>
                    ) : assessmentTypes.length > 0 ? (
                      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {someSelected
                              ? `${selectedAssessmentTypes.length} of ${assessmentTypes.length} selected`
                              : "Select assessment types..."
                            }
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <div className="max-h-60 overflow-auto">
                            <div className="p-2 border-b">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="select-all"
                                  checked={allSelected}
                                  onCheckedChange={handleSelectAll}
                                />
                                <label
                                  htmlFor="select-all"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Select All
                                </label>
                              </div>
                            </div>
                            <div className="p-2 space-y-2">
                              {assessmentTypes.map((type) => (
                                <div key={type.assessment_type_id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={type.assessment_type_id}
                                    checked={selectedAssessmentTypes.includes(type.assessment_type_id)}
                                    onCheckedChange={(checked) => 
                                      handleAssessmentTypeToggle(type.assessment_type_id, checked as boolean)
                                    }
                                  />
                                  <label
                                    htmlFor={type.assessment_type_id}
                                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {type.assessment_name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="text-sm text-gray-500">No assessment types available for this unit</p>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <Button 
                onClick={generateAssessorGuide} 
                disabled={isGenerating || !selectedUnit || selectedAssessmentTypes.length === 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Assessor Guide...
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Generate Assessor Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>


          {/* Processing Status */}
          {isGenerating && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Generating assessor guide...
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      This may take a few moments...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Viewer */}
          {pdfUrl && (
            <div className="space-y-3">
              {/* Helper message */}
              {!isAssessorGuideSaved && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Save this assessor guide to your unit</p>
                      <p className="text-blue-600 dark:text-blue-300 mt-1">
                        Saving will store this guide in <span className="font-medium">{unitInfo?.unit_code}</span> and enable study guide generation for this unit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <PdfViewer
                pdfUrl={pdfUrl}
                fileName={`${unitInfo?.unit_code}_AssessorGuide.pdf`}
                isLoading={false}
                showSaveButton={true}
                onSaveAssessorGuide={handleSaveAssessorGuide}
                isSaving={isSaving}
                saveButtonText={isAssessorGuideSaved ? 'Generate Study Guide' : 'Save Assessor Guide'}
                saveButtonVariant={isAssessorGuideSaved ? 'default' : 'outline'}
              />
            </div>
          )}

          {/* Empty State */}
          {!selectedUnit && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<UserCheck />}
                  title="Select a Unit"
                  description="Choose a unit from the dropdown above to get started with assessor guide generation."
                />
              </CardContent>
            </Card>
          )}

          {selectedUnit && assessmentTypes.length === 0 && !isLoadingAssessmentTypes && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<UserCheck />}
                  title="No Assessment Types Available"
                  description="This unit doesn't have any assessment types with content available for assessor guide generation."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

const AssessorGuidesPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssessorGuidesPage />
    </Suspense>
  );
};

export default AssessorGuidesPageWithSuspense;