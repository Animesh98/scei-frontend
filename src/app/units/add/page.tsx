'use client';

import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import UnitForm from '@/components/forms/unit-form';

const AddUnitPage = () => {
  return (
    <AuthGuard>
      <MainLayout title="Add Unit" subtitle="Create a new educational unit">
        <UnitForm />
      </MainLayout>
    </AuthGuard>
  );
};

export default AddUnitPage;