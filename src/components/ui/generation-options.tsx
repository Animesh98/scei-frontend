import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Presentation, Clock, Sparkles } from 'lucide-react';

interface GenerationOptionsProps {
  type: 'study_guide' | 'presentation';
  onGenerate: (options: GenerationConfig) => void;
  isGenerating?: boolean;
  disabled?: boolean;
}

export interface GenerationConfig {
  generation_method: string;
  theme?: string;
  color_scheme?: string;
  user_timezone: string;
}

const GenerationOptions: React.FC<GenerationOptionsProps> = ({
  type,
  onGenerate,
  isGenerating = false,
  disabled = false
}) => {
  const [config, setConfig] = useState<GenerationConfig>({
    generation_method: type === 'study_guide' ? 'dynamic_chapters' : 'dynamic_slides',
    theme: 'madrid',
    color_scheme: 'default',
    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const generationMethods = {
    // Study Guide Methods
    dynamic_chapters: {
      name: 'Standard Generation',
      description: 'Generates comprehensive content with well-structured chapters',
      duration: '10-25 minutes',
      recommended: true
    },
    dynamic_multi_call: {
      name: 'Detailed Generation',
      description: 'More detailed analysis with multiple AI passes for enhanced quality',
      duration: '15-35 minutes',
      recommended: false
    },
    // Presentation Methods  
    dynamic_slides: {
      name: 'Standard Slides',
      description: 'Creates professional presentation slides with clear structure',
      duration: '8-20 minutes',
      recommended: true
    }
  };

  const presentationThemes = {
    madrid: 'Professional Madrid Theme',
    berlin: 'Clean Berlin Theme',
    warsaw: 'Corporate Warsaw Theme',
    copenhagen: 'Minimal Copenhagen Theme',
    singapore: 'Simple Singapore Theme'
  };

  const colorSchemes = {
    default: 'Blue-based Professional',
    educational: 'Green and Orange Educational',
    corporate: 'Gray and Blue Corporate',
    modern: 'Purple and Teal Modern'
  };

  const availableMethods = type === 'study_guide' 
    ? ['dynamic_chapters', 'dynamic_multi_call']
    : ['dynamic_slides', 'dynamic_multi_call'];

  const handleGenerate = () => {
    onGenerate(config);
  };

  const updateConfig = (key: keyof GenerationConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const selectedMethod = generationMethods[config.generation_method as keyof typeof generationMethods];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {type === 'study_guide' ? (
            <BookOpen className="h-5 w-5" />
          ) : (
            <Presentation className="h-5 w-5" />
          )}
          <span>
            {type === 'study_guide' ? 'Study Guide' : 'Presentation'} Configuration
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Generation Method */}
        <div className="space-y-3">
          <Label htmlFor="generation-method">Generation Method</Label>
          
          <Select
            value={config.generation_method}
            onValueChange={(value) => updateConfig('generation_method', value)}
            disabled={disabled || isGenerating}
          >
            <SelectTrigger id="generation-method" className="h-11">
              <SelectValue placeholder="Choose generation method" />
            </SelectTrigger>
            <SelectContent>
              {availableMethods.map((method) => {
                const methodInfo = generationMethods[method as keyof typeof generationMethods];
                return (
                  <SelectItem key={method} value={method} className="py-2">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{methodInfo.name}</span>
                      {methodInfo.recommended && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          Recommended
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Presentation-specific options */}
        {type === 'presentation' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theme Selection */}
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={config.theme}
                  onValueChange={(value) => updateConfig('theme', value)}
                  disabled={disabled || isGenerating}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Choose theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(presentationThemes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Scheme */}
              <div className="space-y-2">
                <Label htmlFor="color-scheme">Color Scheme</Label>
                <Select
                  value={config.color_scheme}
                  onValueChange={(value) => updateConfig('color_scheme', value)}
                  disabled={disabled || isGenerating}
                >
                  <SelectTrigger id="color-scheme">
                    <SelectValue placeholder="Choose color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorSchemes).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {type === 'study_guide' ? (
                <BookOpen className="mr-2 h-4 w-4" />
              ) : (
                <Presentation className="mr-2 h-4 w-4" />
              )}
              Generate {type === 'study_guide' ? 'Study Guide' : 'Presentation'}
            </>
          )}
        </Button>

      </CardContent>
    </Card>
  );
};

export default GenerationOptions;