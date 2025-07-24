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
import { useAuthStore } from '@/store/auth-store';
import { Unit, UnitElement, PerformanceEvidence, KnowledgeEvidence, Content, Benchmark } from '@/types';
import { 
  Plus, 
  Trash2, 
  Upload, 
  FileText, 
  Save, 
  RefreshCw,
  BookOpen,
  Users,
  Target,
  Award,
  GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface ComprehensiveUnitFormProps {
  unit?: Unit;
  isEditing?: boolean;
  onSubmit: (data: Partial<Unit>) => Promise<void>;
  isSubmitting?: boolean;
}

const ComprehensiveUnitForm: React.FC<ComprehensiveUnitFormProps> = ({
  unit,
  isEditing = false,
  onSubmit,
  isSubmitting = false
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Basic unit information
  const [basicData, setBasicData] = useState({
    unit_code: unit?.unit_code || '',
    unit_title: unit?.unit_title || '',
    competency: unit?.competency || '',
    unit_outline: unit?.unit_outline || '',
    domain: unit?.domain || user?.domain || 'scei'
  });

  // Unit Elements (Performance Criteria)
  const [unitElements, setUnitElements] = useState<UnitElement[]>(
    unit?.unit_elements || [{ element: '', criterias: [''] }]
  );

  // Performance Evidence
  const [performanceEvidences, setPerformanceEvidences] = useState<PerformanceEvidence[]>(
    unit?.unit_performance_evidences || [{ evidence: '', subtopics: [''] }]
  );

  // Knowledge Evidence
  const [knowledgeEvidences, setKnowledgeEvidences] = useState<KnowledgeEvidence[]>(
    unit?.unit_knowledges || [{ topic: '', subtopics: [''] }]
  );

  // Learning Outcomes (for SCEI-HE)
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(
    unit?.learning_outcome || ['']
  );

  // Graduate Attributes (for SCEI-HE)
  const [attributes, setAttributes] = useState<string[]>(
    unit?.attributes || ['']
  );

  // ACECQA Content (for SCEI-HE)
  const [contents, setContents] = useState<Content[]>(
    unit?.contents || [{ content: '', criteria: [''] }]
  );

  // Industry Standards
  const [standards, setStandards] = useState<string[]>(
    unit?.standards || ['']
  );

  // Benchmarks
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(
    unit?.benchmarks || [{ uni_name: '', course_outline: '', units: [''] }]
  );

  // Assessor Guide
  const [assessorGuideFile, setAssessorGuideFile] = useState<File | null>(null);
  const [assessorGuideStatus, setAssessorGuideStatus] = useState<any>(null);

  // Add functions for managing dynamic arrays
  const addUnitElement = () => {
    setUnitElements([...unitElements, { element: '', criterias: [''] }]);
  };

  const removeUnitElement = (index: number) => {
    setUnitElements(unitElements.filter((_, i) => i !== index));
  };

  const updateUnitElement = (index: number, field: keyof UnitElement, value: any) => {
    const updated = [...unitElements];
    updated[index] = { ...updated[index], [field]: value };
    setUnitElements(updated);
  };

  const addCriteria = (elementIndex: number) => {
    const updated = [...unitElements];
    updated[elementIndex].criterias.push('');
    setUnitElements(updated);
  };

  const removeCriteria = (elementIndex: number, criteriaIndex: number) => {
    const updated = [...unitElements];
    updated[elementIndex].criterias = updated[elementIndex].criterias.filter((_, i) => i !== criteriaIndex);
    setUnitElements(updated);
  };

  const updateCriteria = (elementIndex: number, criteriaIndex: number, value: string) => {
    const updated = [...unitElements];
    updated[elementIndex].criterias[criteriaIndex] = value;
    setUnitElements(updated);
  };

  // Similar functions for Performance Evidence
  const addPerformanceEvidence = () => {
    setPerformanceEvidences([...performanceEvidences, { evidence: '', subtopics: [''] }]);
  };

  const removePerformanceEvidence = (index: number) => {
    setPerformanceEvidences(performanceEvidences.filter((_, i) => i !== index));
  };

  const updatePerformanceEvidence = (index: number, field: keyof PerformanceEvidence, value: any) => {
    const updated = [...performanceEvidences];
    updated[index] = { ...updated[index], [field]: value };
    setPerformanceEvidences(updated);
  };

  const addPerformanceSubtopic = (evidenceIndex: number) => {
    const updated = [...performanceEvidences];
    updated[evidenceIndex].subtopics.push('');
    setPerformanceEvidences(updated);
  };

  const removePerformanceSubtopic = (evidenceIndex: number, subtopicIndex: number) => {
    const updated = [...performanceEvidences];
    updated[evidenceIndex].subtopics = updated[evidenceIndex].subtopics.filter((_, i) => i !== subtopicIndex);
    setPerformanceEvidences(updated);
  };

  const updatePerformanceSubtopic = (evidenceIndex: number, subtopicIndex: number, value: string) => {
    const updated = [...performanceEvidences];
    updated[evidenceIndex].subtopics[subtopicIndex] = value;
    setPerformanceEvidences(updated);
  };

  // Similar functions for Knowledge Evidence
  const addKnowledgeEvidence = () => {
    setKnowledgeEvidences([...knowledgeEvidences, { topic: '', subtopics: [''] }]);
  };

  const removeKnowledgeEvidence = (index: number) => {
    setKnowledgeEvidences(knowledgeEvidences.filter((_, i) => i !== index));
  };

  const updateKnowledgeEvidence = (index: number, field: keyof KnowledgeEvidence, value: any) => {
    const updated = [...knowledgeEvidences];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledgeEvidences(updated);
  };

  const addKnowledgeSubtopic = (evidenceIndex: number) => {
    const updated = [...knowledgeEvidences];
    updated[evidenceIndex].subtopics.push('');
    setKnowledgeEvidences(updated);
  };

  const removeKnowledgeSubtopic = (evidenceIndex: number, subtopicIndex: number) => {
    const updated = [...knowledgeEvidences];
    updated[evidenceIndex].subtopics = updated[evidenceIndex].subtopics.filter((_, i) => i !== subtopicIndex);
    setKnowledgeEvidences(updated);
  };

  const updateKnowledgeSubtopic = (evidenceIndex: number, subtopicIndex: number, value: string) => {
    const updated = [...knowledgeEvidences];
    updated[evidenceIndex].subtopics[subtopicIndex] = value;
    setKnowledgeEvidences(updated);
  };

  // Functions for simple arrays
  const addToArray = (array: string[], setArray: (arr: string[]) => void) => {
    setArray([...array, '']);
  };

  const removeFromArray = (array: string[], setArray: (arr: string[]) => void, index: number) => {
    setArray(array.filter((_, i) => i !== index));
  };

  const updateInArray = (array: string[], setArray: (arr: string[]) => void, index: number, value: string) => {
    const updated = [...array];
    updated[index] = value;
    setArray(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAssessorGuideFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!basicData.unit_code || !basicData.unit_title) {
      toast.error('Please fill in unit code and title');
      return;
    }

    // Clean up empty values
    const cleanUnitElements = unitElements.filter(el => el.element.trim()).map(el => ({
      ...el,
      criterias: el.criterias.filter(c => c.trim())
    }));

    const cleanPerformanceEvidences = performanceEvidences.filter(pe => pe.evidence.trim()).map(pe => ({
      ...pe,
      subtopics: pe.subtopics.filter(s => s.trim())
    }));

    const cleanKnowledgeEvidences = knowledgeEvidences.filter(ke => ke.topic.trim()).map(ke => ({
      ...ke,
      subtopics: ke.subtopics.filter(s => s.trim())
    }));

    const cleanLearningOutcomes = learningOutcomes.filter(lo => lo.trim());
    const cleanAttributes = attributes.filter(attr => attr.trim());
    const cleanStandards = standards.filter(std => std.trim());

    const cleanContents = contents.filter(c => c.content.trim()).map(c => ({
      ...c,
      criteria: c.criteria.filter(cr => cr.trim())
    }));

    const cleanBenchmarks = benchmarks.filter(b => b.uni_name.trim() || b.course_outline.trim()).map(b => ({
      ...b,
      units: b.units.filter(u => u.trim())
    }));

    const unitData: Partial<Unit> = {
      ...basicData,
      unit_elements: cleanUnitElements,
      unit_performance_evidences: cleanPerformanceEvidences,
      unit_knowledges: cleanKnowledgeEvidences,
      learning_outcome: cleanLearningOutcomes,
      attributes: cleanAttributes,
      contents: cleanContents,
      standards: cleanStandards,
      benchmarks: cleanBenchmarks
    };

    try {
      await onSubmit(unitData);
      
      // TODO: Handle assessor guide upload if file is selected
      if (assessorGuideFile && unit?.id) {
        // This would require a separate API call for file upload
        console.log('Assessor guide file selected:', assessorGuideFile.name);
        toast.info('Note: Assessor guide upload will be implemented soon');
      }
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const isHE = basicData.domain === 'scei-he';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="performance">Performance Evidence</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Evidence</TabsTrigger>
          {isHE && <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>}
          <TabsTrigger value="assessor">Assessor Guide</TabsTrigger>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="domain">Domain</Label>
                  <Select
                    value={basicData.domain}
                    onValueChange={(value) => setBasicData(prev => ({ ...prev, domain: value as "scei" | "scei-he" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scei">SCEI</SelectItem>
                      <SelectItem value="scei-he">SCEI Higher Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_title">Unit Title *</Label>
                <Input
                  id="unit_title"
                  value={basicData.unit_title}
                  onChange={(e) => setBasicData(prev => ({ ...prev, unit_title: e.target.value }))}
                  placeholder="Enter the unit title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competency">Competency</Label>
                <Textarea
                  id="competency"
                  value={basicData.competency}
                  onChange={(e) => setBasicData(prev => ({ ...prev, competency: e.target.value }))}
                  placeholder="Describe the competency for this unit"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_outline">Unit Outline</Label>
                <Textarea
                  id="unit_outline"
                  value={basicData.unit_outline}
                  onChange={(e) => setBasicData(prev => ({ ...prev, unit_outline: e.target.value }))}
                  placeholder="Provide a detailed outline of the unit"
                  rows={6}
                />
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
                <Button type="button" onClick={addUnitElement} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Element
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {unitElements.map((element, elementIndex) => (
                <div key={elementIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Label>Element {elementIndex + 1}</Label>
                      <Input
                        value={element.element}
                        onChange={(e) => updateUnitElement(elementIndex, 'element', e.target.value)}
                        placeholder="Enter element description"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnitElement(elementIndex)}
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
                    {element.criterias.map((criteria, criteriaIndex) => (
                      <div key={criteriaIndex} className="flex items-center space-x-2">
                        <Input
                          value={criteria}
                          onChange={(e) => updateCriteria(elementIndex, criteriaIndex, e.target.value)}
                          placeholder={`Criteria ${criteriaIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCriteria(elementIndex, criteriaIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Evidence Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5" />
                  <span>Performance Evidence</span>
                </CardTitle>
                <Button type="button" onClick={addPerformanceEvidence} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evidence
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {performanceEvidences.map((evidence, evidenceIndex) => (
                <div key={evidenceIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Label>Evidence {evidenceIndex + 1}</Label>
                      <Textarea
                        value={evidence.evidence}
                        onChange={(e) => updatePerformanceEvidence(evidenceIndex, 'evidence', e.target.value)}
                        placeholder="Enter performance evidence description"
                        rows={2}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePerformanceEvidence(evidenceIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Subtopics</Label>
                      <Button
                        type="button"
                        onClick={() => addPerformanceSubtopic(evidenceIndex)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Subtopic
                      </Button>
                    </div>
                    {evidence.subtopics.map((subtopic, subtopicIndex) => (
                      <div key={subtopicIndex} className="flex items-center space-x-2">
                        <Input
                          value={subtopic}
                          onChange={(e) => updatePerformanceSubtopic(evidenceIndex, subtopicIndex, e.target.value)}
                          placeholder={`Subtopic ${subtopicIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePerformanceSubtopic(evidenceIndex, subtopicIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                <Button type="button" onClick={addKnowledgeEvidence} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {knowledgeEvidences.map((knowledge, knowledgeIndex) => (
                <div key={knowledgeIndex} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Label>Topic {knowledgeIndex + 1}</Label>
                      <Input
                        value={knowledge.topic}
                        onChange={(e) => updateKnowledgeEvidence(knowledgeIndex, 'topic', e.target.value)}
                        placeholder="Enter knowledge topic"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKnowledgeEvidence(knowledgeIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Subtopics</Label>
                      <Button
                        type="button"
                        onClick={() => addKnowledgeSubtopic(knowledgeIndex)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Subtopic
                      </Button>
                    </div>
                    {knowledge.subtopics.map((subtopic, subtopicIndex) => (
                      <div key={subtopicIndex} className="flex items-center space-x-2">
                        <Input
                          value={subtopic}
                          onChange={(e) => updateKnowledgeSubtopic(knowledgeIndex, subtopicIndex, e.target.value)}
                          placeholder={`Subtopic ${subtopicIndex + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeKnowledgeSubtopic(knowledgeIndex, subtopicIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Outcomes Tab (SCEI-HE only) */}
        {isHE && (
          <TabsContent value="outcomes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <GraduationCap className="h-5 w-5" />
                      <span>Learning Outcomes</span>
                    </CardTitle>
                    <Button type="button" onClick={() => addToArray(learningOutcomes, setLearningOutcomes)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Outcome
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {learningOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Textarea
                        value={outcome}
                        onChange={(e) => updateInArray(learningOutcomes, setLearningOutcomes, index, e.target.value)}
                        placeholder={`Learning outcome ${index + 1}`}
                        rows={2}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromArray(learningOutcomes, setLearningOutcomes, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Graduate Attributes</CardTitle>
                    <Button type="button" onClick={() => addToArray(attributes, setAttributes)} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attribute
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {attributes.map((attribute, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={attribute}
                        onChange={(e) => updateInArray(attributes, setAttributes, index, e.target.value)}
                        placeholder={`Graduate attribute ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromArray(attributes, setAttributes, index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Assessor Guide Tab */}
        <TabsContent value="assessor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Assessor Guide</span>
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
          disabled={isSubmitting}
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
  );
};

export default ComprehensiveUnitForm;