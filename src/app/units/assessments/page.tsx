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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useUnits, useGenerateAssessment, useSaveAssessment, useAssessmentTypes, useAssessment } from '@/hooks/use-api';
import { useUIStore } from '@/store/ui-store';
import { generateSessionKey } from '@/lib/utils';
import { ASSESSMENT_TYPES, QUESTION_TYPES } from '@/constants';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { FileText, Download, Save, RefreshCw, Settings, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CheckedState } from '@radix-ui/react-checkbox';

const AssessmentsPage = () => {
  const searchParams = useSearchParams();
  const { sessionData, setSessionData, getSessionData } = useUIStore();
  
  const [selectedUnit, setSelectedUnit] = useState(searchParams?.get('unit') || '');
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [customSuggestion, setCustomSuggestion] = useState('');
  const [unitSearchOpen, setUnitSearchOpen] = useState(false);
  
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
  const criteriaId = selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING && selectedQuestionType ? 0 : undefined;

  const { data: savedAssessment, isLoading: loadingSavedAssessment } = useAssessment(
    selectedUnit, 
    selectedAssessmentType, 
    elementId, 
    criteriaId
  );

  // Session key for storing generated content
  const sessionKey = selectedUnit && selectedAssessmentType 
    ? generateSessionKey(selectedUnit, selectedAssessmentType, selectedQuestionType) 
    : '';

  // Load content when selection changes
  useEffect(() => {
    if (sessionKey) {
      // First check session storage
      const sessionContent = getSessionData(sessionKey);
      
      if (sessionContent) {
        setGeneratedContent(sessionContent);
      } else if (savedAssessment?.generated_text) {
        // If no session content, load from database
        setGeneratedContent(savedAssessment.generated_text);
        // Also save to session for this session
        setSessionData(sessionKey, savedAssessment.generated_text);
      } else {
        // Clear content if nothing found
        setGeneratedContent('');
      }
    }
  }, [sessionKey, savedAssessment, getSessionData, setSessionData]);

  // Checkbox handlers that convert CheckedState to boolean
  const handlePCChange = (checked: CheckedState) => {
    setIncludePC(checked === true);
  };

  const handlePEChange = (checked: CheckedState) => {
    setIncludePE(checked === true);
  };

  const handleKEChange = (checked: CheckedState) => {
    setIncludeKE(checked === true);
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnit(unitId);
    setUnitSearchOpen(false);
    // Clear other selections when unit changes
    setSelectedAssessmentType('');
    setSelectedQuestionType('');
    setGeneratedContent('');
  };

  const handleAssessmentTypeChange = (typeId: string) => {
    setSelectedAssessmentType(typeId);
    // Clear question type when assessment type changes
    setSelectedQuestionType('');
    setGeneratedContent('');
  };

  const handleGenerate = async () => {
    if (!selectedUnit || !selectedAssessmentType) {
      toast.error('Please select a unit and assessment type');
      return;
    }

    try {
      const data: any = {
        unit_id: selectedUnit,
        type: selectedAssessmentType,
        include_pc: includePC,
        include_pe: includePE,
        include_ke: includeKE,
      };

      if (selectedAssessmentType === ASSESSMENT_TYPES.QUESTIONING && selectedQuestionType) {
        data.question_type = selectedQuestionType;
      }

      if (customSuggestion.trim()) {
        data.suggestion = customSuggestion;
      }

      const result = await generateMutation.mutateAsync(data);
      
      if (result.status && result.data?.text) {
        let content = result.data.text;
        
        // Parse JSON if it's a JSON response
        try {
          const parsed = JSON.parse(content);
          if (parsed.output) {
            content = typeof parsed.output === 'string' ? parsed.output : JSON.stringify(parsed.output, null, 2);
          }
        } catch {
          // Content is already a string
        }

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
  const selectedUnitData = unitsData?.rows?.find(unit => unit.id === selectedUnit);

  return (
    <AuthGuard>
      <MainLayout title="Generate Assessments" subtitle="Create and manage unit assessments">
        <div className="space-y-6">
          {/* Unit Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Assessment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Searchable Unit Dropdown */}
                <div className="space-y-2">
                  <Label>Select Unit</Label>
                  <Popover open={unitSearchOpen} onOpenChange={setUnitSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={unitSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedUnitData
                          ? `${selectedUnitData.unit_code} - ${selectedUnitData.unit_title}`
                          : "Select unit..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search units..." />
                        <CommandEmpty>No units found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {unitsData?.rows?.map((unit) => (
                            <CommandItem
                              key={unit.id}
                              value={`${unit.unit_code} ${unit.unit_title}`}
                              onSelect={() => handleUnitSelect(unit.id)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUnit === unit.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{unit.unit_code}</span>
                                <span className="text-sm text-gray-500 truncate">{unit.unit_title}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

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
                      <SelectValue placeholder="Choose question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QUESTION_TYPES.DIRECT_KNOWLEDGE}>Direct Knowledge Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.PROCEDURAL}>Procedural Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.SCENARIO_BASED}>Scenario-Based Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.REFLECTION_BASED}>Reflection-Based Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.SITUATIONAL_JUDGEMENT}>Situational Judgement Questions</SelectItem>
                      <SelectItem value={QUESTION_TYPES.COMPARISON_ANALYSIS}>Comparison/Analysis Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Component Selection */}
              {!isQuestioning && (
                <div className="space-y-3">
                  <Label>Include Components:</Label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pc" 
                        checked={includePC} 
                        onCheckedChange={handlePCChange}
                      />
                      <Label htmlFor="pc" className="text-sm">Performance Criteria (PC)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pe" 
                        checked={includePE} 
                        onCheckedChange={handlePEChange}
                      />
                      <Label htmlFor="pe" className="text-sm">Performance Evidence (PE)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="ke" 
                        checked={includeKE} 
                        onCheckedChange={handleKEChange}
                      />
                      <Label htmlFor="ke" className="text-sm">Knowledge Evidence (KE)</Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Suggestions */}
              <div className="space-y-2">
                <Label>Custom Instructions (Optional)</Label>
                <Textarea
                  value={customSuggestion}
                  onChange={(e) => setCustomSuggestion(e.target.value)}
                  placeholder="Add any specific requirements or suggestions for the assessment..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending || !selectedUnit || !selectedAssessmentType}
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
                      Generate Assessment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Indicator */}
          {shouldFetchAssessment && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {loadingSavedAssessment ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="text-sm text-gray-600">Loading saved assessment...</span>
                      </>
                    ) : savedAssessment ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700">Assessment found in database</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-sm text-gray-600">No saved assessment found</span>
                      </>
                    )}
                  </div>
                  
                  {sessionKey && getSessionData(sessionKey) && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-blue-700">Session content available</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Assessment</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save to Database
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setGeneratedContent(newContent);
                      // Update session storage when content is edited
                      if (sessionKey) {
                        setSessionData(sessionKey, newContent);
                      }
                    }}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  
                  <div className="text-sm text-gray-600">
                    Content is automatically saved to your session and can be manually saved to the database.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!generatedContent && (
            <EmptyState
              icon={<FileText className="h-6 w-6 text-gray-400" />}
              title="No Assessment Generated"
              description="Select a unit and assessment type, then click generate to create your first assessment."
            />
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default AssessmentsPage;