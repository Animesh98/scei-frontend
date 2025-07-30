'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnitSelector from '@/components/ui/unit-selector';
import ComprehensiveUnitForm from '@/components/forms/comprehensive-unit-form';
import { useUnits, useUnit, useUpdateUnit, SceiUnitPayload } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { Edit, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const EditUnitPage = () => {
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
      const result = await updateUnitMutation.mutateAsync({
        id: selectedUnitId,
        ...unitData
      });
      toast.success('Unit updated successfully!');
      
      // Return result for form to handle any post-update actions
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update unit';
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle loading state
    }
  };

  return (
    <AuthGuard>
      <MainLayout 
        title="Edit Unit" 
        subtitle="Modify an existing educational unit"
        showBackButton={true}
        backHref="/units"
        maxWidth="6xl"
      >
        {!selectedUnitId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Select Unit to Edit</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UnitSelector
                units={unitsData?.rows || []}
                selectedUnit={selectedUnitId}
                onUnitSelect={handleUnitSelect}
                placeholder="Search and select a unit to edit..."
              />
            </CardContent>
          </Card>
        ) : isLoadingUnit ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : unitData ? (
          <ComprehensiveUnitForm
            unit={unitData}
            isEditing={true}
            onSubmit={handleSubmit}
            isSubmitting={updateUnitMutation.isPending}
          />
        ) : (
          <EmptyState
            icon={<BookOpen />}
            title="Unit not found"
            description="The selected unit could not be loaded. Please try selecting a different unit."
          />
        )}
      </MainLayout>
    </AuthGuard>
  );
};

const EditUnitPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditUnitPage />
    </Suspense>
  );
};

export default EditUnitPageWithSuspense;