# Questioning Assessment API Changes Documentation

## Overview
This document describes the changes made to the questioning assessment APIs to support the new 6 question types workflow. The frontend now uses a dropdown with specific question types instead of the previous element_id/criteria_id approach.

## What Changed

### Previous Workflow
- Frontend sent `element_id` and `criteria_id` as hash values
- These values were used to identify different question types
- Limited flexibility and not user-friendly

### New Workflow
- Frontend now sends a `question_type` field directly
- 6 specific question types are supported
- More intuitive and maintainable approach
- Backward compatibility maintained for existing data

## Supported Question Types

The following question types are now supported for questioning assessments:

1. **`direct_knowledge`** - Direct Knowledge Questions (Theory-Based)
2. **`procedural`** - Procedural Questions  
3. **`scenario_based`** - Scenario-Based Questions (Applied Knowledge)
4. **`reflection_based`** - Reflection-Based Questions
5. **`situational_judgement`** - Situational Judgement Questions
6. **`comparison_analysis`** - Comparison & Analysis Questions

## API Changes

### 1. Assessment Generation APIs

#### SCEI Assessment Generation
**Endpoint:** `POST /assessments/generate`

**Request Body Changes:**
```json
{
  "unit_id": "string",
  "type": "6703c26d78548ed67f9862a6", // questioning assessment type ID
  "question_type": "direct_knowledge", // NEW: Use this instead of element_id/criteria_id
  "suggestion": "string (optional)",
  "text": "string (optional)",
  "include_pc": true,
  "include_pe": true,
  "include_ke": true
}
```

**Previous Request (Still Supported for Backward Compatibility):**
```json
{
  "unit_id": "string",
  "type": "6703c26d78548ed67f9862a6",
  "element_index": 0, // Legacy
  "criteria_index": 0, // Legacy
  "suggestion": "string (optional)",
  "text": "string (optional)"
}
```

#### SCEI-HE Assessment Generation
**Endpoint:** `POST /assessments/he/generate`

**Request Body Changes:**
```json
{
  "unit_id": "string",
  "type": "string", // assessment type ID
  "question_type": "scenario_based", // NEW: Use this for questioning assessments
  "suggestion": "string (optional)"
}
```

### 2. Assessment Saving APIs

#### SCEI Assessment Save
**Endpoint:** `POST /assessments`

**Request Body Changes:**
```json
{
  "unit_id": "string",
  "type": "6703c26d78548ed67f9862a6", // questioning assessment type ID
  "question_type": "reflection_based", // NEW: Use this instead of element_id/criteria_id
  "text": "string" // generated assessment text
}
```

**Previous Request (Still Supported):**
```json
{
  "unit_id": "string",
  "type": "6703c26d78548ed67f9862a6",
  "element_id": 123, // Legacy hash
  "criteria_id": 456, // Legacy hash
  "text": "string"
}
```

#### SCEI-HE Assessment Save
**Endpoint:** `POST /assessments/he`

**Request Body Changes:**
```json
{
  "unit_id": "string",
  "type": "string", // assessment type ID
  "question_type": "situational_judgement", // NEW: For questioning assessments
  "text": "string", // assessment content
  "mappings": [] // optional mappings
}
```

### 3. Assessment Fetching APIs

#### SCEI Assessment Fetch
**Endpoint:** `GET /assessments/{unit_id}?type={assessment_type}&question_type={question_type}`

**New Query Parameters:**
- `question_type`: (NEW) Specify which question type to fetch
  - Values: `direct_knowledge`, `procedural`, `scenario_based`, `reflection_based`, `situational_judgement`, `comparison_analysis`

**Legacy Parameters (Still Supported):**
- `element_id`: Legacy hash identifier
- `criteria_id`: Legacy hash identifier

**Response Format:**
```json
{
  "status": true,
  "data": {
    "_id": "string",
    "generated_text": "string",
    "question_type": "direct_knowledge" // NEW: Included in response
  }
}
```

**When fetching all questioning assessments for a unit:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "string",
      "generated_text": "string",
      "question_type": "direct_knowledge",
      "question_type_name": "Direct Knowledge Questions" // Human-readable name
    },
    {
      "_id": "string", 
      "generated_text": "string",
      "question_type": "scenario_based",
      "question_type_name": "Scenario-Based Questions"
    }
  ]
}
```

#### SCEI-HE Assessment Fetch
**Endpoint:** `GET /assessments/he/{unit_id}?type={assessment_type}&question_type={question_type}`

**New Query Parameters:**
- `question_type`: (NEW) Specify which question type to fetch

**Response Format:**
```json
{
  "status": true,
  "data": {
    "_id": "string",
    "assessment": "string",
    "mappings": [],
    "question_type": "procedural" // NEW: Included in response
  }
}
```

## Frontend Integration Guide

### 1. Form Submission

When the user selects a question type from the dropdown:

```javascript
// Get selected question type from dropdown
const questionType = document.getElementById('question-type-dropdown').value;

