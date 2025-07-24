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
        <div className={cn("w-8 h-8 bg-primary-800 rounded flex items-center justify-center", className)}>
          <span className="text-white font-bold text-sm">
            {user?.domain === 'scei-he' ? 'HE' : 'SC'}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("w-8 h-8 rounded overflow-hidden bg-white", className)}>
        <Image
          src={logoPath}
          alt={user?.domain === 'scei-he' ? 'SCEI HE Logo' : 'SCEI Logo'}
          width={32}
          height={32}
          className="w-full h-full object-contain"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Main Header */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hidden sm:flex"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            <div>
              <div className="flex items-center space-x-2">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                  <LogoComponent />
                  <div className="hidden sm:block">
                    <span className="font-semibold text-gray-900">
                      {user?.domain === 'scei-he' ? 'SCEI HE' : 'SCEI'}
                    </span>
                  </div>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumbs */}
      {generatedBreadcrumbs.length > 1 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
          <nav className="flex items-center space-x-2 text-sm">
            {generatedBreadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                {item.href && !item.current ? (
                  <Link
                    href={item.href}
                    className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(
                    item.current ? "text-gray-900 font-medium" : "text-gray-500"
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
        <div className="px-4 py-2 border-t border-gray-100 sm:hidden">
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