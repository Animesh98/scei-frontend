'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Menu
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [unitsExpanded, setUnitsExpanded] = useState(true);

  const unitMenuItems = [
    { href: '/units/add', label: 'Add Unit', icon: Plus },
    { href: '/units/edit', label: 'Edit Unit', icon: Edit },
    { href: '/units/assessments', label: 'Generate Assessments', icon: FileText },
    { href: '/units/study-guides', label: 'Generate Study Guide', icon: BookOpen },
    { href: '/units/presentations', label: 'Generate Presentation', icon: Presentation },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

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
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.domain === 'scei-he' ? 'HE' : 'SC'}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {user?.domain === 'scei-he' ? 'SCEI HE' : 'SCEI'}
                </h2>
                <p className="text-xs text-gray-500">Education Institute</p>
              </div>
            </div>
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
        <nav className="p-4 space-y-2">
          {/* Units Section */}
          <div>
            <button
              onClick={() => setUnitsExpanded(!unitsExpanded)}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-left text-sm font-medium rounded-md hover:bg-gray-100",
                isActive('/units') ? "bg-primary-50 text-primary-800" : "text-gray-700"
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
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