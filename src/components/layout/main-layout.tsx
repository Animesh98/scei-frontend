'use client';

import { ReactNode } from 'react';
import Sidebar from './sidebar';
import Header from './header';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl' | 'xl' | 'lg';
}

const MainLayout = ({ 
  children, 
  title, 
  subtitle,
  showBackButton = false,
  backHref,
  breadcrumbs,
  actions,
  maxWidth = 'full'
}: MainLayoutProps) => {
  const maxWidthClasses = {
    'full': 'max-w-full',
    '7xl': 'max-w-7xl',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
    '4xl': 'max-w-4xl',
    '3xl': 'max-w-3xl',
    '2xl': 'max-w-2xl',
    'xl': 'max-w-xl',
    'lg': 'max-w-lg'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      {/* Main content */}
      <div className="lg:ml-64">
        <Header 
          title={title} 
          subtitle={subtitle}
          showBackButton={showBackButton}
          backHref={backHref}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />
        <main className="p-6">
          <div className={`mx-auto ${maxWidthClasses[maxWidth]}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;