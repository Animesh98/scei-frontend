'use client';

import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import ComprehensiveUnitForm from '@/components/forms/comprehensive-unit-form';
import { useCreateUnit, SceiUnitPayload } from '@/hooks/use-api';
import { toast } from 'sonner';

const AddUnitPage = () => {
  const createUnitMutation = useCreateUnit();

  const handleSubmit = async (unitData: SceiUnitPayload) => {
    try {
      const result = await createUnitMutation.mutateAsync(unitData);
      toast.success('Unit created successfully!');
      
      // Return the result so the form can handle post-save actions
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create unit';
      toast.error(errorMessage);
      throw error; // Re-throw to let form handle loading state
    }
  };

  return (
    <AuthGuard>
      <MainLayout 
        title="Add New Unit" 
        subtitle="Create a comprehensive educational unit with all components"
        showBackButton={true}
        backHref="/units"
        maxWidth="6xl"
      >
        <ComprehensiveUnitForm
          onSubmit={handleSubmit}
          isSubmitting={createUnitMutation.isPending}
        />
      </MainLayout>
    </AuthGuard>
  );
};

export default AddUnitPage;