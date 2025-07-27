'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { ArrowLeft, Menu, Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

const Header = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  backHref,
  breadcrumbs,
  actions 
}: HeaderProps) => {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [logoError, setLogoError] = useState(false);

  // Auto-generate breadcrumbs if not provided
  const generatedBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  // Logo component that falls back to text if image not available
  const LogoComponent = ({ className }: { className?: string }) => {
    const logoPath = user?.domain === 'scei-he' 
      ? '/images/logos/scei-he-logo.png' 
      : '/images/logos/scei-logo.png';

    if (logoError) {
      // Fallback to text logo
      return (
        <div className={cn("w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-sm", className)}>
          <span className="text-white font-bold text-sm">
            {user?.domain === 'scei-he' ? 'HE' : 'SC'}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-gray-100 shadow-sm", className)}>
        <Image
          src={logoPath}
          alt={user?.domain === 'scei-he' ? 'SCEI HE Logo' : 'SCEI Logo'}
          width={40}
          height={40}
          className="w-full h-full object-contain p-1"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      {/* Main Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Navigation */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <LogoComponent />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {user?.domain === 'scei-he' ? 'SCEI Higher Education' : 'Southern Cross Education Institute'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Unit Management System
                </span>
              </div>
            </div>
            
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hidden sm:flex ml-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
        
        {/* Title Section */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {generatedBreadcrumbs.length > 1 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <nav className="flex items-center space-x-2 text-sm">
            {generatedBreadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                )}
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(
                    item.current ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {item.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile Back Button */}
      {showBackButton && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 sm:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="w-full justify-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      )}
    </header>
  );
};

// Helper function to generate breadcrumbs from pathname
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/dashboard' }
  ];

  if (segments.length === 0 || pathname === '/dashboard') {
    return [{ label: 'Dashboard', current: true }];
  }

  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    let label = segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Custom labels for known segments
    const labelMap: Record<string, string> = {
      'units': 'Units',
      'add': 'Add Unit',
      'edit': 'Edit Unit',
      'assessments': 'Generate Assessments',
      'study-guides': 'Generate Study Guides',
      'presentations': 'Generate Presentations',
      'users': 'Users'
    };
    
    if (labelMap[segment]) {
      label = labelMap[segment];
    }
    
    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });

  return breadcrumbs;
}

export default Header;