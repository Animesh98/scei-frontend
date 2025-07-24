'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnitSelector from '@/components/ui/unit-selector';
import StepByStepUnitForm from '@/components/forms/step-by-step-unit-form';
import { useUnits, useUnit, useUpdateUnit, SceiUnitPayload } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Edit, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const EditUnitPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams?.get('id') || '';
  
  const [selectedUnitId, setSelectedUnitId] = useState(unitId);

  const { data: unitsData } = useUnits(0, 100);
  const { data: unitData, isLoading: isLoadingUnit } = useUnit(selectedUnitId);
  const updateUnitMutation = useUpdateUnit();

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    // Update URL without page refresh
    const url = new URL(window.location.href);
    url.searchParams.set('id', unitId);
    window.history.replaceState({}, '', url.toString());
  };

  const handleSubmit = async (unitData: SceiUnitPayload) => {
    if (!selectedUnitId) {
      toast.error('Please select a unit to edit');
      return;
    }

    try {
      await updateUnitMutation.mutateAsync({
        id: selectedUnitId,
        ...unitData
      });
      toast.success('Unit updated successfully!');
      router.push('/units');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update unit');
      throw error; // Re-throw to let form handle loading state
    }
  };

  if (isLoadingUnit && selectedUnitId) {
    return (
      <AuthGuard>
        <MainLayout 
          title="Edit Unit" 
          subtitle="Modify comprehensive unit information with step-by-step guidance"
          showBackButton={true}
          backHref="/units"
        >
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout 
        title="Edit Unit" 
        subtitle="Modify comprehensive unit information with step-by-step guidance"
        showBackButton={true}
        backHref="/units"
        maxWidth="6xl"
      >
        <div className="space-y-6">
          {/* Unit Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Unit to Edit</CardTitle>
            </CardHeader>
            <CardContent>
              <UnitSelector
                units={unitsData?.rows || []}
                selectedUnit={selectedUnitId}
                onUnitSelect={handleUnitSelect}
                label="Select Unit"
                placeholder="Search units to edit..."
              />
            </CardContent>
          </Card>

          {/* Unit Form */}
          {selectedUnitId && unitData ? (
            <StepByStepUnitForm
              unit={unitData}
              isEditing={true}
              onSubmit={handleSubmit}
              isSubmitting={updateUnitMutation.isPending}
            />
          ) : selectedUnitId ? (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<BookOpen />}
                  title="Unit Not Found"
                  description="The selected unit could not be loaded. Please try selecting a different unit."
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icon={<Edit />}
                  title="Select a Unit to Edit"
                  description="Choose a unit from the dropdown above to start editing its comprehensive information with step-by-step guidance."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default EditUnitPage;