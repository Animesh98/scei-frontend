'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Code,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { LatexEditorState } from '@/types';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LatexEditorProps {
  content: string;
  isLoading?: boolean;
  isModified?: boolean;
  error?: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  onRenderPdf?: () => void;
  className?: string;
  fileName?: string;
}

const LatexEditor = ({
  content,
  isLoading = false,
  isModified = false,
  error,
  onContentChange,
  onSave,
  onRenderPdf,
  className = '',
  fileName = 'document.tex'
}: LatexEditorProps) => {
  const [lineCount, setLineCount] = useState(1);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update line count when content changes
  useEffect(() => {
    const lines = content.split('\n').length;
    setLineCount(lines);
  }, [content]);

  const handleDownload = () => {
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('LaTeX file downloaded');
    } catch (err) {
      toast.error('Failed to download LaTeX file');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('LaTeX code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleOpenOverleaf = () => {
    const overleafUrl = 'https://www.overleaf.com/docs';
    window.open(overleafUrl, '_blank');
    toast.info('Opening Overleaf documentation in new tab');
  };

  const getOverleafInstructions = () => (
    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
      <p className="font-medium">To edit in Overleaf:</p>
      <ol className="list-decimal list-inside space-y-1 ml-2">
        <li>Copy the LaTeX code using the copy button above</li>
        <li>Go to <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Overleaf.com</a></li>
        <li>Create a new project or open an existing one</li>
        <li>Paste the code into your main .tex file</li>
        <li>Compile and edit with full LaTeX support</li>
      </ol>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CardTitle className="text-lg flex items-center">
              <Code className="mr-2 h-5 w-5" />
              LaTeX Editor
            </CardTitle>
            {isModified && (
              <Badge variant="secondary" className="text-xs">
                Modified
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8"
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={!isModified || isLoading}
                className="h-8"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            )}
            {onRenderPdf && (
              <Button
                variant="default"
                size="sm"
                onClick={onRenderPdf}
                disabled={isLoading}
                className="h-8"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Rendering...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Render PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Editor Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
          <span>Lines: {lineCount}</span>
          <span>Characters: {content.length}</span>
        </div>

        {/* LaTeX Code Editor */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="font-mono text-sm min-h-[400px] resize-y"
            placeholder="Enter your LaTeX code here..."
            disabled={isLoading}
            style={{
              lineHeight: '1.5',
              tabSize: 2,
            }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-md">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-600 dark:text-gray-400" />
            </div>
          )}
        </div>

        {/* Overleaf Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Professional LaTeX Editing
                </h4>
              </div>
              {getOverleafInstructions()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenOverleaf}
              className="ml-4 shrink-0"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Overleaf
            </Button>
          </div>
        </div>

        {/* Quick LaTeX Tips */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick LaTeX Tips:
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <p>• Use <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">Ctrl/Cmd + A</code> to select all</p>
            <p>• Common commands: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">\section{'{}'}</code>, <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">\textbf{'{}'}</code>, <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">\emph{'{}'}</code></p>
            <p>• Math mode: <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">$...$</code> for inline, <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">$$...$$</code> for display</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LatexEditor;