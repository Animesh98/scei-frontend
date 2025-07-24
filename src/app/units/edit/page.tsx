'use client';

import { Suspense } from 'react';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import UnitForm from '@/components/forms/unit-form';
import LoadingSpinner from '@/components/ui/loading-spinner';

const EditUnitContent = () => {
  return <UnitForm />;
};

const EditUnitPage = () => {
  return (
    <AuthGuard>
      <MainLayout title="Edit Unit" subtitle="Modify an existing educational unit">
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <EditUnitContent />
        </Suspense>
      </MainLayout>
    </AuthGuard>
  );
};

export default EditUnitPage;