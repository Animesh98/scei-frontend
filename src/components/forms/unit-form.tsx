'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateUnit, useUpdateUnit, useUnit } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth-store';
import { Unit, UnitElement, PerformanceEvidence, KnowledgeEvidence } from '@/types';
import { Trash2, Plus, Upload } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

const unitSchema = z.object({
  unit_code: z.string().min(1, 'Unit code is required'),
  unit_title: z.string().min(1, 'Unit title is required'),
  competency: z.string().optional(),
  unit_outline: z.string().optional(),
  unit_elements: z.array(z.object({
    element: z.string().min(1, 'Element is required'),
    criterias: z.array(z.string().min(1, 'Criteria is required')),
  })).optional(),
  unit_performance_evidences: z.array(z.object({
    evidence: z.string().min(1, 'Evidence is required'),
    subtopics: z.array(z.string()),
  })).optional(),
  unit_knowledges: z.array(z.object({
    topic: z.string().min(1, 'Topic is required'),
    subtopics: z.array(z.string()),
  })).optional(),
  // HE specific fields
  learning_outcome: z.array(z.string()).optional(),
  attributes: z.array(z.string()).optional(),
  contents: z.array(z.object({
    content: z.string(),
    criteria: z.array(z.string()),
  })).optional(),
  standards: z.array(z.string()).optional(),
  benchmarks: z.array(z.object({
    uni_name: z.string(),
    course_outline: z.string(),
    units: z.array(z.string()),
  })).optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface UnitFormProps {
  unitId?: string;
}

const UnitForm = ({ unitId }: UnitFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [assessorGuideFile, setAssessorGuideFile] = useState<File | null>(null);

  const isEditing = !!unitId || !!searchParams?.get('id');
  const editId = unitId || searchParams?.get('id') || '';

  const { data: existingUnit, isLoading: loadingUnit } = useUnit(editId);
  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unit_elements: [{ element: '', criterias: [''] }],
      unit_performance_evidences: [{ evidence: '', subtopics: [''] }],
      unit_knowledges: [{ topic: '', subtopics: [''] }],
      learning_outcome: [''],
      attributes: [''],
      contents: [{ content: '', criteria: [''] }],
      standards: [''],
      benchmarks: [{ uni_name: '', course_outline: '', units: [''] }],
    },
  });

  const {
    fields: elementFields,
    append: appendElement,
    remove: removeElement,
  } = useFieldArray({ control, name: 'unit_elements' });

  const {
    fields: evidenceFields,
    append: appendEvidence,
    remove: removeEvidence,
  } = useFieldArray({ control, name: 'unit_performance_evidences' });

  const {
    fields: knowledgeFields,
    append: appendKnowledge,
    remove: removeKnowledge,
  } = useFieldArray({ control, name: 'unit_knowledges' });

  useEffect(() => {
    if (existingUnit && isEditing) {
      reset({
        unit_code: existingUnit.unit_code,
        unit_title: existingUnit.unit_title,
        competency: existingUnit.competency || '',
        unit_outline: existingUnit.unit_outline || '',
        unit_elements: existingUnit.unit_elements || [{ element: '', criterias: [''] }],
        unit_performance_evidences: existingUnit.unit_performance_evidences || [{ evidence: '', subtopics: [''] }],
        unit_knowledges: existingUnit.unit_knowledges || [{ topic: '', subtopics: [''] }],
        learning_outcome: existingUnit.learning_outcome || [''],
        attributes: existingUnit.attributes || [''],
        contents: existingUnit.contents || [{ content: '', criteria: [''] }],
        standards: existingUnit.standards || [''],
        benchmarks: existingUnit.benchmarks || [{ uni_name: '', course_outline: '', units: [''] }],
      });
    }
  }, [existingUnit, isEditing, reset]);

  const onSubmit = async (data: UnitFormData) => {
    try {
      const unitData = {
        ...data,
        domain: user?.domain,
      };

      if (isEditing) {
        await updateUnitMutation.mutateAsync({ id: editId, ...unitData });
        toast.success('Unit updated successfully'); // ✅ FIXED
      } else {
        await createUnitMutation.mutateAsync(unitData);
        toast.success('Unit created successfully'); // ✅ FIXED
      }

      router.push('/dashboard');
    } catch (error: any) {
      toast.error('An error occurred'); // ✅ FIXED
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAssessorGuideFile(file);
    }
  };

  if (loadingUnit && isEditing) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isHE = user?.domain === 'scei-he';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="elements">Elements</TabsTrigger>
          <TabsTrigger value="performance">Performance Evidence</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Evidence</TabsTrigger>
          <TabsTrigger value="assessor">Assessor Guide</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_code">Unit Code *</Label>
                  <Input
                    id="unit_code"
                    {...register('unit_code')}
                    placeholder="Enter unit code"
                    className={errors.unit_code ? 'border-red-500' : ''}
                  />
                  {errors.unit_code && (
                    <p className="text-sm text-red-600">{errors.unit_code.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit_title">Unit Title *</Label>
                  <Input
                    id="unit_title"
                    {...register('unit_title')}
                    placeholder="Enter unit title"
                    className={errors.unit_title ? 'border-red-500' : ''}
                  />
                  {errors.unit_title && (
                    <p className="text-sm text-red-600">{errors.unit_title.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="competency">Competency</Label>
                <Input
                  id="competency"
                  {...register('competency')}
                  placeholder="Enter competency"
                />
              </div>

              {isHE && (
                <div className="space-y-2">
                  <Label htmlFor="unit_outline">Unit Outline</Label>
                  <Textarea
                    id="unit_outline"
                    {...register('unit_outline')}
                    placeholder="Enter unit outline"
                    rows={4}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Elements Tab */}
        <TabsContent value="elements">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Unit Elements</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendElement({ element: '', criterias: [''] })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Element
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {elementFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Element {index + 1}</Label>
                    {elementFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeElement(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    {...register(`unit_elements.${index}.element` as const)}
                    placeholder="Enter element description"
                  />

                  <div className="space-y-2">
                    <Label className="text-sm">Criteria</Label>
                    {/* Simplified criteria input - you can expand this to dynamic arrays */}
                    <Textarea
                      placeholder="Enter criteria (one per line)"
                      onChange={(e) => {
                        const criterias = e.target.value.split('\n').filter(c => c.trim());
                        setValue(`unit_elements.${index}.criterias`, criterias);
                      }}
                    />
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
                <CardTitle>Performance Evidence</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendEvidence({ evidence: '', subtopics: [''] })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Evidence
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {evidenceFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Evidence {index + 1}</Label>
                    {evidenceFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEvidence(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    {...register(`unit_performance_evidences.${index}.evidence` as const)}
                    placeholder="Enter evidence description"
                  />

                  <div className="space-y-2">
                    <Label className="text-sm">Subtopics</Label>
                    <Textarea
                      placeholder="Enter subtopics (one per line)"
                      onChange={(e) => {
                        const subtopics = e.target.value.split('\n').filter(s => s.trim());
                        setValue(`unit_performance_evidences.${index}.subtopics`, subtopics);
                      }}
                    />
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
                <CardTitle>Knowledge Evidence</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendKnowledge({ topic: '', subtopics: [''] })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Knowledge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {knowledgeFields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Knowledge {index + 1}</Label>
                    {knowledgeFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKnowledge(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    {...register(`unit_knowledges.${index}.topic` as const)}
                    placeholder="Enter knowledge topic"
                  />

                  <div className="space-y-2">
                    <Label className="text-sm">Subtopics</Label>
                    <Textarea
                      placeholder="Enter subtopics (one per line)"
                      onChange={(e) => {
                        const subtopics = e.target.value.split('\n').filter(s => s.trim());
                        setValue(`unit_knowledges.${index}.subtopics`, subtopics);
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessor Guide Tab */}
        <TabsContent value="assessor">
          <Card>
            <CardHeader>
              <CardTitle>Assessor Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                    <strong>Note:</strong> File upload functionality will be implemented later. 
                    For now, please prepare your assessor guide file.
                  </p>
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
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Unit' : 'Create Unit'
          )}
        </Button>
      </div>
    </form>
  );
};

export default UnitForm;