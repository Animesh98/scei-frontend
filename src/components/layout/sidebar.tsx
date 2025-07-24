'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Edit,
  FileText,
  Presentation,
  LogOut,
  Menu,
  Home,
  List
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [unitsExpanded, setUnitsExpanded] = useState(true);
  const [logoError, setLogoError] = useState(false);

  const unitMenuItems = [
    { href: '/units', label: 'View All Units', icon: List },
    { href: '/units/add', label: 'Add Unit', icon: Plus },
    { href: '/units/edit', label: 'Edit Unit', icon: Edit },
    { href: '/units/assessments', label: 'Generate Assessments', icon: FileText },
    { href: '/units/study-guides', label: 'Generate Study Guide', icon: BookOpen },
    { href: '/units/presentations', label: 'Generate Presentation', icon: Presentation },
  ];

  const isActive = (href: string) => {
    if (href === '/units') {
      return pathname === '/units';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Logo component that falls back to text if image not available
  const LogoComponent = ({ className }: { className?: string }) => {
    const logoPath = user?.domain === 'scei-he' 
      ? '/images/logos/scei-he-logo.png' 
      : '/images/logos/scei-logo.png';

    if (logoError) {
      // Fallback to text logo
      return (
        <div className={cn("w-10 h-10 bg-primary-800 rounded flex items-center justify-center", className)}>
          <span className="text-white font-bold text-sm">
            {user?.domain === 'scei-he' ? 'HE' : 'SC'}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("w-10 h-10 rounded overflow-hidden bg-white", className)}>
        <Image
          src={logoPath}
          alt={user?.domain === 'scei-he' ? 'SCEI HE Logo' : 'SCEI Logo'}
          width={40}
          height={40}
          className="w-full h-full object-contain"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out",
        "w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <LogoComponent />
              <div>
                <h2 className="font-semibold text-gray-900">
                  {user?.domain === 'scei-he' ? 'SCEI HE' : 'SCEI'}
                </h2>
                <p className="text-xs text-gray-500">Education Institute</p>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors",
              isActive('/dashboard') ? "bg-primary-50 text-primary-800" : "text-gray-700"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>

          {/* Units Section */}
          <div>
            <button
              onClick={() => setUnitsExpanded(!unitsExpanded)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-left text-sm font-medium rounded-md hover:bg-gray-100 transition-colors",
                pathname.startsWith('/units') ? "bg-primary-50 text-primary-800" : "text-gray-700"
              )}
            >
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Units</span>
              </div>
              {unitsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {unitsExpanded && (
              <div className="ml-4 mt-2 space-y-1">
                {unitMenuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors",
                      isActive(item.href) ? "bg-primary-50 text-primary-800" : "text-gray-600"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Users Section - Only for admins */}
          {user?.isAdmin && (
            <Link
              href="/users"
              className={cn(
                "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors",
                isActive('/users') ? "bg-primary-50 text-primary-800" : "text-gray-700"
              )}
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;