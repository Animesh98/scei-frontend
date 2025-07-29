export interface AssessmentContent {
  output: string;
  mapping?: {
    course_learning_outcome?: string;
    unit_learning_outcome?: string;
    acecqa_content?: string;
    industry_standard?: string;
    graduate_attribute?: string;
    benchmark?: string;
    performance_criteria?: string;
    performance_evidence?: string;
    knowledge_evidence?: string;
  };
}

export interface QuestionItem {
  question: string;
  answer: string;
  references?: string[];
  context?: string;
}

export interface AssessmentHistoryItem {
  id: string;
  unitId: string;
  unitCode: string;
  unitTitle: string;
  assessmentType: string;
  questionType?: string;
  content: string;
  parsedContent: AssessmentContent;
  timestamp: number;
  customSuggestion?: string;
}

// Parse assessment content from API response
export function parseAssessmentContent(rawContent: string): AssessmentContent {
  if (!rawContent) {
    return { output: 'No content available.' };
  }

  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(rawContent);
    
    // Handle questioning format with array of questions
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.output)) {
      console.log('Parsing questioning format:', parsed);
      const formattedOutput = formatQuestioningAssessment(parsed.output, parsed.mapping);
      return {
        output: formattedOutput,
        mapping: parsed.mapping || undefined,
      };
    }
    
    // Handle SCEI-HE format where output is a structured object
    if (parsed && typeof parsed === 'object' && parsed.output && typeof parsed.output === 'object' && !Array.isArray(parsed.output)) {
      console.log('Parsing SCEI-HE structured format:', parsed);
      const formattedOutput = formatStructuredAssessment(parsed.output);
      return {
        output: formattedOutput,
        mapping: parsed.mapping || undefined,
      };
    }
    
    // Handle regular format where output is a string
    if (parsed && typeof parsed === 'object' && parsed.output) {
      return {
        output: String(parsed.output),
        mapping: parsed.mapping || undefined,
      };
    }
    
    // Handle case where parsed object doesn't have output field
    if (parsed && typeof parsed === 'object') {
      return {
        output: String(parsed.text || parsed.content || JSON.stringify(parsed, null, 2)),
        mapping: parsed.mapping || undefined,
      };
    }
    
    // If parsed is not an object, treat as plain text
    return {
      output: String(parsed),
    };
  } catch (error) {
    console.warn('Failed to parse assessment content as JSON:', error);
    // If not JSON, treat as plain text
    return {
      output: String(rawContent),
    };
  }
}

// Format questioning assessment array into readable markdown
function formatQuestioningAssessment(questions: QuestionItem[], mapping?: any): string {
  if (!Array.isArray(questions) || questions.length === 0) {
    return 'No questions available.';
  }

  let markdown = '# Assessment Questions\n\n';
  
  questions.forEach((q, index) => {
    if (!q.question || !q.answer) {
      return; // Skip invalid questions
    }
    
    markdown += `## Question ${index + 1}\n\n`;
    markdown += `**${q.question}**\n\n`;
    
    if (q.context) {
      markdown += `> *${q.context}*\n\n`;
    }
    
    markdown += `### Answer\n\n`;
    markdown += `${q.answer}\n\n`;
    
    if (q.references && Array.isArray(q.references) && q.references.length > 0) {
      markdown += `### References\n\n`;
      markdown += `- ${q.references.join('\n- ')}\n\n`;
    }
    
    // Only add separator if not the last question
    if (index < questions.length - 1) {
      markdown += '---\n\n';
    }
  });
  
  // Add mapping section if available
  if (mapping && typeof mapping === 'object') {
    markdown += '\n\n## Assessment Mapping\n\n';
    
    if (mapping.performance_criteria) {
      markdown += `**Performance Criteria:** ${mapping.performance_criteria}\n\n`;
    }
    
    if (mapping.performance_evidence) {
      markdown += `**Performance Evidence:** ${mapping.performance_evidence}\n\n`;
    }
    
    if (mapping.knowledge_evidence) {
      markdown += `**Knowledge Evidence:** ${mapping.knowledge_evidence}\n\n`;
    }
  }
  
  return markdown;
}

