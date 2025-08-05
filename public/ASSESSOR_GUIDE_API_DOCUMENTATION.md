# Professional Assessor Guide API

> **Enterprise-grade** assessor guide generation with **AI-powered content processing** and **professional PDF output**

## 🎯 Overview

The Professional Assessor Guide API generates comprehensive, ready-to-use assessor guides in PDF format with:
- **AI-powered content processing** - Converts markdown to professional formatting
- **Assessment-specific rubrics** - Tailored evaluation criteria for each assessment type
- **Professional PDF design** - Modern layout with table of contents and structured sections
- **Smart content extraction** - Processes complex database content automatically

## ✨ Key Features

### 🤖 **AI-Enhanced Content Processing**
- Automatically converts markdown formatting to professional PDF layout
- Extracts content from complex JSON database structures
- Processes assessment questions, instructions, and requirements
- Maintains formatting quality and readability

### 📊 **Assessment-Specific Rubrics**
- **Tailored rubrics** for each assessment type (Case Study, Report, Work Placement, Lab Skills)
- **OpenAI-powered generation** for content-specific evaluation criteria
- **Satisfactory/Not Yet Satisfactory** format for clear assessment
- **Fallback system** ensures reliable rubric generation

### 🎨 **Professional PDF Design**
- **Modern cover page** with unit information and assessment types
- **Table of contents** with numbered sections
- **Professional typography** with strategic color usage
- **Structured layout**: Unit Overview, Performance Criteria, Knowledge Evidence, Assessment Rubrics, Guidelines

### 🔧 **Smart Assessment Processing**
- Supports multiple assessment types per unit
- Processes complex assessment content from database
- Generates practical assessor guidance
- Creates ready-to-use evaluation tools

---

## 📡 API Endpoints

### 1. List All Assessor Guides
```http
GET /assessor-guides
```

**Query Parameters:**
- `limit` (optional) - Items per page (default: 10, max: 100)
- `page` (optional) - Page number (default: 0)

**Response:**
```json
{
  "status": true,
  "data": {
    "items": [
      {
        "unit_code": "TEST104",
        "unit_title": "Support individuals with mental health issues",
        "has_pdf_content": true,
        "status": "generated",
        "generated_at": "2025-08-05T05:48:55.964Z",
        "assessment_types_count": 4
      }
    ],
    "total": 45,
    "page": 0,
    "limit": 10
  }
}
```

### 2. Get Available Assessment Types
```http
GET /assessor-guides/{unit_code}/assessment-types
```

**Path Parameters:**
- `unit_code` - Unit code (e.g., "TEST104", "CHCECE001")

**Response:**
```json
{
  "status": true,
  "data": {
    "unit_code": "TEST104",
    "unit_title": "Support individuals with mental health issues",
    "available_assessment_types": [
      {
        "assessment_type_id": "6703c26d78548ed67f9862a7",
        "assessment_name": "Case study",
        "available": true,
        "has_content": true
      },
      {
        "assessment_type_id": "6703c26d78548ed67f9862a9", 
        "assessment_name": "Work placement & reflection",
        "available": true,
        "has_content": true
      },
      {
        "assessment_type_id": "6703c26d78548ed67f9862ab",
        "assessment_name": "Report", 
        "available": true,
        "has_content": true
      },
      {
        "assessment_type_id": "68340310c13f4ee9cad3a2c6",
        "assessment_name": "Lab Skills",
        "available": true,
        "has_content": true
      }
    ],
    "total_assessment_types": 4
  }
}
```

### 3. Generate Professional Assessor Guide
```http
POST /assessor-guides/generate/{unit_code}
```

**Path Parameters:**
- `unit_code` - Unit code for guide generation

**Request Body:**
```json
{
  "selected_assessment_types": [
    "6703c26d78548ed67f9862a7",
    "6703c26d78548ed67f9862ab"
  ],
  "generation_options": {
    "professional_format": true,
    "include_rubrics": true,
    "include_guidelines": true,
    "ai_enhanced_content": true
  }
}
```

