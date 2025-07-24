'use client';

import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useUnits } from '@/hooks/use-api';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Presentation,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { data: unitsData } = useUnits(0, 10);

  const stats = [
    {
      title: 'Total Units',
      value: unitsData?.count || 0,
      icon: BookOpen,
      color: 'text-primary-600',
      bgColor: 'bg-primary-100',
    },
    {
      title: 'Assessments Generated',
      value: '0', // Placeholder - you can add API call for this
      icon: FileText,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-100',
    },
    {
      title: 'Study Guides',
      value: '0', // Placeholder - you can add API call for this
      icon: BookOpen,
      color: 'text-accent-600',
      bgColor: 'bg-accent-100',
    },
    {
      title: 'Presentations',
      value: '0', // Placeholder - you can add API call for this
      icon: Presentation,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Unit',
      description: 'Create a new educational unit',
      href: '/units/add',
      icon: Plus,
      color: 'text-primary-600',
    },
    {
      title: 'Generate Assessment',
      description: 'Create assessments for existing units',
      href: '/units/assessments',
      icon: FileText,
      color: 'text-secondary-600',
    },
    {
      title: 'Create Study Guide',
      description: 'Generate comprehensive study materials',
      href: '/units/study-guides',
      icon: BookOpen,
      color: 'text-accent-600',
    },
    {
      title: 'Make Presentation',
      description: 'Create presentation slides',
      href: '/units/presentations',
      icon: Presentation,
      color: 'text-purple-600',
    },
  ];

  return (
    <AuthGuard>
      <MainLayout 
        title={`Welcome back, ${user?.firstName}!`}
        subtitle={`${user?.domain === 'scei-he' ? 'SCEI Higher Education' : 'Southern Cross Education Institute'} Dashboard`}
      >
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
                  <Link href={action.href}>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-3">
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                        <h3 className="font-medium text-gray-900">{action.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Units */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Units</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/units">View All</Link>
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {unitsData?.rows && unitsData.rows.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {unitsData.rows.slice(0, 5).map((unit) => (
                      <div key={unit.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{unit.unit_code}</h3>
                            <p className="text-sm text-gray-600">{unit.unit_title}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/units/edit?id=${unit.id}`}>Edit</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No units found. Create your first unit to get started.</p>
                    <Button className="mt-4" asChild>
                      <Link href="/units/add">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Unit
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default DashboardPage;