// Format SCEI-HE structured assessment into readable markdown
function formatStructuredAssessment(data: any): string {
  if (!data) {
    return 'No structured assessment data available.';
  }

  let markdown = '# Assessment Task\n\n';

  // Handle new assessment structure (assessment.title, assessment.description, etc.)
  if (data.assessment && typeof data.assessment === 'object') {
    const assessment = data.assessment;
    
    // Title
    if (assessment.title) {
      markdown += `## ${assessment.title}\n\n`;
    }
    
    // Description
    if (assessment.description) {
      markdown += '## Description\n\n';
      markdown += `${assessment.description}\n\n`;
    }
    
    // Tasks
    if (assessment.tasks && Array.isArray(assessment.tasks)) {
      markdown += '## Assessment Tasks\n\n';
      assessment.tasks.forEach((task: any, index: number) => {
        if (task.topic) {
          markdown += `### ${task.topic}\n\n`;
        } else {
          markdown += `### Task ${index + 1}\n\n`;
        }
        
        if (task.instruction) {
          markdown += `**Instructions:** ${task.instruction}\n\n`;
        }
        
        if (task.requirements && Array.isArray(task.requirements)) {
          markdown += '**Requirements:**\n';
          task.requirements.forEach((req: string) => {
            markdown += `- ${req}\n`;
          });
          markdown += '\n';
        }
        
        if (task.word_count) {
          markdown += `**Word Count:** ${task.word_count} words\n\n`;
        }
      });
    }
    
    // Format
    if (assessment.format) {
      markdown += '## Format Requirements\n\n';
      markdown += `${assessment.format}\n\n`;
    }
    
    // Submission Guidelines
    if (assessment.submission_guidelines) {
      markdown += '## Submission Guidelines\n\n';
      markdown += `${assessment.submission_guidelines}\n\n`;
    }
    
    // Marking Criteria
    if (assessment.marking_criteria && assessment.marking_criteria.criteria) {
      markdown += '## Marking Criteria\n\n';
      assessment.marking_criteria.criteria.forEach((criterion: any) => {
        if (criterion.description && criterion.weighting) {
          markdown += `### ${criterion.description} (${criterion.weighting}%)\n\n`;
          
          if (criterion.standards && Array.isArray(criterion.standards)) {
            criterion.standards.forEach((standard: string, index: number) => {
              const grade = ['High Distinction', 'Distinction', 'Credit', 'Pass', 'Fail'][index] || `Level ${index + 1}`;
              markdown += `- **${grade}:** ${standard}\n`;
            });
            markdown += '\n';
          }
        }
      });
    }
  }
  
  // Handle original assessment structure (assessment_scenario, participant_profiles, etc.)
  else {
    // Assessment Scenario
    if (data.assessment_scenario) {
      markdown += '## Assessment Scenario\n\n';
      markdown += `${data.assessment_scenario}\n\n`;
    }

    // Participant Profiles
    if (data.participant_profiles && Array.isArray(data.participant_profiles)) {
      markdown += '## Participant Profiles\n\n';
      data.participant_profiles.forEach((profile: any, index: number) => {
        markdown += `### ${profile.name || `Participant ${index + 1}`}\n\n`;
        if (profile.role) markdown += `**Role:** ${profile.role}\n\n`;
        if (profile.age) markdown += `**Age:** ${profile.age}\n\n`;
        if (profile.background) markdown += `**Background:** ${profile.background}\n\n`;
        if (profile.challenge) markdown += `**Challenge:** ${profile.challenge}\n\n`;
      });
    }

    // Assessment Tasks
    if (data.assessment_tasks && Array.isArray(data.assessment_tasks)) {
      markdown += '## Assessment Tasks\n\n';
      data.assessment_tasks.forEach((task: any, index: number) => {
        markdown += `### Task ${index + 1}\n\n`;
        if (task.task) markdown += `**Task:** ${task.task}\n\n`;
        if (task.requirements) markdown += `**Requirements:** ${task.requirements}\n\n`;
        if (task.word_count) markdown += `**Word Count:** ${task.word_count} words\n\n`;
      });
    }

    // Professional Challenges
    if (data.professional_challenges && Array.isArray(data.professional_challenges)) {
      markdown += '## Professional Challenges\n\n';
      data.professional_challenges.forEach((challenge: string) => {
        markdown += `- ${challenge}\n`;
      });
      markdown += '\n';
    }

    // Instructions
    if (data.instructions) {
      markdown += '## Instructions\n\n';
      markdown += `${data.instructions}\n\n`;
    }

    // Marking Criteria (original format)
    if (data.marking_criteria && data.marking_criteria.criteria) {
      markdown += '## Marking Criteria\n\n';
      data.marking_criteria.criteria.forEach((criterion: any) => {
        if (criterion.description && criterion.weighting) {
          markdown += `- **${criterion.description}** (${criterion.weighting})\n`;
        }
      });
      markdown += '\n';
    }

    // Sample Response Outline
    if (data.sample_response_outline) {
      markdown += '## Sample Response Outline\n\n';
      Object.entries(data.sample_response_outline).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        markdown += `**${formattedKey}:** ${value}\n\n`;
      });
    }

    // Integrated Standards
    if (data.integrated_standards) {
      markdown += '## Integrated Standards\n\n';
      Object.entries(data.integrated_standards).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (Array.isArray(value)) {
          markdown += `**${formattedKey}:**\n`;
          value.forEach((item: string) => {
            markdown += `- ${item}\n`;
          });
          markdown += '\n';
        } else {
          markdown += `**${formattedKey}:** ${value}\n\n`;
        }
      });
    }
  }
  
  return markdown;
}

