'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Code } from 'lucide-react';
import { ViewMode } from '@/types';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
  disabled?: boolean;
}

const ViewToggle = ({ 
  currentView, 
  onViewChange, 
  className = '',
  disabled = false 
}: ViewToggleProps) => {
  return (
    <Card className={cn("w-fit", className)}>
      <CardContent className="p-2">
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('pdf')}
            disabled={disabled}
            className={cn(
              "h-8 px-3 text-sm font-medium transition-all",
              currentView === 'pdf' 
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" 
                : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            <FileText className="mr-2 h-4 w-4" />
            View PDF
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('latex')}
            disabled={disabled}
            className={cn(
              "h-8 px-3 text-sm font-medium transition-all",
              currentView === 'latex' 
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600" 
                : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            )}
          >
            <Code className="mr-2 h-4 w-4" />
            View LaTeX
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewToggle;