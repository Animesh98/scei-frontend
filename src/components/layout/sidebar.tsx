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
      ? '/images/logos/scei-he-login-logo.png' 
      : '/images/logos/scei-login-logo.png';
    if (logoError) {
      // Fallback to text logo
      return (
        <div className={cn("w-24 h-20 md:w-28 md:h-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border border-white/20", className)}>
          <span className="text-white font-bold text-xl md:text-2xl tracking-wide">
            {user?.domain === 'scei-he' ? 'HE' : 'SC'}
          </span>
        </div>
      );
    }

    return (
      <div className={cn("w-24 h-20 md:w-28 md:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-slate-100 dark:to-white shadow-xl backdrop-blur-sm border border-gray-200/50 dark:border-slate-200/20", className)}>
        <Image
          src={logoPath}
          alt={user?.domain === 'scei-he' ? 'SCEI HE Logo' : 'SCEI Logo'}
          width={112}
          height={80}
          className="w-full h-full object-contain p-3"
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
        "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out",
        "w-64 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center hover:scale-[1.02] transition-all duration-300 group"
              title="Back to Dashboard"
            >
              <div className="relative">
                <LogoComponent className="w-24 h-20 md:w-28 md:h-20 group-hover:shadow-2xl group-hover:shadow-blue-500/25 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 -z-10 blur-xl"></div>
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
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
              isActive('/dashboard') ? "bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white font-semibold" : "text-gray-700 dark:text-gray-300"
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
                "flex items-center justify-between w-full px-3 py-2 text-left text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                pathname.startsWith('/units') ? "bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white font-semibold" : "text-gray-700 dark:text-gray-300"
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
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                      isActive(item.href) ? "bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white font-semibold" : "text-gray-600 dark:text-gray-400"
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
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                isActive('/users') ? "bg-blue-100 dark:bg-blue-600 text-blue-800 dark:text-white font-semibold" : "text-gray-700 dark:text-gray-300"
              )}
            >
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
          )}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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