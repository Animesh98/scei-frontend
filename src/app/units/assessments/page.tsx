'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Badge } from '@/components/ui/badge';
import UnitSelector from '@/components/ui/unit-selector';
import MarkdownRenderer from '@/components/ui/markdown-renderer';
import { useUnits, useGenerateAssessment, useSaveAssessment, useAssessmentTypes, useAssessment } from '@/hooks/use-api';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { generateSessionKey } from '@/lib/utils';
import { 
  parseAssessmentContent, 
  formatAssessmentContent, 
  saveAssessmentToHistory, 
  getFilteredAssessmentHistory,
  formatTimestamp,
  type AssessmentHistoryItem 
} from '@/lib/assessment-utils';
import { ASSESSMENT_TYPES, QUESTION_TYPES } from '@/constants';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { FileText, Download, Save, RefreshCw, Settings, History, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { CheckedState } from '@radix-ui/react-checkbox';

const AssessmentsPage = () => {
  const searchParams = useSearchParams();
  const { sessionData, setSessionData, getSessionData } = useUIStore();
  const { user } = useAuthStore();
  
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<string | null>(null);
  
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
  const isQuestioning = selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING;
  
  const { data: existingAssessment, refetch: refetchAssessment } = useAssessment(
    shouldFetchAssessment ? selectedUnit : '',
    shouldFetchAssessment ? selectedAssessmentType : '',
    isQuestioning && selectedQuestionType ? selectedQuestionType : undefined
  );

  // Load existing assessment when available
  useEffect(() => {
    if (existingAssessment) {
      // Handle both SCEI (generated_text) and SCEI-HE (assessment) field names
      const content = existingAssessment.generated_text || existingAssessment.assessment || '';
      if (content) {
        setGeneratedContent(content);
      }
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

  // Load assessment history when unit or assessment type changes
  useEffect(() => {
    const history = getFilteredAssessmentHistory(selectedUnit, selectedAssessmentType);
    setAssessmentHistory(history);
  }, [selectedUnit, selectedAssessmentType]);

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

    // Check if unit exists in the current units list
    const selectedUnitData = unitsData?.rows?.find(u => u.id === selectedUnit);
    if (!selectedUnitData) {
      toast.error('Selected unit not found. Please refresh and try again.');
      return;
    }

    console.log('Generating assessment for unit:', {
      id: selectedUnit,
      code: selectedUnitData.unit_code,
      title: selectedUnitData.unit_title,
      assessmentType: selectedAssessmentType,
      questionType: selectedQuestionType
    });

    const sessionKey = generateSessionKey(selectedUnit, selectedAssessmentType, selectedQuestionType);

    try {
      const data: any = {
        unit_id: selectedUnit,
        type: selectedAssessmentType,
        suggestion: customSuggestion,
        text: generatedContent || '', // Add the current assessment text
      };

      if (selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING) {
        if (!selectedQuestionType) {
          toast.error('Please select a question type');
          return;
        }
        data.question_type = selectedQuestionType;
        // Component filtering is ignored for questioning assessments (handled in API hook)
      } else if (user?.domain === 'scei') {
        // Component filtering only applies to non-questioning SCEI assessments
        data.include_pc = includePC;
        data.include_pe = includePE;
        data.include_ke = includeKE;
      }
      // SCEI-HE non-questioning assessments don't use component filtering

      const result = await generateMutation.mutateAsync(data);
      
      if (result.status) {
        // The API returns data.text as a JSON string that needs to be parsed
        let content = result.data?.text || '';
        
        setGeneratedContent(content);
        
        // Save to session
        if (sessionKey) {
          setSessionData(sessionKey, content);
        }

        // Save to history (selectedUnitData already defined above)
        if (selectedUnitData) {
          const historyId = saveAssessmentToHistory(
            selectedUnit,
            selectedUnitData.unit_code,
            selectedUnitData.unit_title,
            selectedAssessmentType,
            selectedQuestionType,
            content,
            customSuggestion
          );
          
          // Refresh history
          const updatedHistory = getFilteredAssessmentHistory(selectedUnit, selectedAssessmentType);
          setAssessmentHistory(updatedHistory);
        }
        
        toast.success('Assessment generated successfully!');
      }
    } catch (error: any) {
      console.error('Assessment generation error:', error);
      let errorMessage = 'Failed to generate assessment';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Unit or assessment type not found.';
      }
      
      toast.error(errorMessage);
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
        data.question_type = selectedQuestionType;
      }

      await saveMutation.mutateAsync(data);
      toast.success('Assessment saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save assessment');
    }
  };

  // Note: isQuestioning is already defined above for fetching logic

  // Helper functions for history
  const handleSelectHistoryItem = (item: AssessmentHistoryItem) => {
    const formattedContent = formatAssessmentContent(item.parsedContent);
    setGeneratedContent(formattedContent);
    setSelectedHistoryItem(item.id);
    setShowHistory(false);
    toast.success('Assessment loaded from history');
  };

  const handleDeleteHistoryItem = (id: string) => {
    // Implementation would go here if needed
    const updatedHistory = getFilteredAssessmentHistory(selectedUnit, selectedAssessmentType);
    setAssessmentHistory(updatedHistory);
  };

  // Parse and format content for display
  const getDisplayContent = () => {
    if (!generatedContent) return '';
    
    try {
      const parsed = parseAssessmentContent(generatedContent);
      return formatAssessmentContent(parsed);
    } catch {
      return generatedContent;
    }
  };

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
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  <p className="text-sm text-gray-600">
                    <strong>Note:</strong> Questioning assessments automatically include all components (PC, PE, KE) and generate 5 questions of the selected type.
                  </p>
                </div>
              )}

              {/* Component Selection for Non-Questioning SCEI Assessments */}
              {!isQuestioning && selectedAssessmentType && user?.domain === 'scei' && (
                <div className="space-y-3">
                  <Label>Include Components</Label>
                  <p className="text-sm text-gray-600">Select which components to include in the assessment generation:</p>
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
                <Label>Custom Instructions (Optional)</Label>
                <Textarea
                  placeholder="Add any specific requirements or focus areas for the assessment (e.g., 'Focus on workplace safety scenarios', 'Include case study components')..."
                  value={customSuggestion}
                  onChange={(e) => setCustomSuggestion(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  These instructions will be added to the generation prompt to customize the assessment content.
                </p>
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

          {/* Assessment History */}
          {assessmentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <History className="h-5 w-5" />
                    <span>Assessment History ({assessmentHistory.length})</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? 'Hide History' : 'Show History'}
                  </Button>
                </div>
              </CardHeader>
              {showHistory && (
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {assessmentHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedHistoryItem === item.id ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => handleSelectHistoryItem(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.unitCode}
                              </span>
                              {item.questionType && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.questionType.replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate mb-1">
                              {item.unitTitle}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimestamp(item.timestamp)}
                            </div>
                          </div>
                        </div>
                        {item.customSuggestion && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded p-2">
                            <strong>Custom:</strong> {item.customSuggestion}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Assessment</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="w-full sm:w-auto"
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
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <MarkdownRenderer 
                    content={getDisplayContent()} 
                    className="text-gray-800 dark:text-gray-200"
                  />
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

const AssessmentsPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AssessmentsPage />
    </Suspense>
  );
};

export default AssessmentsPageWithSuspense;