// Format content for display
export function formatAssessmentContent(content: AssessmentContent): string {
  let formatted = content.output || 'No content available';
  
  // Add mapping information if available
  if (content.mapping && typeof content.mapping === 'object') {
    formatted += '\n\n## Assessment Mapping\n\n';
    
    // SCEI-HE mapping fields
    if (content.mapping.course_learning_outcome) {
      formatted += `**Course Learning Outcome:** ${content.mapping.course_learning_outcome}\n\n`;
    }
    
    if (content.mapping.unit_learning_outcome) {
      formatted += `**Unit Learning Outcome:** ${content.mapping.unit_learning_outcome}\n\n`;
    }
    
    if (content.mapping.graduate_attribute) {
      formatted += `**Graduate Attribute:** ${content.mapping.graduate_attribute}\n\n`;
    }
    
    if (content.mapping.acecqa_content) {
      formatted += `**ACECQA Content:** ${content.mapping.acecqa_content}\n\n`;
    }
    
    if (content.mapping.industry_standard) {
      formatted += `**Industry Standard:** ${content.mapping.industry_standard}\n\n`;
    }
    
    if (content.mapping.benchmark) {
      formatted += `**Benchmark:** ${content.mapping.benchmark}\n\n`;
    }
    
    // SCEI mapping fields
    if (content.mapping.performance_criteria) {
      formatted += `**Performance Criteria:** ${content.mapping.performance_criteria}\n\n`;
    }
    
    if (content.mapping.performance_evidence) {
      formatted += `**Performance Evidence:** ${content.mapping.performance_evidence}\n\n`;
    }
    
    if (content.mapping.knowledge_evidence) {
      formatted += `**Knowledge Evidence:** ${content.mapping.knowledge_evidence}\n\n`;
    }
  }
  
  return formatted;
}

// Assessment History Management
const STORAGE_KEY = 'assessment-history';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent localStorage bloat

export function saveAssessmentToHistory(
  unitId: string,
  unitCode: string,
  unitTitle: string,
  assessmentType: string,
  questionType: string | undefined,
  rawContent: string,
  customSuggestion?: string
): string {
  const parsedContent = parseAssessmentContent(rawContent);
  const historyItem: AssessmentHistoryItem = {
    id: generateAssessmentId(),
    unitId,
    unitCode,
    unitTitle,
    assessmentType,
    questionType,
    content: rawContent,
    parsedContent,
    timestamp: Date.now(),
    customSuggestion,
  };

  const history = getAssessmentHistory();
  
  // Add new item to the beginning
  history.unshift(historyItem);
  
  // Keep only the most recent items
  const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.warn('Failed to save assessment to history:', error);
  }

  return historyItem.id;
}

export function getAssessmentHistory(): AssessmentHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('Failed to load assessment history:', error);
    return [];
  }
}

export function getAssessmentById(id: string): AssessmentHistoryItem | null {
  const history = getAssessmentHistory();
  return history.find(item => item.id === id) || null;
}

export function deleteAssessmentFromHistory(id: string): void {
  const history = getAssessmentHistory();
  const filtered = history.filter(item => item.id !== id);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('Failed to delete assessment from history:', error);
  }
}

export function clearAssessmentHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear assessment history:', error);
  }
}

// Get filtered history for specific unit and assessment type
export function getFilteredAssessmentHistory(
  unitId?: string,
  assessmentType?: string
): AssessmentHistoryItem[] {
  const history = getAssessmentHistory();
  
  return history.filter(item => {
    if (unitId && item.unitId !== unitId) return false;
    if (assessmentType && item.assessmentType !== assessmentType) return false;
    return true;
  });
}

// Generate unique assessment ID
function generateAssessmentId(): string {
  return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Format timestamp for display
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
} 