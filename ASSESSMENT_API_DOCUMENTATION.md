# Assessment Generation API Documentation

## Overview

Your backend has **two main assessment systems**:
1. **SCEI Assessments** - For SCEI units with component filtering and questioning types
2. **Higher Education (HE) Assessments** - For university-level units

---

## API Endpoints

### 1. SCEI Assessment Generation
```
POST /assessments/generate
```

### 2. Higher Education Assessment Generation  
```
POST /assessments/he/generate
```

---

## SCEI Assessment Generation (Main System)

### Request Format
```json
{
  "unit_id": "string (required)",
  "type": "string (required) - Assessment Type ID",
  "question_type": "string (optional) - For questioning assessments only",
  "element_index": "number (optional) - Legacy support",
  "criteria_index": "number (optional) - Legacy support", 
  "include_pc": "boolean (optional, default: true)",
  "include_pe": "boolean (optional, default: true)", 
  "include_ke": "boolean (optional, default: true)",
  "suggestion": "string (optional) - Custom instructions/requirements"
}
```

### Critical Assessment Type Distinction

#### 🔍 Questioning Assessment Type (ID: "6703c26d78548ed67f9862a6")

**Special behavior when `type === "6703c26d78548ed67f9862a6"`:**

- **Uses ALL PCs, PEs, KEs together** (component filtering ignored)
- **Requires `question_type` parameter**
- **Generates 5 questions of specified type**
- **Different response format**

**Available Question Types:**
```javascript
const questionTypes = {
  "direct_knowledge": "Direct Knowledge Questions (Theory-Based)",
  "procedural": "Procedural Questions", 
  "scenario_based": "Scenario-Based Questions (Applied Knowledge)",
  "reflection_based": "Reflection-Based Questions",
  "situational_judgement": "Situational Judgement Questions", 
  "comparison_analysis": "Comparison/Analysis Questions"
}
```

**Example Request for Questioning:**
```json
{
  "unit_id": "507f1f77bcf86cd799439011",
  "type": "6703c26d78548ed67f9862a6",
  "question_type": "scenario_based",
  "suggestion": "Focus on workplace safety scenarios"
}
```

#### 📝 Other Assessment Types (Non-Questioning)

**For all other assessment type IDs:**

- **Component filtering applies** (`include_pc`, `include_pe`, `include_ke`)
- **No `question_type` needed**
- **Uses assessment type's `support_text`**
- **Different response format**

**Example Request for Non-Questioning:**
```json
{
  "unit_id": "507f1f77bcf86cd799439011", 
  "type": "other_assessment_type_id",
  "include_pc": true,
  "include_pe": false,
  "include_ke": true,
  "suggestion": "Include case study examples"
}
```

### Response Formats

#### Questioning Assessment Response
```json
{
  "status": true,
  "data": {
    "text": {
      "output": [
        {
          "question": "Question text here",
          "answer": "Comprehensive answer/sample response here", 
          "references": ["PC1.1", "PE1.2", "KE2.1"],
          "context": "Additional context or explanation if needed"
        },
        {
          "question": "Question text here",
          "answer": "Comprehensive answer/sample response here", 
          "references": ["PC2.1", "PE1.1", "KE1.1"],
          "context": "Additional context or explanation if needed"
        }
        // ... 3 more questions (5 total)
      ]
    }
  }
}
```

#### Non-Questioning Assessment Response
```json
{
  "status": true,
  "data": {
    "text": {
      "output": "Generated assessment content here",
      "mapping": {
        "course_learning_outcome": "1, 2",
        "unit_learning_outcome": "1, 3", 
        "acecqa_content": "1.1, 1.2, 1.3",
        "industry_standard": "1, 2",
        "graduate_attribute": "1, 2"
      }
    }
  }
}
```

---

## Higher Education Assessment Generation

### Request Format
```json
{
  "unit_id": "string (required)",
  "type": "string (required) - Assessment Type ID",
  "suggestion": "string (optional) - Custom instructions", 
  "text": "string (optional) - Previous questions for iteration"
}
```

### Response Format
```json
{
  "status": true,
  "data": {
    "text": "Generated assessment content as string"
  }
}
```

---

## Suggestions System

### How Suggestions Work
1. **Optional parameter** in both SCEI and HE APIs
2. **Appended to generation prompt** as additional instructions
3. **Examples:**
   - `"Focus on workplace safety scenarios"`
   - `"Include more practical examples"`
   - `"Make questions more challenging"`
   - `"Add case study components"`

### Suggestion Integration
- For **questioning assessments**: Added to question type prompt
- For **other assessments**: Added to general assessment prompt
- **Combined with saved samples** for better quality

---

## Component Filtering (PE/PC/KE)

### Only applies to NON-questioning assessments

```javascript
// Component filtering parameters
{
  "include_pc": true,   // Performance Criteria
  "include_pe": false,  // Performance Evidence  
  "include_ke": true    // Knowledge Evidence
}
```

### ⚠️ Important Notes
- **Questioning assessments IGNORE these parameters**
- **Always uses ALL components for questioning type**
- **Backend filters unit content based on selections**
- **Default: all true if not specified**

---

## API Integration Logic for Frontend