**Request Options:**
- `selected_assessment_types` (optional) - Array of assessment type IDs. If empty/omitted, includes all available types
- `generation_options` (optional) - Generation preferences:
  - `professional_format` (boolean) - Use professional PDF layout (default: true)
  - `include_rubrics` (boolean) - Generate assessment-specific rubrics (default: true)  
  - `include_guidelines` (boolean) - Add assessor guidelines (default: true)
  - `ai_enhanced_content` (boolean) - Use AI for content processing (default: true)

**Response:**
```json
{
  "status": true,
  "data": {
    "pdf_generated": true,
    "unit_code": "TEST104",
    "assessment_types_used": [
      "Case study",
      "Report", 
      "Work placement & reflection",
      "Lab Skills"
    ],
    "total_assessment_types_count": 21,
    "unit_assessment_types_count": 4,
    "format": "professional_pdf",
    "features": {
      "ai_content_processing": true,
      "specific_rubrics": true,
      "professional_layout": true,
      "table_of_contents": true
    },
    "generated_at": "2025-08-05T05:48:55.964Z"
  }
}
```

### 4. Get PDF Information
```http
GET /assessor-guides/{unit_code}/pdf
```

**Response:**
```json
{
  "status": true,
  "data": {
    "unit_info": {
      "unit_code": "TEST104",
      "unit_title": "Support individuals with mental health issues", 
      "competency": "Community Services"
    },
    "pdf_available": true,
    "generated_at": "2025-08-05T05:48:55.964Z",
    "status": "generated",
    "file_size_bytes": 245760,
    "assessment_types_included": [
      "Case study",
      "Report",
      "Work placement & reflection", 
      "Lab Skills"
    ],
    "features": {
      "ai_enhanced_content": true,
      "specific_rubrics": true,
      "professional_layout": true
    }
  }
}
```

### 5. Download PDF File
```http
GET /assessor-guides/{unit_code}/download-pdf
```

**Response:**
- **Content-Type:** `application/pdf`
- **Content-Disposition:** `attachment; filename="{unit_code}_AssessorGuide.pdf"`
- **Response Body:** PDF file binary data

**Success:** Returns PDF file for download
**Error 404:** PDF not found - generate guide first

### 6. Delete Assessor Guide
```http
DELETE /assessor-guides/{unit_code}
```

**Response:**
```json
{
  "status": true,
  "message": "Assessor guide deleted successfully",
  "data": {
    "unit_code": "TEST104",
    "content_deleted": true
  }
}
```

---

## 🚀 Quick Start Integration

### Step 1: Check Available Assessment Types
```javascript
async function getAssessmentTypes(unitCode) {
  const response = await fetch(`/api/assessor-guides/${unitCode}/assessment-types`);
  const data = await response.json();
  
  if (data.status) {
    return data.data.available_assessment_types;
  }
  throw new Error(data.message);
}

// Usage
const types = await getAssessmentTypes('TEST104');
console.log('Available types:', types);
```

### Step 2: Generate Professional Guide
```javascript
async function generateAssessorGuide(unitCode, selectedTypes = []) {
  const response = await fetch(`/api/assessor-guides/generate/${unitCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      selected_assessment_types: selectedTypes,
      generation_options: {
        professional_format: true,
        include_rubrics: true,
        include_guidelines: true,
        ai_enhanced_content: true
      }
    })
  });
  
  const data = await response.json();
  if (data.status) {
    return data.data;
  }
  throw new Error(data.message);
}

// Usage - Generate with specific types
const result = await generateAssessorGuide('TEST104', [
  '6703c26d78548ed67f9862a7',  // Case study
  '6703c26d78548ed67f9862ab'   // Report
]);

