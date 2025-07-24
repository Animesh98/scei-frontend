'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/store/auth-store';
import { Unit } from '@/types';
import { SceiUnitPayload } from '@/hooks/use-api';
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Save, 
  RefreshCw,
  BookOpen,
  Target,
  Award,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ApiElement {
  element: string;
  criteria: string[];
}

interface ApiEvidence {
  element: string;
  subTopics: string[];
}

interface ApiKnowledge {
  element: string;
  subTopics: string[];
}

interface StepByStepUnitFormProps {
  unit?: Unit;
  isEditing?: boolean;
  onSubmit: (data: SceiUnitPayload) => Promise<void>;
  isSubmitting?: boolean;
}

const StepByStepUnitForm: React.FC<StepByStepUnitFormProps> = ({
  unit,
  isEditing = false,
  onSubmit,
  isSubmitting = false
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Current step state
  const [currentStep, setCurrentStep] = useState('basic');
  
  // Basic unit information
  const [basicData, setBasicData] = useState({
    unit_code: unit?.unit_code || '',
    name: unit?.unit_title || '', // Note: API expects 'name' not 'unit_title'
    competency: unit?.competency || ''
  });

  // API format data structures
  const [elements, setElements] = useState<ApiElement[]>(() => {
    if (unit?.unit_elements) {
      return unit.unit_elements.map(el => ({
        element: el.element,
        criteria: el.criterias || []
      }));
    }
    return [{ element: '', criteria: [''] }];
  });

  const [evidences, setEvidences] = useState<ApiEvidence[]>(() => {
    if (unit?.unit_performance_evidences) {
      return unit.unit_performance_evidences.map(pe => ({
        element: pe.evidence,
        subTopics: pe.subtopics || []
      }));
    }
    return [{ element: '', subTopics: [''] }];
  });

  const [knowledge, setKnowledge] = useState<ApiKnowledge[]>(() => {
    if (unit?.unit_knowledges) {
      return unit.unit_knowledges.map(ke => ({
        element: ke.topic,
        subTopics: ke.subtopics || []
      }));
    }
    return [{ element: '', subTopics: [''] }];
  });

  // Assessor Guide (optional)
  const [assessorGuideFile, setAssessorGuideFile] = useState<File | null>(null);

  // Reset form when unit prop changes (fixes caching issue)
  useEffect(() => {
    if (unit) {
      // Reset basic data
      setBasicData({
        unit_code: unit.unit_code || '',
        name: unit.unit_title || '',
        competency: unit.competency || ''
      });

      // Reset elements
      if (unit.unit_elements && unit.unit_elements.length > 0) {
        setElements(unit.unit_elements.map(el => ({
          element: el.element,
          criteria: el.criterias || []
        })));
      } else {
        setElements([{ element: '', criteria: [''] }]);
      }

      // Reset evidences
      if (unit.unit_performance_evidences && unit.unit_performance_evidences.length > 0) {
        setEvidences(unit.unit_performance_evidences.map(pe => ({
          element: pe.evidence,
          subTopics: pe.subtopics || []
        })));
      } else {
        setEvidences([{ element: '', subTopics: [''] }]);
      }

      // Reset knowledge
      if (unit.unit_knowledges && unit.unit_knowledges.length > 0) {
        setKnowledge(unit.unit_knowledges.map(ke => ({
          element: ke.topic,
          subTopics: ke.subtopics || []
        })));
      } else {
        setKnowledge([{ element: '', subTopics: [''] }]);
      }
    } else {
      // Reset to initial state when no unit
      setBasicData({
        unit_code: '',
        name: '',
        competency: ''
      });
      setElements([{ element: '', criteria: [''] }]);
      setEvidences([{ element: '', subTopics: [''] }]);
      setKnowledge([{ element: '', subTopics: [''] }]);
    }
  }, [unit]); // This effect runs whenever the unit prop changes

  // Step validation functions (updated to make sub-items optional)
  const isBasicStepValid = () => {
    return basicData.unit_code.trim() !== '' && 
           basicData.name.trim() !== '' && 
           basicData.competency.trim() !== '';
  };

  const isElementsStepValid = () => {
    return elements.length > 0 && 
           elements.some(el => el.element.trim() !== '');
  };

  const isEvidenceStepValid = () => {
    return evidences.length > 0 && 
           evidences.some(ev => ev.element.trim() !== '');
  };

  const isKnowledgeStepValid = () => {
    return knowledge.length > 0 && 
           knowledge.some(kn => kn.element.trim() !== '');
  };

  // Get completion status for each step
  const getStepStatus = (step: string) => {
    switch (step) {
      case 'basic': return isBasicStepValid();
      case 'elements': return isElementsStepValid();
      case 'evidence': return isEvidenceStepValid();
      case 'knowledge': return isKnowledgeStepValid();
      case 'assessor': return true; // Optional step
      default: return false;
    }
  };

  // Check if step is accessible
  const isStepAccessible = (step: string) => {
    const steps = ['basic', 'elements', 'evidence', 'knowledge', 'assessor'];
    const stepIndex = steps.indexOf(step);
    const currentStepIndex = steps.indexOf(currentStep);
    
    // Can access current step or previous completed steps
    if (stepIndex <= currentStepIndex) return true;
    
    // Can access next step only if current step is valid
    if (stepIndex === currentStepIndex + 1) {
      return getStepStatus(steps[currentStepIndex]);
    }
    
    return false;
  };

  // Calculate progress
  const getProgress = () => {
    const completedSteps = ['basic', 'elements', 'evidence', 'knowledge'].filter(getStepStatus).length;
    return (completedSteps / 4) * 100;
  };

  // Element management functions
  const addElement = () => {
    setElements([...elements, { element: '', criteria: [''] }]);
  };

  const removeElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const updateElement = (index: number, field: keyof ApiElement, value: any) => {
    const updated = [...elements];
    updated[index] = { ...updated[index], [field]: value };
    setElements(updated);
  };

  const addCriteria = (elementIndex: number) => {
    const updated = [...elements];
    updated[elementIndex].criteria.push('');
    setElements(updated);
  };

  const removeCriteria = (elementIndex: number, criteriaIndex: number) => {
    const updated = [...elements];
    updated[elementIndex].criteria = updated[elementIndex].criteria.filter((_, i) => i !== criteriaIndex);
    setElements(updated);
  };

  const updateCriteria = (elementIndex: number, criteriaIndex: number, value: string) => {
    const updated = [...elements];
    updated[elementIndex].criteria[criteriaIndex] = value;
    setElements(updated);
  };

  // Evidence management functions
  const addEvidence = () => {
    setEvidences([...evidences, { element: '', subTopics: [''] }]);
  };

  const removeEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index));
  };

  const updateEvidence = (index: number, field: keyof ApiEvidence, value: any) => {
    const updated = [...evidences];
    updated[index] = { ...updated[index], [field]: value };
    setEvidences(updated);
  };

  const addEvidenceSubTopic = (evidenceIndex: number) => {
    const updated = [...evidences];
    updated[evidenceIndex].subTopics.push('');
    setEvidences(updated);
  };

  const removeEvidenceSubTopic = (evidenceIndex: number, subTopicIndex: number) => {
    const updated = [...evidences];
    updated[evidenceIndex].subTopics = updated[evidenceIndex].subTopics.filter((_, i) => i !== subTopicIndex);
    setEvidences(updated);
  };

  const updateEvidenceSubTopic = (evidenceIndex: number, subTopicIndex: number, value: string) => {
    const updated = [...evidences];
    updated[evidenceIndex].subTopics[subTopicIndex] = value;
    setEvidences(updated);
  };

  // Knowledge management functions
  const addKnowledge = () => {
    setKnowledge([...knowledge, { element: '', subTopics: [''] }]);
  };

  const removeKnowledge = (index: number) => {
    setKnowledge(knowledge.filter((_, i) => i !== index));
  };

  const updateKnowledge = (index: number, field: keyof ApiKnowledge, value: any) => {
    const updated = [...knowledge];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledge(updated);
  };

  const addKnowledgeSubTopic = (knowledgeIndex: number) => {
    const updated = [...knowledge];
    updated[knowledgeIndex].subTopics.push('');
    setKnowledge(updated);
  };

  const removeKnowledgeSubTopic = (knowledgeIndex: number, subTopicIndex: number) => {
    const updated = [...knowledge];
    updated[knowledgeIndex].subTopics = updated[knowledgeIndex].subTopics.filter((_, i) => i !== subTopicIndex);
    setKnowledge(updated);
  };

  const updateKnowledgeSubTopic = (knowledgeIndex: number, subTopicIndex: number, value: string) => {
    const updated = [...knowledge];
    updated[knowledgeIndex].subTopics[subTopicIndex] = value;
    setKnowledge(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssessorGuideFile(file);
    }
  };

  const handleNext = () => {
    const steps = ['basic', 'elements', 'evidence', 'knowledge', 'assessor'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1 && getStepStatus(currentStep)) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const steps = ['basic', 'elements', 'evidence', 'knowledge', 'assessor'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const canSubmit = () => {
    return isBasicStepValid() && isElementsStepValid() && isEvidenceStepValid() && isKnowledgeStepValid();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      toast.error('Please complete all required steps before submitting');
      return;
    }

    // Clean up empty values and create API payload
    const cleanElements = elements.filter(el => el.element.trim()).map(el => ({
      element: el.element,
      criteria: el.criteria.filter(c => c.trim())
    }));

    const cleanEvidences = evidences.filter(ev => ev.element.trim()).map(ev => ({
      element: ev.element,
      subTopics: ev.subTopics.filter(st => st.trim())
    }));

    const cleanKnowledge = knowledge.filter(kn => kn.element.trim()).map(kn => ({
      element: kn.element,
      subTopics: kn.subTopics.filter(st => st.trim())
    }));

    const apiPayload: SceiUnitPayload = {
      unit_code: basicData.unit_code,
      name: basicData.name,
      competency: basicData.competency,
      elements: cleanElements,
      evidences: cleanEvidences,
      knowledge: cleanKnowledge
    };

    try {
      await onSubmit(apiPayload);
      
      // TODO: Handle assessor guide upload if file is selected
      if (assessorGuideFile && unit?.id) {
        console.log('Assessor guide file selected:', assessorGuideFile.name);
        toast.info('Note: Assessor guide upload will be implemented soon');
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const currentStepIndex = ['basic', 'elements', 'evidence', 'knowledge', 'assessor'].indexOf(currentStep);

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStepIndex + 1} of 5</span>
              <span>{Math.round(getProgress())}% Complete</span>
            </div>
            <Progress value={getProgress()} className="w-full" />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger 
              value="basic" 
              disabled={!isStepAccessible('basic')}
              className={cn(
                getStepStatus('basic') && "text-green-600",
                !isStepAccessible('basic') && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center space-x-1">
                {getStepStatus('basic') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>Basic Info</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="elements" 
              disabled={!isStepAccessible('elements')}
              className={cn(
                getStepStatus('elements') && "text-green-600",
                !isStepAccessible('elements') && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center space-x-1">
                {getStepStatus('elements') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>Elements</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="evidence" 
              disabled={!isStepAccessible('evidence')}
              className={cn(
                getStepStatus('evidence') && "text-green-600",
                !isStepAccessible('evidence') && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center space-x-1">
                {getStepStatus('evidence') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>Evidence</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              disabled={!isStepAccessible('knowledge')}
              className={cn(
                getStepStatus('knowledge') && "text-green-600",
                !isStepAccessible('knowledge') && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center space-x-1">
                {getStepStatus('knowledge') ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>Knowledge</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="assessor" 
              disabled={!isStepAccessible('assessor')}
              className="text-gray-600"
            >
              <div className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span>Assessor Guide</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_code">Unit Code *</Label>
                  <Input
                    id="unit_code"
                    value={basicData.unit_code}
                    onChange={(e) => setBasicData(prev => ({ ...prev, unit_code: e.target.value }))}
                    placeholder="e.g., CHCCS001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Unit Title *</Label>
                  <Input
                    id="name"
                    value={basicData.name}
                    onChange={(e) => setBasicData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter the unit title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="competency">Competency *</Label>
                  <Textarea
                    id="competency"
                    value={basicData.competency}
                    onChange={(e) => setBasicData(prev => ({ ...prev, competency: e.target.value }))}
                    placeholder="Describe the competency for this unit"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={!isBasicStepValid()}
                  >
                    Next: Elements
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Unit Elements & Performance Criteria</span>
                  </CardTitle>
                  <Button type="button" onClick={addElement} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Element
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {elements.map((element, elementIndex) => (
                  <div key={elementIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Label>Element {elementIndex + 1}</Label>
                        <Textarea
                          value={element.element}
                          onChange={(e) => updateElement(elementIndex, 'element', e.target.value)}
                          placeholder="Enter element description"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElement(elementIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Performance Criteria</Label>
                        <Button
                          type="button"
                          onClick={() => addCriteria(elementIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Criteria
                        </Button>
                      </div>
                      {element.criteria.map((criteria, criteriaIndex) => (
                        <div key={criteriaIndex} className="flex items-start space-x-2">
                          <Textarea
                            value={criteria}
                            onChange={(e) => updateCriteria(elementIndex, criteriaIndex, e.target.value)}
                            placeholder={`PC ${elementIndex + 1}.${criteriaIndex + 1}: Enter performance criteria`}
                            rows={2}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriteria(elementIndex, criteriaIndex)}
                            className="text-red-500 hover:text-red-700 mt-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={!isElementsStepValid()}
                  >
                    Next: Performance Evidence
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Evidence Tab */}
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Performance Evidence</span>
                  </CardTitle>
                  <Button type="button" onClick={addEvidence} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {evidences.map((evidence, evidenceIndex) => (
                  <div key={evidenceIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Label>Performance Evidence {evidenceIndex + 1}</Label>
                        <Textarea
                          value={evidence.element}
                          onChange={(e) => updateEvidence(evidenceIndex, 'element', e.target.value)}
                          placeholder="Enter performance evidence description"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvidence(evidenceIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sub Topics</Label>
                        <Button
                          type="button"
                          onClick={() => addEvidenceSubTopic(evidenceIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Sub Topic
                        </Button>
                      </div>
                      {evidence.subTopics.map((subTopic, subTopicIndex) => (
                        <div key={subTopicIndex} className="flex items-center space-x-2">
                          <Input
                            value={subTopic}
                            onChange={(e) => updateEvidenceSubTopic(evidenceIndex, subTopicIndex, e.target.value)}
                            placeholder={`PE ${evidenceIndex + 1}.${subTopicIndex + 1}: Enter sub topic`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEvidenceSubTopic(evidenceIndex, subTopicIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={!isEvidenceStepValid()}
                  >
                    Next: Knowledge Evidence
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Evidence Tab */}
          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Knowledge Evidence</span>
                  </CardTitle>
                  <Button type="button" onClick={addKnowledge} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Knowledge
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {knowledge.map((knowledgeItem, knowledgeIndex) => (
                  <div key={knowledgeIndex} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <Label>Knowledge Evidence {knowledgeIndex + 1}</Label>
                        <Textarea
                          value={knowledgeItem.element}
                          onChange={(e) => updateKnowledge(knowledgeIndex, 'element', e.target.value)}
                          placeholder="Enter knowledge evidence topic"
                          rows={2}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKnowledge(knowledgeIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sub Topics</Label>
                        <Button
                          type="button"
                          onClick={() => addKnowledgeSubTopic(knowledgeIndex)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Sub Topic
                        </Button>
                      </div>
                      {knowledgeItem.subTopics.map((subTopic, subTopicIndex) => (
                        <div key={subTopicIndex} className="flex items-center space-x-2">
                          <Input
                            value={subTopic}
                            onChange={(e) => updateKnowledgeSubTopic(knowledgeIndex, subTopicIndex, e.target.value)}
                            placeholder={`KE ${knowledgeIndex + 1}.${subTopicIndex + 1}: Enter sub topic`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKnowledgeSubTopic(knowledgeIndex, subTopicIndex)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleNext}
                    disabled={!isKnowledgeStepValid()}
                  >
                    Next: Assessor Guide (Optional)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessor Guide Tab */}
          <TabsContent value="assessor">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Assessor Guide (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <Label htmlFor="assessor-guide" className="cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">
                      Upload Assessor Guide
                    </span>
                    <Input
                      id="assessor-guide"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, or TXT files only
                  </p>
                </div>
                
                {assessorGuideFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Selected: {assessorGuideFile.name}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Assessor guide upload functionality will be available after the unit is created.
                  </p>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                  <div className="text-sm text-gray-600">
                    This step is optional. You can submit the unit now.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit()}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? 'Update Unit' : 'Create Unit'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StepByStepUnitForm;