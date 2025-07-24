'use client';

import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import ComprehensiveUnitForm from '@/components/forms/comprehensive-unit-form';
import { useCreateUnit } from '@/hooks/use-api';
import { Unit } from '@/types';
import { toast } from 'sonner';

const AddUnitPage = () => {
  const router = useRouter();
  const createUnitMutation = useCreateUnit();

  const handleSubmit = async (unitData: Partial<Unit>) => {
    try {
      await createUnitMutation.mutateAsync(unitData);
      toast.success('Unit created successfully!');
      router.push('/units');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create unit');
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