// Usage - Generate with all available types
const resultAll = await generateAssessorGuide('TEST104');
```

### Step 3: Download Generated PDF
```javascript
function downloadAssessorGuide(unitCode) {
  const downloadUrl = `/api/assessor-guides/${unitCode}/download-pdf`;
  
  // Option 1: Direct download
  window.open(downloadUrl, '_blank');
  
  // Option 2: Programmatic download with error handling
  fetch(downloadUrl)
    .then(response => {
      if (!response.ok) throw new Error('PDF not found');
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${unitCode}_AssessorGuide.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    })
    .catch(error => {
      console.error('Download failed:', error);
      alert('Please generate the assessor guide first');
    });
}

// Usage
downloadAssessorGuide('TEST104');
```

### Complete Workflow Example
```javascript
async function completeAssessorGuideWorkflow(unitCode) {
  try {
    // 1. Get available assessment types
    console.log('Fetching assessment types...');
    const types = await getAssessmentTypes(unitCode);
    
    // 2. Let user select types (or use all)
    const selectedTypeIds = types.map(t => t.assessment_type_id);
    
    // 3. Generate guide
    console.log('Generating assessor guide...');
    const result = await generateAssessorGuide(unitCode, selectedTypeIds);
    console.log('Generated successfully:', result);
    
    // 4. Download PDF
    console.log('Downloading PDF...');
    downloadAssessorGuide(unitCode);
    
    return result;
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

// Usage
completeAssessorGuideWorkflow('TEST104');
```

---

## 📄 Professional PDF Output Features

### 🎨 **Modern Design Elements**
- **Professional cover page** with unit information and branding
- **Clean typography** with strategic color usage (#2563eb accent)
- **Structured sections** with numbered organization
- **Table of contents** for easy navigation
- **Consistent spacing** and professional layout

### 📋 **Content Structure**
1. **Professional Cover Page**
   - Unit code, title, and competency area
   - List of included assessment types
   - Generation date and professional branding

2. **Table of Contents**
   - Numbered sections for easy navigation
   - Assessment-specific subsections

3. **Unit Overview**
   - Comprehensive unit information
   - Performance criteria and elements
   - Knowledge evidence requirements

4. **Assessment Questions and Rubrics**
   - Full assessment content with professional formatting
   - Assessment-specific rubrics for each type
   - Practical assessor guidance

5. **General Assessor Guidelines**  
   - Professional assessment process
   - Quality assurance standards
   - Documentation requirements

### 🤖 **AI-Enhanced Content Processing**
- **Markdown conversion** - Converts `### Headers` to professional headings
- **Format preservation** - Maintains `**bold**` and `*italic*` formatting
- **Structure recognition** - Processes bullet points and numbered lists
- **Content extraction** - Handles complex JSON database structures
- **Quality assurance** - Fallback processing for reliable output

### 📊 **Assessment-Specific Rubrics**

**Case Study Rubrics:**
- Comprehensive scenario analysis
- Theory application and frameworks
- Well-reasoned recommendations
- Professional communication

**Report Rubrics:**
- Research quality and sources
- Clear analysis and structure
- Critical thinking evidence
- Proper referencing standards

**Work Placement Rubrics:**
- Professional behavior demonstration
- Practical knowledge application
- Meaningful reflection evidence
- Quality documentation

**Lab Skills Rubrics:**
- Safe equipment usage
- Accurate procedure following
- Problem-solving abilities
- Clear record-keeping

---

## ⚠️ Error Handling

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (unit/assessment not found)
- `500` - Internal Server Error (generation failed)

### Error Response Format
```json
{
  "status": false,
  "message": "Detailed error description",
  "code": 404,
  "error_type": "UNIT_NOT_FOUND"
}
```

### Frontend Error Handling
```javascript
async function handleApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message.includes('404')) {
      alert('Unit not found. Please check the unit code.');
    } else if (error.message.includes('500')) {
      alert('Generation failed. Please try again or contact support.');
    } else {
      alert(`Error: ${error.message}`);
    }
    throw error;
  }
}

// Usage
await handleApiCall(() => generateAssessorGuide('TEST104'));
```

---

## 🧪 Testing Guide

### Prerequisites
- API server running
- Valid unit codes in database
- Assessment content available
- Network connectivity

### Testing Workflow

#### 1. Test Assessment Types Endpoint
```bash
curl -X GET "http://localhost:7071/api/assessor-guides/TEST104/assessment-types" \
  -H "Content-Type: application/json"
```

**Expected:** List of available assessment types with IDs

#### 2. Test PDF Generation
```bash
curl -X POST "http://localhost:7071/api/assessor-guides/generate/TEST104" \
  -H "Content-Type: application/json" \
  -d '{
    "selected_assessment_types": [],
    "generation_options": {
      "professional_format": true,
      "include_rubrics": true
    }
  }'
```

**Expected:** Success response with generation details

#### 3. Test PDF Download
```bash
curl -X GET "http://localhost:7071/api/assessor-guides/TEST104/download-pdf" \
  -o "TEST104_AssessorGuide.pdf"
```

**Expected:** PDF file download

#### 4. Validate PDF Content
- Open downloaded PDF in viewer
- Verify professional formatting
- Check assessment-specific rubrics
- Confirm table of contents navigation
- Validate content completeness

### Quality Assurance Checklist
- [ ] Professional cover page with correct unit information
- [ ] Table of contents with proper navigation
- [ ] Assessment content properly formatted (no raw markdown)
- [ ] Assessment-specific rubrics for each type
- [ ] Professional typography and layout
- [ ] Assessor guidelines included
- [ ] PDF file size reasonable (< 1MB typically)
- [ ] No generation errors in logs

---

## 🛠️ Technical Implementation Notes

### Database Requirements
- `units` collection with unit information
- `assessment` collection with generated_text field containing JSON
- `assessment_types` collection with type definitions
- `assessor_guides` collection for PDF storage

### Content Processing Pipeline
1. **Extraction** - Gets assessment content from database
2. **JSON parsing** - Processes complex content structures  
3. **AI conversion** - Converts markdown to HTML formatting
4. **PDF generation** - Creates professional PDF with ReportLab
5. **Storage** - Saves binary PDF content to database

### Performance Considerations
- PDF generation: ~1-2 seconds per unit
- File sizes: 200KB - 1MB depending on content
- Concurrent generation: Supported
- Caching: Generated PDFs stored until deleted

---

## 📞 Support & Integration

### Frontend Developer Guidelines
1. **Always check assessment types first** before generation
2. **Handle empty assessment types** gracefully (generates all available)
3. **Implement download error handling** for missing PDFs
4. **Show loading states** during generation (1-2 seconds)
5. **Validate unit codes** before API calls
6. **Cache assessment types** to reduce API calls

### Best Practices
- Use the complete workflow example as a starting template
- Implement proper error handling for all endpoints
- Show progress indicators during PDF generation
- Validate user inputs before API calls
- Handle network errors gracefully

### Integration Checklist
- [ ] Assessment types endpoint integrated
- [ ] PDF generation with loading state
- [ ] Download functionality working
- [ ] Error handling implemented  
- [ ] User feedback for all states
- [ ] Unit code validation
- [ ] Loading indicators added

---

## 🚨 Production Considerations

### Security
- Validate all unit codes server-side
- Implement rate limiting for generation endpoints
- Secure PDF download endpoints
- Log generation activities for audit

### Monitoring
- Track PDF generation success rates
- Monitor file sizes and generation times
- Alert on repeated failures
- Log user activity for analytics

### Scalability
- PDF generation is stateless and scalable
- Consider file storage limits for large deployments
- Implement cleanup for old PDF files
- Monitor database growth

---

*This API delivers professional-grade assessor guides with AI-enhanced content processing and modern PDF design, ready for immediate use in training environments.*