// Generate assessment
const generateRequest = {
  unit_id: selectedUnitId,
  type: questioningAssessmentTypeId, // "6703c26d78548ed67f9862a6"
  question_type: questionType, // e.g., "direct_knowledge"
  suggestion: userSuggestion || ""
};

fetch('/assessments/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(generateRequest)
});
```

### 2. Save Assessment

```javascript
// Save the generated assessment
const saveRequest = {
  unit_id: selectedUnitId,
  type: questioningAssessmentTypeId,
  question_type: questionType, // Same as used in generation
  text: generatedAssessmentText
};

fetch('/assessments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(saveRequest)
});
```

### 3. Fetch Saved Assessments

```javascript
// Fetch specific question type
const url = `/assessments/${unitId}?type=${assessmentTypeId}&question_type=${questionType}`;
fetch(url).then(response => response.json());

// Fetch all question types for the unit
const allUrl = `/assessments/${unitId}?type=${assessmentTypeId}`;
fetch(allUrl).then(response => response.json());
```

### 4. Display Question Types

Update your dropdown HTML to include all supported question types:

```html
<select id="question-type-dropdown" name="question_type">
  <option value="direct_knowledge">Direct Knowledge Questions</option>
  <option value="procedural">Procedural Questions</option>
  <option value="scenario_based">Scenario-Based Questions</option>
  <option value="reflection_based">Reflection-Based Questions</option>
  <option value="situational_judgement">Situational Judgement Questions</option>
  <option value="comparison_analysis">Comparison & Analysis Questions</option>
</select>
```

## Migration Strategy

### Phase 1: Update Frontend (Immediate)
1. Update forms to include `question_type` field
2. Update generation requests to use `question_type`
3. Update save requests to use `question_type`
4. Update fetch requests to use `question_type` parameter

### Phase 2: Data Migration (Optional)
1. Existing assessments with `element_id`/`criteria_id` will continue to work
2. New assessments will use `question_type` field
3. Over time, legacy assessments can be migrated to use `question_type`

## Database Schema Changes

### SCEI Assessments Collection
```javascript
// New field added
{
  _id: ObjectId,
  unit_id: ObjectId,
  type: ObjectId,
  question_type: String, // NEW: "direct_knowledge", "procedural", etc.
  generated_text: String,
  // Legacy fields (still supported)
  element_id: Number, // Hash of question type (legacy)
  criteria_id: Number  // Additional identifier (legacy)
}
```

### SCEI-HE Assessment Mappings Collection
```javascript
// New field added
{
  _id: ObjectId,
  unit_id: ObjectId,
  assessment_type: ObjectId,
  question_type: String, // NEW: "direct_knowledge", "procedural", etc.
  assessment: String,
  mappings: Array,
  // Legacy fields (still supported)
  element_id: Number, // Hash of question type (legacy)
  criteria_id: Number  // Additional identifier (legacy)
}
```

## Error Handling

### Validation Errors
- If `question_type` is provided for non-questioning assessments, it will be ignored
- If neither `question_type` nor `element_id`/`criteria_id` is provided for questioning assessments, validation will fail
- Invalid question types will be handled gracefully

### Example Error Responses
```json
{
  "status": false,
  "message": "For questioning assessments, either question_type or element_id/criteria_id is required",
  "code": 400
}
```

## Testing Recommendations

### 1. Test Question Type Generation
```javascript
// Test each question type
const questionTypes = [
  'direct_knowledge',
  'procedural', 
  'scenario_based',
  'reflection_based',
  'situational_judgement',
  'comparison_analysis'
];

questionTypes.forEach(type => {
  // Test generation with each type
  // Test saving with each type
  // Test fetching with each type
});
```

### 2. Test Backward Compatibility
```javascript
// Test that legacy requests still work
const legacyRequest = {
  unit_id: unitId,
  type: questioningTypeId,
  element_id: 12345, // Legacy hash
  criteria_id: 67890, // Legacy hash
  text: assessmentText
};
// Should still work
```

### 3. Test Mixed Data
```javascript
// Test fetching when database has both new and legacy records
// Should return both with appropriate question_type_name mappings
```

## Key Benefits

1. **User-Friendly**: Question types are now human-readable
2. **Maintainable**: No more hash-based identifiers
3. **Flexible**: Easy to add new question types in the future
4. **Backward Compatible**: Existing assessments continue to work
5. **Consistent**: Same approach works for both SCEI and SCEI-HE

## Support

For any issues or questions regarding these API changes, please:
1. Check this documentation first
2. Test with the provided examples
3. Ensure you're using the correct question type values
4. Verify the assessment type ID for questioning assessments

## Version History

- **v1.0** (Current): Initial implementation with question_type support and backward compatibility