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
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Assessments Generated',
      value: '0', // Placeholder - you can add API call for this
      icon: FileText,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      iconBg: 'bg-green-500',
    },
    {
      title: 'Study Guides',
      value: '0', // Placeholder - you can add API call for this
      icon: BookOpen,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      iconBg: 'bg-amber-500',
    },
    {
      title: 'Presentations',
      value: '0', // Placeholder - you can add API call for this
      icon: Presentation,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      iconBg: 'bg-purple-500',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Unit',
      description: 'Create a new educational unit',
      href: '/units/add',
      icon: Plus,
      lightColor: 'text-blue-600',
      darkColor: 'text-blue-400',
      lightBg: 'bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200',
      darkBg: 'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
    },
    {
      title: 'Generate Assessment',
      description: 'Create assessments for existing units',
      href: '/units/assessments',
      icon: FileText,
      lightColor: 'text-green-600',
      darkColor: 'text-green-400',
      lightBg: 'bg-white border border-gray-200 hover:bg-green-50 hover:border-green-200',
      darkBg: 'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
    },
    {
      title: 'Create Study Guide',
      description: 'Generate comprehensive study materials',
      href: '/units/study-guides',
      icon: BookOpen,
      lightColor: 'text-amber-600',
      darkColor: 'text-amber-400',
      lightBg: 'bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-200',
      darkBg: 'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
    },
    {
      title: 'Make Presentation',
      description: 'Create presentation slides',
      href: '/units/presentations',
      icon: Presentation,
      lightColor: 'text-purple-600',
      darkColor: 'text-purple-400',
      lightBg: 'bg-white border border-gray-200 hover:bg-purple-50 hover:border-purple-200',
      darkBg: 'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
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
              <Card key={stat.title} className={`border-0 shadow-lg ${stat.bgColor}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.iconBg} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${action.lightBg} ${action.darkBg} group h-32`}>
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                      <div className="flex items-center space-x-3 mb-3">
                        <action.icon className={`h-6 w-6 ${action.lightColor} ${action.darkColor} dark:text-white`} />
                        <h3 className={`font-semibold ${action.lightColor} ${action.darkColor} dark:text-white text-sm`}>{action.title}</h3>
                      </div>
                      <p className={`text-xs text-gray-600 dark:text-white/90`}>{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Units */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Units</h2>
              <Button variant="outline" size="sm" asChild className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Link href="/units">View All</Link>
              </Button>
            </div>
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-0">
                {unitsData?.rows && unitsData.rows.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {unitsData.rows.slice(0, 5).map((unit) => (
                      <div key={unit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{unit.unit_code}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{unit.unit_title}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" asChild className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                              <Link href={`/units/edit?id=${unit.id}`}>Edit</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p>No units found. Create your first unit to get started.</p>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" asChild>
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