```javascript
function generateAssessment(requestData) {
  const isQuestioningType = requestData.type === "6703c26d78548ed67f9862a6";
  
  if (isQuestioningType) {
    // Questioning assessment - requires question_type
    if (!requestData.question_type) {
      throw new Error("question_type is required for questioning assessments");
    }
    
    // Component filtering ignored for questioning
    delete requestData.include_pc;
    delete requestData.include_pe; 
    delete requestData.include_ke;
    
    return callAPI('/assessments/generate', requestData);
  } else {
    // Non-questioning assessment
    // Remove question_type if present
    delete requestData.question_type;
    
    // Component filtering applies
    requestData.include_pc = requestData.include_pc ?? true;
    requestData.include_pe = requestData.include_pe ?? true;
    requestData.include_ke = requestData.include_ke ?? true;
    
    return callAPI('/assessments/generate', requestData);
  }
}

function generateHEAssessment(requestData) {
  // HE assessments - simpler structure
  return callAPI('/assessments/he/generate', requestData);
}
```

---

## Response Parsing

```javascript
function parseAssessmentResponse(response, isQuestioningType) {
  if (!response.status) {
    throw new Error(response.message || 'Assessment generation failed');
  }
  
  if (isQuestioningType) {
    // Questioning response has array of questions
    const questions = JSON.parse(response.data.text).output;
    return questions.map(q => ({
      question: q.question,
      answer: q.answer,
      references: q.references,
      context: q.context
    }));
  } else {
    // Non-questioning response has content + mappings
    const result = JSON.parse(response.data.text);
    return {
      content: result.output,
      mappings: result.mapping
    };
  }
}
```

---

## Error Handling

### Common Error Responses
```json
{
  "status": false,
  "message": "Unit not found",
  "code": 404
}
```

```json
{
  "status": false,
  "message": "Assessment type not found", 
  "code": 404
}
```

```json
{
  "status": false,
  "message": "Something went wrong!",
  "code": 500
}
```

---

## Complete Frontend Integration Example

```javascript
class AssessmentAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async generateSCEIAssessment(unitId, assessmentTypeId, options = {}) {
    const isQuestioningType = assessmentTypeId === "6703c26d78548ed67f9862a6";
    
    const requestData = {
      unit_id: unitId,
      type: assessmentTypeId,
      suggestion: options.suggestion || ""
    };

    if (isQuestioningType) {
      if (!options.questionType) {
        throw new Error("Question type is required for questioning assessments");
      }
      requestData.question_type = options.questionType;
    } else {
      // Add component filtering for non-questioning assessments
      requestData.include_pc = options.includePC ?? true;
      requestData.include_pe = options.includePE ?? true;
      requestData.include_ke = options.includeKE ?? true;
    }

    const response = await fetch(`${this.baseURL}/assessments/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Assessment generation failed');
    }

    // Parse response based on assessment type
    if (isQuestioningType) {
      const parsedResponse = JSON.parse(result.data.text);
      return {
        type: 'questioning',
        questions: parsedResponse.output
      };
    } else {
      const parsedResponse = JSON.parse(result.data.text);
      return {
        type: 'standard',
        content: parsedResponse.output,
        mappings: parsedResponse.mapping
      };
    }
  }

  async generateHEAssessment(unitId, assessmentTypeId, options = {}) {
    const requestData = {
      unit_id: unitId,
      type: assessmentTypeId,
      suggestion: options.suggestion || "",
      text: options.previousText || ""
    };

    const response = await fetch(`${this.baseURL}/assessments/he/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'Assessment generation failed');
    }

    return {
      type: 'he',
      content: result.data.text
    };
  }
}

// Usage Examples
const api = new AssessmentAPI('https://your-api-domain.com');

// Generate questioning assessment
const questioningResult = await api.generateSCEIAssessment(
  "507f1f77bcf86cd799439011", 
  "6703c26d78548ed67f9862a6",
  {
    questionType: "scenario_based",
    suggestion: "Focus on workplace safety"
  }
);

// Generate non-questioning assessment with component filtering
const standardResult = await api.generateSCEIAssessment(
  "507f1f77bcf86cd799439011",
  "other_assessment_type_id",
  {
    includePC: true,
    includePE: false, 
    includeKE: true,
    suggestion: "Include case studies"
  }
);

// Generate HE assessment
const heResult = await api.generateHEAssessment(
  "507f1f77bcf86cd799439011",
  "he_assessment_type_id",
  {
    suggestion: "Focus on critical thinking"
  }
);
```

---

## Critical Points for Frontend Implementation

1. **Assessment Type Check**: Always check if `type === "6703c26d78548ed67f9862a6"` to determine API behavior

2. **Question Types**: Only show question type dropdown for questioning assessments

3. **Component Filtering**: Only show PE/PC/KE toggles for non-questioning assessments  

4. **Response Parsing**: Different JSON structures for questioning vs non-questioning

5. **Error Handling**: Backend returns 404 for missing units/assessment types, 500 for server errors

6. **Suggestions**: Always optional, but very useful for customization

7. **HE vs SCEI**: Completely separate endpoints with different request/response formats

8. **Question Type Validation**: Validate question types against the allowed list before sending

9. **Response Content**: The `data.text` field may need JSON parsing depending on assessment type

10. **Default Values**: Always provide sensible defaults for optional parameters

---

## Quick Reference

### Questioning Assessment (ID: 6703c26d78548ed67f9862a6)
- ✅ Requires: `unit_id`, `type`, `question_type`
- ✅ Optional: `suggestion`
- ❌ Ignores: `include_pc`, `include_pe`, `include_ke`
- 📤 Returns: Array of 5 question objects

### Non-Questioning Assessment (All other IDs)
- ✅ Requires: `unit_id`, `type`
- ✅ Optional: `include_pc`, `include_pe`, `include_ke`, `suggestion`
- ❌ Ignores: `question_type`
- 📤 Returns: Content string + mappings object

### HE Assessment
- ✅ Requires: `unit_id`, `type`
- ✅ Optional: `suggestion`, `text`
- 📤 Returns: Content string only 