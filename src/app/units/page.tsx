'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/auth-guard';
import MainLayout from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnits } from '@/hooks/use-api';
import LoadingSpinner from '@/components/ui/loading-spinner';
import EmptyState from '@/components/ui/empty-state';
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  FileText,
  Presentation,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const UnitsPage = () => {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const limit = 10;
  const { data: unitsData, isLoading } = useUnits(page, limit);

  const filteredUnits = unitsData?.rows?.filter(unit =>
    unit.unit_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.unit_title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((unitsData?.count || 0) / limit);

  if (isLoading) {
    return (
      <AuthGuard>
        <MainLayout 
          title="All Units" 
          subtitle="View and manage all educational units"
          showBackButton={true}
          backHref="/dashboard"
        >
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <MainLayout 
        title="All Units" 
        subtitle="View and manage all educational units"
        showBackButton={true}
        backHref="/dashboard"
        actions={
          <Button asChild>
            <Link href="/units/add">
              <Plus className="h-4 w-4 mr-2" />
              Add New Unit
            </Link>
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Search */}
          <div className="flex items-center space-x-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search units..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Units Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Units ({unitsData?.count || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredUnits.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={<BookOpen />}
                    title="No units found"
                    description={searchTerm ? "Try adjusting your search terms" : "Get started by creating your first unit"}
                    action={
                      !searchTerm
                        ? {
                            label: "Add New Unit",
                            onClick: () => {
                              window.location.href = "/units/add";
                            },
                          }
                        : undefined
                    }
                  />
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Unit Code</TableHead>
                          <TableHead>Unit Title</TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnits.map((unit) => (
                          <TableRow key={unit.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              {unit.unit_code}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate" title={unit.unit_title}>
                                {unit.unit_title}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={unit.domain === 'scei-he' ? 'secondary' : 'default'}>
                                {unit.domain === 'scei-he' ? 'SCEI HE' : 'SCEI'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/units/edit?id=${unit.id}`}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Unit
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/units/assessments?unit=${unit.id}`}>
                                      <FileText className="h-4 w-4 mr-2" />
                                      Generate Assessment
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/units/study-guides?unit=${unit.id}`}>
                                      <BookOpen className="h-4 w-4 mr-2" />
                                      Generate Study Guide
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/units/presentations?unit=${unit.id}`}>
                                      <Presentation className="h-4 w-4 mr-2" />
                                      Generate Presentation
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4 p-4">
                    {filteredUnits.map((unit) => (
                      <Card key={unit.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">{unit.unit_code}</h3>
                              <p className="text-sm text-gray-600 mt-1">{unit.unit_title}</p>
                            </div>
                            <Badge variant={unit.domain === 'scei-he' ? 'secondary' : 'default'}>
                              {unit.domain === 'scei-he' ? 'SCEI HE' : 'SCEI'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/units/edit?id=${unit.id}`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/units/assessments?unit=${unit.id}`}>
                                <FileText className="h-4 w-4 mr-1" />
                                Assessment
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/units/study-guides?unit=${unit.id}`}>
                                <BookOpen className="h-4 w-4 mr-1" />
                                Study Guide
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/units/presentations?unit=${unit.id}`}>
                                <Presentation className="h-4 w-4 mr-1" />
                                Presentation
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {page * limit + 1} to {Math.min((page + 1) * limit, unitsData?.count || 0)} of {unitsData?.count || 0} units
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <span className="text-sm text-gray-500">
                          Page {page + 1} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                          disabled={page >= totalPages - 1}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </AuthGuard>
  );
};

export default UnitsPage;