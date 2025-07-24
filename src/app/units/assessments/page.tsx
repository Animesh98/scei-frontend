'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import UnitSelector from '@/components/ui/unit-selector';
import { useUnits, useGenerateAssessment, useSaveAssessment, useAssessmentTypes, useAssessment } from '@/hooks/use-api';
import { useUIStore } from '@/store/ui-store';
import { generateSessionKey } from '@/lib/utils';
import { ASSESSMENT_TYPES, QUESTION_TYPES } from '@/constants';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { FileText, Download, Save, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';
import type { CheckedState } from '@radix-ui/react-checkbox';

const AssessmentsPage = () => {
  const searchParams = useSearchParams();
  const { sessionData, setSessionData, getSessionData } = useUIStore();
  
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [customSuggestion, setCustomSuggestion] = useState('');
  
  // Component selection for SCEI
  const [includePC, setIncludePC] = useState(true);
  const [includePE, setIncludePE] = useState(true);
  const [includeKE, setIncludeKE] = useState(true);

  const { data: unitsData } = useUnits(0, 100);
  const { data: assessmentTypes } = useAssessmentTypes();
  const generateMutation = useGenerateAssessment();
  const saveMutation = useSaveAssessment();

  // Fetch saved assessment when unit and type are selected
  const shouldFetchAssessment = selectedUnit && selectedAssessmentType;
  const elementId = selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING && selectedQuestionType 
    ? Math.abs(selectedQuestionType.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) 
    : undefined;
  const criteriaId = selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING && selectedQuestionType 
    ? Math.abs(selectedQuestionType.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + 1
    : undefined;

  const { data: existingAssessment, refetch: refetchAssessment } = useAssessment(
    shouldFetchAssessment ? selectedUnit : '',
    shouldFetchAssessment ? selectedAssessmentType : '',
    elementId,
    criteriaId
  );

  // Load existing assessment when available
  useEffect(() => {
    if (existingAssessment?.generated_text) {
      setGeneratedContent(existingAssessment.generated_text);
    }
  }, [existingAssessment]);

  // Load from session on mount
  useEffect(() => {
    const sessionKey = generateSessionKey(selectedUnit, selectedAssessmentType, selectedQuestionType);
    const savedContent = getSessionData(sessionKey);
    if (savedContent && !existingAssessment) {
      setGeneratedContent(savedContent);
    }
  }, [selectedUnit, selectedAssessmentType, selectedQuestionType, existingAssessment, getSessionData]);

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setGeneratedContent('');
    setSelectedAssessmentType('');
    setSelectedQuestionType('');
  };

  const handleAssessmentTypeChange = (type: string) => {
    setSelectedAssessmentType(type);
    setGeneratedContent('');
    setSelectedQuestionType('');
  };

  const handleGenerate = async () => {
    if (!selectedUnit || !selectedAssessmentType) {
      toast.error('Please select a unit and assessment type');
      return;
    }

    const sessionKey = generateSessionKey(selectedUnit, selectedAssessmentType, selectedQuestionType);

    try {
      const data: any = {
        unit_id: selectedUnit,
        type: selectedAssessmentType,
        custom_suggestion: customSuggestion,
      };

      if (selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING) {
        if (!selectedQuestionType) {
          toast.error('Please select a question type');
          return;
        }
        data.q_type = selectedQuestionType;
        data.include_pc = includePC;
        data.include_pe = includePE;
        data.include_ke = includeKE;
      }

      const result = await generateMutation.mutateAsync(data);
      
      if (result.status) {
        let content = result.data?.text || '';
        
        setGeneratedContent(content);
        
        // Save to session
        if (sessionKey) {
          setSessionData(sessionKey, content);
        }
        
        toast.success('Assessment generated successfully!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate assessment');
    }
  };

  const handleSave = async () => {
    if (!selectedUnit || !selectedAssessmentType || !generatedContent) {
      toast.error('Missing required data to save assessment');
      return;
    }

    try {
      const data: any = {
        unit_id: selectedUnit,
        type: selectedAssessmentType,
        text: generatedContent,
      };

      if (selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING && selectedQuestionType) {
        data.element_id = elementId;
        data.criteria_id = criteriaId;
      }

      await saveMutation.mutateAsync(data);
      toast.success('Assessment saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save assessment');
    }
  };

  const isQuestioning = selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING;

  return (
    <AuthGuard>
      <MainLayout 
        title="Generate Assessments" 
        subtitle="Create and manage unit assessments"
        showBackButton={true}
        backHref="/units"
      >
        <div className="space-y-6">
          {/* Unit Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Configuration</CardTitle>
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
                  <Label>Assessment Type</Label>
                  <Select value={selectedAssessmentType} onValueChange={handleAssessmentTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose assessment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assessmentTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.assessment_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Question Type Selection for Questioning */}
              {isQuestioning && (
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select value={selectedQuestionType} onValueChange={setSelectedQuestionType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QUESTION_TYPES.DIRECT_KNOWLEDGE}>Direct Knowledge Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.PROCEDURAL}>Procedural Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.SCENARIO_BASED}>Scenario-Based Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.REFLECTION_BASED}>Reflection-Based Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.SITUATIONAL_JUDGEMENT}>Situational Judgement Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.COMPARISON_ANALYSIS}>Comparison & Analysis Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Component Selection for SCEI Questioning */}
              {isQuestioning && (
                <div className="space-y-3">
                  <Label>Include Components</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-pc"
                        checked={includePC}
                        onCheckedChange={(checked: CheckedState) => setIncludePC(checked as boolean)}
                      />
                      <Label htmlFor="include-pc">Performance Criteria</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-pe"
                        checked={includePE}
                        onCheckedChange={(checked: CheckedState) => setIncludePE(checked as boolean)}
                      />
                      <Label htmlFor="include-pe">Performance Evidence</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-ke"
                        checked={includeKE}
                        onCheckedChange={(checked: CheckedState) => setIncludeKE(checked as boolean)}
                      />
                      <Label htmlFor="include-ke">Knowledge Evidence</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Suggestion */}
              <div className="space-y-2">
                <Label>Custom Suggestion (Optional)</Label>
                <Textarea
                  placeholder="Add any specific requirements or focus areas for the assessment..."
                  value={customSuggestion}
                  onChange={(e) => setCustomSuggestion(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending || !selectedUnit || !selectedAssessmentType}
                className="w-full"
              >
                {generateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Assessment</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {generatedContent}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && selectedUnit && selectedAssessmentType && (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<FileText />}
                  title="Ready to Generate"
                  description="Click the generate button above to create your assessment."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default AssessmentsPage;