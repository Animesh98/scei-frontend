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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { Unit, UnitElement, PerformanceEvidence, KnowledgeEvidence, Content, Benchmark } from '@/types';
import { useFetchUnitDetails, SceiUnitPayload, useUploadAssessorGuide, useAssessorGuideStatus } from '@/hooks/use-api';
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
  GraduationCap,
  Download,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ComprehensiveUnitFormProps {
  unit?: Unit;
  isEditing?: boolean;
  onSubmit: (data: SceiUnitPayload) => Promise<Unit | unknown>;
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
  
  // Track if unit has been saved successfully
  const [savedUnit, setSavedUnit] = useState<Unit | null>(unit || null);
  const [showAssessorGuideSection, setShowAssessorGuideSection] = useState(false);
  
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

  // University Benchmarks
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>(
    unit?.benchmarks || [{ uni_name: '', course_outline: '', units: [''] }]
  );

  // Active tab state (currently not used but available for future enhancement)
  // const [activeTab, setActiveTab] = useState('basic');

  // Assessor Guide Upload States
  const [assessorGuideFile, setAssessorGuideFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // API hooks
  const fetchUnitMutation = useFetchUnitDetails();
  const uploadAssessorGuideMutation = useUploadAssessorGuide();
  
  // Check assessor guide status if we have a saved unit
  const { data: assessorGuideStatus, refetch: refetchStatus } = useAssessorGuideStatus(
    savedUnit?.id || ''
  );

  const isHE = user?.domain === 'scei-he';

  // Show assessor guide section if unit exists
  useEffect(() => {
    if (savedUnit && !isEditing) {
      setShowAssessorGuideSection(true);
    }
  }, [savedUnit, isEditing]);

  // Handle fetch unit details
  const handleFetchUnit = async () => {
    if (!basicData.unit_code.trim()) {
      toast.error('Please enter a unit code first');
      return;
    }

    try {
      const response = await fetchUnitMutation.mutateAsync(basicData.unit_code.trim());
      const unitData = response.data;

      // Populate basic data
      setBasicData(prev => ({
        ...prev,
        unit_title: unitData.unit_title || '',
        competency: unitData.competency || '',
        domain: unitData.domain || prev.domain
      }));

      // Populate unit elements
      if (unitData.unit_elements && unitData.unit_elements.length > 0) {
        const elements = unitData.unit_elements.map(elem => ({
          element: elem.element,
          criterias: Array.isArray(elem.criterias) ? elem.criterias : 
                    typeof elem.criterias === 'string' ? elem.criterias.split('\n').filter(c => c.trim()) : ['']
        }));
        setUnitElements(elements);
      }

      // Populate performance evidences
      if (unitData.unit_performance_evidences && unitData.unit_performance_evidences.length > 0) {
        const evidences = unitData.unit_performance_evidences.map(pe => ({
          evidence: pe.evidence,
          subtopics: Array.isArray(pe.subtopics) ? pe.subtopics : 
                    typeof pe.subtopics === 'string' ? pe.subtopics.split('\n').filter(s => s.trim()) : ['']
        }));
        setPerformanceEvidences(evidences);
      }

      // Populate knowledge evidences
      if (unitData.unit_knowledges && unitData.unit_knowledges.length > 0) {
        const knowledges = unitData.unit_knowledges.map(kn => ({
          topic: kn.topic,
          subtopics: Array.isArray(kn.subtopics) ? kn.subtopics : 
                    typeof kn.subtopics === 'string' ? kn.subtopics.split('\n').filter(s => s.trim()) : ['']
        }));
        setKnowledgeEvidences(knowledges);
      }

      toast.success('Unit details fetched successfully!');
    } catch (error: unknown) {
      console.error('Error fetching unit details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unit details. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Validation functions
  const validateBasicInfo = () => {
    if (isHE) {
      return basicData.unit_code.trim() && basicData.unit_title.trim() && basicData.unit_outline.trim();
    }
    return basicData.unit_code.trim() && basicData.unit_title.trim() && basicData.competency.trim();
  };

  const validateElements = () => {
    return unitElements.some(el => 
      el.element.trim() && el.criterias.some(c => c.trim())
    );
  };

  const validatePerformanceEvidence = () => {
    return performanceEvidences.some(pe => 
      pe.evidence.trim() && pe.subtopics.some(st => st.trim())
    );
  };

  const validateKnowledgeEvidence = () => {
    return knowledgeEvidences.some(ke => 
      ke.topic.trim() && ke.subtopics.some(st => st.trim())
    );
  };

  // SCEI-HE validation functions
  const validateLearningOutcomes = () => {
    return learningOutcomes.some(outcome => outcome.trim());
  };

  const validateContents = () => {
    return contents.some(content => 
      content.content.trim() && content.criteria.some(c => c.trim())
    );
  };

  const canSubmit = () => {
    if (isHE) {
      // SCEI-HE validation: basic info + learning outcomes + contents required
      return validateBasicInfo() && validateLearningOutcomes() && validateContents();
    }
    // SCEI validation: all sections required
    return validateBasicInfo() && validateElements() && validatePerformanceEvidence() && validateKnowledgeEvidence();
  };

  // Add new unit element
  const addUnitElement = () => {
    setUnitElements([...unitElements, { element: '', criterias: [''] }]);
  };

  // Remove unit element
  const removeUnitElement = (index: number) => {
    if (unitElements.length > 1) {
      const updated = unitElements.filter((_, i) => i !== index);
      setUnitElements(updated);
    }
  };

  // Update unit element
  const updateUnitElement = (index: number, field: keyof UnitElement, value: string | string[]) => {
    const updated = [...unitElements];
    updated[index] = { ...updated[index], [field]: value };
    setUnitElements(updated);
  };

  // Add criteria to element
  const addCriteria = (elementIndex: number) => {
    const updated = [...unitElements];
    updated[elementIndex].criterias.push('');
    setUnitElements(updated);
  };

  // Remove criteria from element
  const removeCriteria = (elementIndex: number, criteriaIndex: number) => {
    const updated = [...unitElements];
    if (updated[elementIndex].criterias.length > 1) {
      updated[elementIndex].criterias = updated[elementIndex].criterias.filter((_, i) => i !== criteriaIndex);
      setUnitElements(updated);
    }
  };

  // Update criteria
  const updateCriteria = (elementIndex: number, criteriaIndex: number, value: string) => {
    const updated = [...unitElements];
    updated[elementIndex].criterias[criteriaIndex] = value;
    setUnitElements(updated);
  };

  // Performance Evidence functions
  const addPerformanceEvidence = () => {
    setPerformanceEvidences([...performanceEvidences, { evidence: '', subtopics: [''] }]);
  };

  const removePerformanceEvidence = (index: number) => {
    if (performanceEvidences.length > 1) {
      const updated = performanceEvidences.filter((_, i) => i !== index);
      setPerformanceEvidences(updated);
    }
  };

  const updatePerformanceEvidence = (index: number, field: keyof PerformanceEvidence, value: string | string[]) => {
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
    if (updated[evidenceIndex].subtopics.length > 1) {
      updated[evidenceIndex].subtopics = updated[evidenceIndex].subtopics.filter((_, i) => i !== subtopicIndex);
      setPerformanceEvidences(updated);
    }
  };

  const updatePerformanceSubtopic = (evidenceIndex: number, subtopicIndex: number, value: string) => {
    const updated = [...performanceEvidences];
    updated[evidenceIndex].subtopics[subtopicIndex] = value;
    setPerformanceEvidences(updated);
  };

  // Knowledge Evidence functions
  const addKnowledgeEvidence = () => {
    setKnowledgeEvidences([...knowledgeEvidences, { topic: '', subtopics: [''] }]);
  };

  const removeKnowledgeEvidence = (index: number) => {
    if (knowledgeEvidences.length > 1) {
      const updated = knowledgeEvidences.filter((_, i) => i !== index);
      setKnowledgeEvidences(updated);
    }
  };

  const updateKnowledgeEvidence = (index: number, field: keyof KnowledgeEvidence, value: string | string[]) => {
    const updated = [...knowledgeEvidences];
    updated[index] = { ...updated[index], [field]: value };
    setKnowledgeEvidences(updated);
  };

  const addKnowledgeSubtopic = (knowledgeIndex: number) => {
    const updated = [...knowledgeEvidences];
    updated[knowledgeIndex].subtopics.push('');
    setKnowledgeEvidences(updated);
  };

  const removeKnowledgeSubtopic = (knowledgeIndex: number, subtopicIndex: number) => {
    const updated = [...knowledgeEvidences];
    if (updated[knowledgeIndex].subtopics.length > 1) {
      updated[knowledgeIndex].subtopics = updated[knowledgeIndex].subtopics.filter((_, i) => i !== subtopicIndex);
      setKnowledgeEvidences(updated);
    }
  };

  const updateKnowledgeSubtopic = (knowledgeIndex: number, subtopicIndex: number, value: string) => {
    const updated = [...knowledgeEvidences];
    updated[knowledgeIndex].subtopics[subtopicIndex] = value;
    setKnowledgeEvidences(updated);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      setAssessorGuideFile(pdfFile);
      toast.success(`File "${pdfFile.name}" selected for upload`);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setAssessorGuideFile(file);
      toast.success(`File "${file.name}" selected for upload`);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  // Upload assessor guide
  const handleUploadAssessorGuide = async () => {
    if (!assessorGuideFile || !savedUnit) {
      toast.error('Please select a PDF file and ensure the unit is saved');
      return;
    }

    try {
      await uploadAssessorGuideMutation.mutateAsync({
        assessor_guide_file: assessorGuideFile,
        unit_id: savedUnit.id,
        unit_code: savedUnit.unit_code
      });

      toast.success('Assessor guide uploaded successfully!');
      setAssessorGuideFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('assessor-guide-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refetch status
      refetchStatus();
    } catch (error: unknown) {
      console.error('Error uploading assessor guide:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload assessor guide. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) {
      const errorMessage = isHE 
        ? 'Please fill in basic information, at least one learning outcome, and at least one content area with criteria'
        : 'Please fill in all required sections with at least one item each';
      toast.error(errorMessage);
      return;
    }

    let apiPayload: SceiUnitPayload;

    if (isHE) {
      // SCEI-HE payload format
      const cleanOutcomes = learningOutcomes.filter(outcome => outcome.trim());
      const cleanAttributes = attributes.filter(attr => attr.trim());
      const cleanContents = contents.filter(content => content.content.trim()).map(content => ({
        content: content.content.trim(),
        criterias: content.criteria.filter(c => c.trim()) // "criterias" for SCEI-HE
      }));
      const cleanStandards = standards.filter(standard => standard.trim());
      const cleanBenchmarks = benchmarks.filter(benchmark => 
        benchmark.uni_name.trim() || benchmark.course_outline.trim()
      ).map(benchmark => ({
        uni_name: benchmark.uni_name.trim(),
        outline: benchmark.course_outline.trim(), // "outline" not "course_outline"
        units: benchmark.units.filter(unit => unit.trim())
      }));

      apiPayload = {
        unit_code: basicData.unit_code.trim(),
        name: basicData.unit_title.trim(),
        outline: basicData.unit_outline.trim(),
        outcomes: cleanOutcomes,
        attributes: cleanAttributes,
        contents: cleanContents,
        standards: cleanStandards,
        benchmarks: cleanBenchmarks
      };
    } else {
      // SCEI payload format (existing)
      const cleanElements = unitElements.filter(el => el.element.trim()).map(el => ({
        element: el.element,
        criteria: el.criterias.filter(c => c.trim()) // "criteria" not "criterias"
      }));

      const cleanEvidences = performanceEvidences.filter(pe => pe.evidence.trim()).map(pe => ({
        element: pe.evidence, // evidence becomes element in API
        subTopics: pe.subtopics.filter(st => st.trim()) // "subTopics" not "subtopics"
      }));

      const cleanKnowledge = knowledgeEvidences.filter(kn => kn.topic.trim()).map(kn => ({
        element: kn.topic, // topic becomes element in API
        subTopics: kn.subtopics.filter(st => st.trim()) // "subTopics" not "subtopics"
      }));

      apiPayload = {
        unit_code: basicData.unit_code.trim(),
        name: basicData.unit_title.trim(), // "name" not "unit_title"
        competency: basicData.competency,
        elements: cleanElements,
        evidences: cleanEvidences,
        knowledge: cleanKnowledge
      };
    }

    try {
      const result = await onSubmit(apiPayload);
      
      // If this was a create operation, set the saved unit
      if (!isEditing && result?.data) {
        setSavedUnit(result.data);
      }
    } catch (error) {
      // Error is handled by parent component
    }
  };

  return (
    <div className="w-full mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Validation Alert */}
      {!canSubmit() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please ensure all sections (Elements, Performance Evidence, Knowledge Evidence) have at least one item with content before saving.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted rounded-lg">
          <TabsTrigger value="basic" className="flex-shrink-0 text-xs sm:text-sm">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Basic Info</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          
          {/* SCEI-specific tabs */}
          {!isHE && (
            <>
              <TabsTrigger value="elements" className="flex-shrink-0 text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Elements</span>
                <span className="sm:hidden">Elements</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex-shrink-0 text-xs sm:text-sm">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Performance</span>
                <span className="sm:hidden">Perf</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex-shrink-0 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Knowledge</span>
                <span className="sm:hidden">Know</span>
              </TabsTrigger>
            </>
          )}

          {/* SCEI-HE specific tabs */}
          {isHE && (
            <>
              <TabsTrigger value="outcomes" className="flex-shrink-0 text-xs sm:text-sm">
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Learning Outcomes</span>
                <span className="sm:hidden">Outcomes</span>
              </TabsTrigger>
              <TabsTrigger value="attributes" className="flex-shrink-0 text-xs sm:text-sm">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Graduate Attributes</span>
                <span className="sm:hidden">Attributes</span>
              </TabsTrigger>
              <TabsTrigger value="contents" className="flex-shrink-0 text-xs sm:text-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">ACECQA Content</span>
                <span className="sm:hidden">Content</span>
              </TabsTrigger>
              <TabsTrigger value="standards" className="flex-shrink-0 text-xs sm:text-sm">
                <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Industry Standards</span>
                <span className="sm:hidden">Standards</span>
              </TabsTrigger>
              <TabsTrigger value="benchmarks" className="flex-shrink-0 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">University Benchmarks</span>
                <span className="sm:hidden">Benchmarks</span>
              </TabsTrigger>
            </>
          )}

          <TabsTrigger value="assessor" className="flex-shrink-0 text-xs sm:text-sm">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Assessor Guide</span>
            <span className="sm:hidden">Guide</span>
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
            <CardContent className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
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

                <div className="flex justify-start">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchUnit}
                    disabled={!basicData.unit_code.trim() || fetchUnitMutation.isPending}
                    className="w-full text-xs sm:text-sm"
                  >
                    {fetchUnitMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Fetch Unit
                      </>
                    )}
                  </Button>
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

              {/* Conditional Field: Competency for SCEI, Unit Outline for SCEI-HE */}
              {isHE ? (
                <div className="space-y-2">
                  <Label htmlFor="unit_outline">Unit Outline *</Label>
                  <Textarea
                    id="unit_outline"
                    value={basicData.unit_outline}
                    onChange={(e) => setBasicData(prev => ({ ...prev, unit_outline: e.target.value }))}
                    placeholder="Provide a detailed outline of the unit for higher education"
                    rows={6}
                    required
                  />
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SCEI-specific tabs */}
        {!isHE && (
          <>
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
                      <Label>Element {elementIndex + 1} *</Label>
                      <Input
                        value={element.element}
                        onChange={(e) => updateUnitElement(elementIndex, 'element', e.target.value)}
                        placeholder="Enter element description"
                        required
                      />
                    </div>
                    {unitElements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUnitElement(elementIndex)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Performance Criteria *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCriteria(elementIndex)}
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
                          placeholder={`Performance criteria ${elementIndex + 1}.${criteriaIndex + 1}`}
                          className="flex-1"
                          required
                        />
                        {element.criterias.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCriteria(elementIndex, criteriaIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                      <Label>Evidence {evidenceIndex + 1} *</Label>
                      <Textarea
                        value={evidence.evidence}
                        onChange={(e) => updatePerformanceEvidence(evidenceIndex, 'evidence', e.target.value)}
                        placeholder="Enter performance evidence description"
                        rows={2}
                        required
                      />
                    </div>
                    {performanceEvidences.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePerformanceEvidence(evidenceIndex)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Subtopics *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPerformanceSubtopic(evidenceIndex)}
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
                          className="flex-1"
                          required
                        />
                        {evidence.subtopics.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePerformanceSubtopic(evidenceIndex, subtopicIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                      <Label>Knowledge Topic {knowledgeIndex + 1} *</Label>
                      <Textarea
                        value={knowledge.topic}
                        onChange={(e) => updateKnowledgeEvidence(knowledgeIndex, 'topic', e.target.value)}
                        placeholder="Enter knowledge topic description"
                        rows={2}
                        required
                      />
                    </div>
                    {knowledgeEvidences.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKnowledgeEvidence(knowledgeIndex)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Subtopics *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addKnowledgeSubtopic(knowledgeIndex)}
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
                          className="flex-1"
                          required
                        />
                        {knowledge.subtopics.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKnowledgeSubtopic(knowledgeIndex, subtopicIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
          </>
        )}

        {/* SCEI-HE specific tabs */}
        {isHE && (
          <>
            {/* Learning Outcomes Tab */}
          <TabsContent value="outcomes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Learning Outcomes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Learning Outcomes</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLearningOutcomes([...learningOutcomes, ''])}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Outcome
                  </Button>
                </div>
                
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Textarea
                      value={outcome}
                      onChange={(e) => {
                        const updated = [...learningOutcomes];
                        updated[index] = e.target.value;
                        setLearningOutcomes(updated);
                      }}
                      placeholder={`Learning outcome ${index + 1} (e.g., Demonstrate understanding of educational theories)`}
                      className="flex-1"
                      rows={2}
                    />
                    {learningOutcomes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updated = learningOutcomes.filter((_, i) => i !== index);
                          setLearningOutcomes(updated);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

            {/* Graduate Attributes Tab */}
            <TabsContent value="attributes">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Graduate Attributes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Graduate Attributes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAttributes([...attributes, ''])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Attribute
                    </Button>
                  </div>
                  
                  {attributes.map((attribute, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={attribute}
                        onChange={(e) => {
                          const updated = [...attributes];
                          updated[index] = e.target.value;
                          setAttributes(updated);
                        }}
                        placeholder={`Graduate attribute ${index + 1} (e.g., Critical thinking, Communication)`}
                        className="flex-1"
                      />
                      {attributes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = attributes.filter((_, i) => i !== index);
                            setAttributes(updated);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACECQA Content Tab */}
            <TabsContent value="contents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>ACECQA Content</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Content Areas with Criteria</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setContents([...contents, { content: '', criteria: [''] }])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Content
                    </Button>
                  </div>
                  
                  {contents.map((contentItem, contentIndex) => (
                    <Card key={contentIndex} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <div className="flex-1 space-y-2">
                            <Label>Content Area {contentIndex + 1}</Label>
                            <Textarea
                              value={contentItem.content}
                              onChange={(e) => {
                                const updated = [...contents];
                                updated[contentIndex].content = e.target.value;
                                setContents(updated);
                              }}
                              placeholder="Enter content area description"
                              rows={2}
                            />
                          </div>
                          {contents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = contents.filter((_, i) => i !== contentIndex);
                                setContents(updated);
                              }}
                              className="text-red-600 hover:text-red-700 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Criteria</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...contents];
                                updated[contentIndex].criteria.push('');
                                setContents(updated);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Criteria
                            </Button>
                          </div>
                          
                          {contentItem.criteria.map((criteria, criteriaIndex) => (
                            <div key={criteriaIndex} className="flex items-center space-x-2 ml-4">
                              <Input
                                value={criteria}
                                onChange={(e) => {
                                  const updated = [...contents];
                                  updated[contentIndex].criteria[criteriaIndex] = e.target.value;
                                  setContents(updated);
                                }}
                                placeholder={`Criteria ${criteriaIndex + 1}`}
                                className="flex-1"
                              />
                              {contentItem.criteria.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...contents];
                                    updated[contentIndex].criteria = updated[contentIndex].criteria.filter((_, i) => i !== criteriaIndex);
                                    setContents(updated);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Industry Standards Tab */}
            <TabsContent value="standards">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Industry Standards</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Industry Standards</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setStandards([...standards, ''])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Standard
                    </Button>
                  </div>
                  
                  {standards.map((standard, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={standard}
                        onChange={(e) => {
                          const updated = [...standards];
                          updated[index] = e.target.value;
                          setStandards(updated);
                        }}
                        placeholder={`Industry standard ${index + 1} (e.g., ACECQA approved standards)`}
                        className="flex-1"
                      />
                      {standards.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = standards.filter((_, i) => i !== index);
                            setStandards(updated);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* University Benchmarks Tab */}
            <TabsContent value="benchmarks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>University Benchmarks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">University Comparisons</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBenchmarks([...benchmarks, { uni_name: '', course_outline: '', units: [''] }])}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Benchmark
                    </Button>
                  </div>
                  
                  {benchmarks.map((benchmark, benchmarkIndex) => (
                    <Card key={benchmarkIndex} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-2">
                              <Label>University Name</Label>
                              <Input
                                value={benchmark.uni_name}
                                onChange={(e) => {
                                  const updated = [...benchmarks];
                                  updated[benchmarkIndex].uni_name = e.target.value;
                                  setBenchmarks(updated);
                                }}
                                placeholder="e.g., University of Sydney"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Course Outline</Label>
                              <Textarea
                                value={benchmark.course_outline}
                                onChange={(e) => {
                                  const updated = [...benchmarks];
                                  updated[benchmarkIndex].course_outline = e.target.value;
                                  setBenchmarks(updated);
                                }}
                                placeholder="Brief description of the course"
                                rows={3}
                              />
                            </div>
                          </div>
                          {benchmarks.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = benchmarks.filter((_, i) => i !== benchmarkIndex);
                                setBenchmarks(updated);
                              }}
                              className="text-red-600 hover:text-red-700 mt-6"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Related Units</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const updated = [...benchmarks];
                                updated[benchmarkIndex].units.push('');
                                setBenchmarks(updated);
                              }}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Unit
                            </Button>
                          </div>
                          
                          {benchmark.units.map((unit, unitIndex) => (
                            <div key={unitIndex} className="flex items-center space-x-2 ml-4">
                              <Input
                                value={unit}
                                onChange={(e) => {
                                  const updated = [...benchmarks];
                                  updated[benchmarkIndex].units[unitIndex] = e.target.value;
                                  setBenchmarks(updated);
                                }}
                                placeholder={`Unit code ${unitIndex + 1} (e.g., EDUC1001)`}
                                className="flex-1"
                              />
                              {benchmark.units.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updated = [...benchmarks];
                                    updated[benchmarkIndex].units = updated[benchmarkIndex].units.filter((_, i) => i !== unitIndex);
                                    setBenchmarks(updated);
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </>
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
              {!savedUnit ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Please save the unit first before uploading the assessor guide. The assessor guide is required to generate study guides and presentations.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {/* Assessor Guide Status */}
                  {assessorGuideStatus && (
                    <Alert className={assessorGuideStatus.has_embeddings ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
                      {assessorGuideStatus.has_embeddings ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <AlertDescription>
                        {assessorGuideStatus.has_embeddings ? (
                          <span className="text-green-800">
                            Assessor guide is uploaded and ready! ({assessorGuideStatus.total_chunks} chunks processed)
                          </span>
                        ) : (
                          <span className="text-yellow-800">
                            No assessor guide found for this unit. Upload one to enable study guide and presentation generation.
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* File Upload Section */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {assessorGuideFile ? assessorGuideFile.name : 'Drop your assessor guide PDF here or click to browse'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">Only PDF files are supported</p>
                    
                    <input
                      id="assessor-guide-file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <div className="flex justify-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('assessor-guide-file')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      
                      {assessorGuideFile && (
                        <Button
                          type="button"
                          onClick={handleUploadAssessorGuide}
                          disabled={uploadAssessorGuideMutation.isPending}
                        >
                          {uploadAssessorGuideMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Guide
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Information Alert */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The assessor guide contains detailed instructions for assessment tasks and is essential for generating comprehensive study guides and presentations. Upload a PDF document that includes assessment criteria, marking rubrics, and guidance for assessors.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row justify-end mt-6 gap-3 sm:gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit()}
          className="w-full sm:w-auto sm:min-w-32"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Unit' : 'Create Unit'}
            </>
          )}
        </Button>
      </div>

      {/* Post-Save Assessor Guide Message */}
      {showAssessorGuideSection && savedUnit && !assessorGuideStatus?.has_embeddings && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Unit created successfully!</strong> To generate study guides and presentations, please upload an assessor guide PDF in the &quot;Assessor Guide&quot; tab above.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ComprehensiveUnitForm;