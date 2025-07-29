# SCEI & SCEI-HE Backend API Documentation

## Overview

This document provides comprehensive documentation for the SCEI (South Coast Educational Institute) and SCEI-HE (South Coast Educational Institute - Higher Education) backend API. The API is built using Azure Functions with Python and MongoDB for data storage.

## Domain Architecture

The system supports two domains:
- **SCEI**: Vocational Education and Training (VET) focused
- **SCEI-HE**: Higher Education focused

Domain detection is handled via the `domain` header in requests:
- `scei` for SCEI domain
- `scei-he` for SCEI-HE domain

## Authentication & Authorization

### JWT Token Authentication

Most endpoints require JWT authentication via the `Authorization` header.

**Protected Routes:**
- `units`, `users`, `embeddings`, `mappings`

**Authentication Flow:**
1. Login via `/auth/login` to get JWT token
2. Include token in `Authorization` header for protected endpoints
3. Token validation checks user existence and admin privileges

**Token Format:**
```
Authorization: YOUR_JWT_TOKEN_HERE
```

**JWT Payload:**
```json
{
  "user_id": "user_object_id"
}
```

### User Roles
- **Admin**: Full access to all endpoints
- **Regular User**: Limited access based on domain

---

## Base Response Format

All API responses follow this standardized format:

```json
{
  "status": boolean,
  "message": "string",
  "data": object|array,
  "code": number
}
```

---

# Authentication Endpoints

## POST /auth/login

**Description:** Authenticate user and get JWT token

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Response (Success):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "token": "jwt_token_here",
    "admin": {
      "_id": "user_id",
      "id": "user_id",
      "first_name": "John",
      "last_name": "Doe",
      "email": "admin@example.com",
      "role": "administrator",
      "is_admin": true,
      "domain": "scei"
    }
  }
}
```

**Response (Error):**
```json
{
  "status": false,
  "message": "Incorrect password!",
  "data": [],
  "code": 401
}
```

---

# User Management Endpoints

## GET /users

**Description:** Get paginated list of users (excluding admin users)

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Query Parameters:**
- `limit`: Number of users per page (required)
- `page`: Page number (0-based, required)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "rows": [
      {
        "_id": "user_id",
        "id": "user_id",
        "first_name": "John",
        "last_name": "Doe",
        "email": "user@example.com",
        "role": "instructor",
        "is_admin": false
      }
    ],
    "hasMorePages": true,
    "count": 25
  }
}
```

## GET /users/{id}

**Description:** Get specific user details

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Path Parameters:**
- `id`: User ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "_id": "user_id",
    "id": "user_id",
    "first_name": "John",
    "last_name": "Doe",
    "email": "user@example.com",
    "role": "instructor",
    "is_admin": false
  }
}
```

## POST /users

**Description:** Create new user

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "secure_password",
  "role": "instructor",
  "admin": false
}
```

**Response:**
```json
{
  "status": true,
  "message": "User added",
  "data": []
}
```

## PUT /users/{id}

**Description:** Update existing user

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Path Parameters:**
- `id`: User ObjectId

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "new_password",
  "role": "instructor",
  "admin": false
}
```

**Response:**
```json
{
  "status": true,
  "message": "User updated",
  "data": []
}
```

## DELETE /users/{id}

**Description:** Delete user

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Path Parameters:**
- `id`: User ObjectId

**Response:**
```json
{
  "status": true,
  "message": "User deleted successfully!",
  "data": []
}
```

---

# Unit Management Endpoints

## GET /units

**Description:** Get paginated list of units

**Headers:**
- `Authorization`: JWT token (if route is protected)
- `domain`: `scei` or `scei-he`

**Query Parameters:**
- `limit`: Number of units per page (required)
- `page`: Page number (0-based, required)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "rows": [
      {
        "_id": "unit_id",
        "id": "unit_id",
        "unit_code": "CHCECE001",
        "unit_title": "Develop cultural competency"
      }
    ],
    "hasMorePages": false,
    "count": 1
  }
}
```

## GET /units/{id}

**Description:** Get specific unit details with learning outcomes (for SCEI-HE)

**Headers:**
- `Authorization`: JWT token (if route is protected)
- `domain`: `scei` or `scei-he`

**Path Parameters:**
- `id`: Unit ObjectId

**Response (SCEI):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "_id": "unit_id",
    "id": "unit_id",
    "unit_code": "CHCECE001",
    "unit_title": "Develop cultural competency",
    "competency": "CHC Community Services Training Package",
    "domain": "scei",
    "unit_elements": [
      {
        "element": "Reflect on own perspectives",
        "criterias": [
          "Identify own cultural background and how this impacts on work",
          "Reflect on own attitudes and beliefs"
        ]
      }
    ],
    "unit_performance_evidences": [
      {
        "evidence": "Evidence of reflection on cultural perspectives",
        "subtopics": [
          "Personal cultural identity analysis",
          "Impact assessment on professional practice"
        ]
      }
    ],
    "unit_knowledges": [
      {
        "topic": "Cultural competency frameworks",
        "subtopics": [
          "National frameworks",
          "Local implementation strategies"
        ]
      }
    ]
  }
}
```

**Response (SCEI-HE):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "_id": "unit_id",
    "id": "unit_id",
    "unit_code": "EDU101",
    "unit_title": "Introduction to Education",
    "unit_outline": "This unit introduces students to...",
    "domain": "scei-he",
    "learning_outcomes": [
      {
        "_id": "outcome_id",
        "id": "outcome_id",
        "unit_learning_outcome": "Demonstrate understanding of educational theories"
      }
    ],
    "attributes": ["Critical thinking", "Communication"],
    "contents": [
      {
        "content": "Educational psychology theories",
        "criteria": ["Analyze learning theories", "Apply theories to practice"]
      }
    ],
    "standards": ["National Teaching Standards"],
    "benchmarks": [
      {
        "uni_name": "University of Sydney",
        "course_outline": "Bachelor of Education outline",
        "units": ["EDUC1001", "EDUC1002"]
      }
    ]
  }
}
```

## POST /units

**Description:** Create new unit

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Request (SCEI):**
```json
{
  "unit_code": "CHCECE001",
  "name": "Develop cultural competency",
  "competency": "CHC Community Services Training Package",
  "elements": [
    {
      "element": "Reflect on own perspectives",
      "criteria": [
        "Identify own cultural background",
        "Reflect on own attitudes"
      ]
    }
  ],
  "evidences": [
    {
      "element": "Evidence of reflection",
      "subTopics": ["Personal analysis", "Professional impact"]
    }
  ],
  "knowledge": [
    {
      "element": "Cultural frameworks",
      "subTopics": ["National frameworks", "Local strategies"]
    }
  ]
}
```

**Request (SCEI-HE):**
```json
{
  "unit_code": "EDU101",
  "name": "Introduction to Education",
  "outline": "This unit introduces students to educational theories...",
  "outcomes": ["Demonstrate understanding of educational theories"],
  "attributes": ["Critical thinking", "Communication"],
  "contents": [
    {
      "content": "Educational psychology theories",
      "criterias": ["Analyze learning theories", "Apply theories to practice"]
    }
  ],
  "standards": ["National Teaching Standards"],
  "benchmarks": [
    {
      "uni_name": "University of Sydney",
      "outline": "Bachelor of Education outline",
      "units": ["EDUC1001", "EDUC1002"]
    }
  ]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Unit added",
  "data": []
}
```

## PUT /units/{id}

**Description:** Update existing unit (routes to SCEI or SCEI-HE update based on domain header)

**Headers:**
- `Authorization`: JWT token
- `domain`: `scei` or `scei-he`

**Path Parameters:**
- `id`: Unit ObjectId

**Request:** Same format as POST /units based on domain

**Response:**
```json
{
  "status": true,
  "message": "Unit updated successfully",
  "data": []
}
```

## GET /units/elements/{id}

**Description:** Get unit elements with associated assessments

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "elements": [
      {
        "element": "Reflect on own perspectives",
        "criterias": [
          {
            "criteria": "Identify own cultural background",
            "assessment": {
              "_id": "assessment_id",
              "id": "assessment_id",
              "generated_text": "Assessment question content",
              "type": "question",
              "element_id": 0,
              "criteria_id": 0
            }
          }
        ]
      }
    ],
    "assessment": {
      "case_study": "Case study content",
      "work_placement_reflection": "Reflection content",
      "role_play": "Role play content"
    }
  }
}
```

---

# Learning Outcomes Endpoints (SCEI-HE Only)

## GET /units/he/outcome/{id}

**Description:** Generate unit learning outcomes using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    "Demonstrate understanding of educational theories",
    "Apply critical thinking to educational scenarios",
    "Communicate effectively in educational contexts"
  ]
}
```

## POST /units/he/outcome

**Description:** Save unit learning outcomes

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request:**
```json
{
  "unit_id": "unit_object_id",
  "outcome": [
    "Demonstrate understanding of educational theories",
    "Apply critical thinking to educational scenarios"
  ]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Outcomes saved!",
  "data": []
}
```

## GET /units/he/outcome/mapping/{id}

**Description:** Generate learning outcome mappings using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "id": 1,
      "unit_learning_outcome": "Demonstrate understanding of theories",
      "course_learning_outcomes": "CLO1: Analyze educational theories",
      "graduate_attributes": "Critical thinking, Analysis",
      "acecqa_contents": "Educational psychology content",
      "industry_standards": "ACECQA approved standards"
    }
  ]
}
```

## POST /units/he/outcome/mapping

**Description:** Save learning outcome mappings

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request:**
```json
{
  "unit_id": "unit_object_id",
  "outcome": [
    {
      "id": 1,
      "course_learning_outcomes": "CLO1: Analyze educational theories",
      "graduate_attributes": "Critical thinking, Analysis",
      "acecqa_contents": "Educational psychology content",
      "industry_standards": "ACECQA approved standards"
    }
  ]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Outcome mappings saved!",
  "data": []
}
```

---

# Assessment Endpoints

## GET /assessments/he/types

**Description:** Get all assessment types for SCEI-HE

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "assessment_type_id",
      "id": "assessment_type_id",
      "assessment_name": "Essay"
    },
    {
      "_id": "assessment_type_id2",
      "id": "assessment_type_id2",
      "assessment_name": "Case Study"
    }
  ]
}
```

## GET /assessments/he/{id}/types

**Description:** Get assessment types for a specific unit in SCEI-HE

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "assessment_type": "assessment_type_id",
      "assessment_name": "Essay"
    }
  ]
}
```

## POST /assessments/he/generate

**Description:** Generate assessment for SCEI-HE using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request (Questioning Type - New System):**
```json
{
  "unit_id": "unit_object_id",
  "type": "questioning_assessment_type_id",
  "question_type": "direct_knowledge",
  "suggestion": "Focus on theoretical knowledge",
  "text": "Previous questions for context"
}
```

**Request (Other Assessment Types):**
```json
{
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "suggestion": "Focus on critical analysis",
  "text": "Previous assessment text for context"
}
```

**Available Question Types for SCEI-HE:**
- `direct_knowledge`: Theory-based questions at university level
- `procedural`: Step-by-step process questions for HE
- `scenario_based`: Real-world application scenarios for HE
- `reflection_based`: Critical thinking and self-reflection for HE
- `situational_judgement`: Decision-making questions for HE
- `comparison_analysis`: Analysis and comparison questions for HE

**Response (Questioning Type):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "text": "{\n  \"output\": [\n    {\n      \"question\": \"Question text here for higher education level\",\n      \"answer\": \"Comprehensive response demonstrating university-level analysis\",\n      \"references\": [\"CLO1\", \"ULO2\", \"GA3\", \"AC1.1\", \"IS2\"],\n      \"context\": \"Additional professional context or explanation\"\n    }\n  ],\n  \"mapping\": {\n    \"course_learning_outcome\": \"CLO1, CLO2\",\n    \"unit_learning_outcome\": \"ULO1, ULO2\",\n    \"graduate_attribute\": \"GA1, GA3\",\n    \"acecqa_content\": \"AC1.1, AC2.1\",\n    \"industry_standard\": \"IS1, IS2\",\n    \"benchmark\": \"BU1.1, BU2.1\"\n  }\n}"
  }
}
```

**Response (Other Assessment Types - Essay, Case Study, Report, etc.):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "text": "{\n  \"output\": \"Comprehensive assessment content tailored to the specific assessment type (essay question with marking criteria, case study scenario with analysis requirements, report structure with professional standards, etc.)\",\n  \"mapping\": {\n    \"course_learning_outcome\": \"CLO1, CLO2\",\n    \"unit_learning_outcome\": \"ULO1, ULO2\",\n    \"graduate_attribute\": \"GA1, GA3\",\n    \"acecqa_content\": \"AC1.1, AC2.1\",\n    \"industry_standard\": \"IS1, IS2\",\n    \"benchmark\": \"BU1.1, BU2.1\"\n  }\n}"
  }
}
```

## POST /assessments/generate

**Description:** Generate assessment for SCEI using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request (Questioning Type - New System):**
```json
{
  "unit_id": "unit_object_id",
  "type": "6703c26d78548ed67f9862a6",
  "question_type": "direct_knowledge",
  "suggestion": "Focus on theoretical knowledge",
  "text": "Previous questions for context"
}
```

**Request (Other Assessment Types):**
```json
{
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "include_pc": true,
  "include_pe": true,
  "include_ke": false,
  "suggestion": "Focus on practical skills",
  "text": "Previous assessment for context"
}
```

**Request (Legacy Element/Criteria Based):**
```json
{
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "element_index": 0,
  "criteria_index": 1,
  "suggestion": "Focus on this specific criteria"
}
```

**Available Question Types:**
- `direct_knowledge`: Theory-based questions
- `procedural`: Step-by-step process questions
- `scenario_based`: Real-world application scenarios
- `reflection_based`: Critical thinking and self-reflection
- `situational_judgement`: Decision-making questions
- `comparison_analysis`: Analysis and comparison questions

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "text": "{\n  \"output\": [\n    {\n      \"question\": \"Assessment task or question here\",\n      \"answer\": \"Comprehensive response/sample answer here\",\n      \"references\": [\"PC1.1\", \"PE1.2\", \"KE2.1\"],\n      \"context\": \"Additional context or explanation if needed\"\n    }\n  ],\n  \"mapping\": {\n    \"performance_criteria\": \"PC1.1, PC2.1\",\n    \"performance_evidence\": \"PE1.1, PE1.2\",\n    \"knowledge_evidence\": \"KE1.1, KE2.1\"\n  }\n}"
  }
}
```

## POST /assessments/he

**Description:** Save assessment for SCEI-HE

**Headers:**
- `Authorization`: JWT token (if route is protected)
- `domain`: `scei-he`

**Request (Questioning Type):**
```json
{
  "unit_id": "unit_object_id",
  "type": "questioning_assessment_type_id",
  "element_id": 12345,
  "criteria_id": 67890,
  "text": "Generated questions and answers content",
  "mappings": [
    {
      "course_learning_outcome": "CLO1, CLO2",
      "unit_learning_outcome": "ULO1, ULO3",
      "graduate_attribute": "GA1, GA2",
      "acecqa_content": "AC1.1, AC2.1",
      "industry_standard": "IS1, IS2"
    }
  ]
}
```

**Request (Other Types):**
```json
{
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "text": "Assessment content to save",
  "mappings": [
    {
      "course_learning_outcome": "CLO1",
      "unit_learning_outcome": "ULO2",
      "graduate_attribute": "GA3",
      "acecqa_content": "AC1.1",
      "industry_standard": "IS1"
    }
  ]
}
```

**Response:**
```json
{
  "status": true,
  "message": "Assessment updated successfully!",
  "data": []
}
```

## POST /assessments

**Description:** Save assessment for SCEI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request (Questioning Type):**
```json
{
  "unit_id": "unit_object_id",
  "type": "6703c26d78548ed67f9862a6",
  "element_id": 12345,
  "criteria_id": 67890,
  "text": "Generated questions and answers content"
}
```

**Request (Other Types):**
```json
{
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "text": "Assessment content to save"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Assessment updated successfully!",
  "data": []
}
```

## GET /assessments/he/{id}

**Description:** Get saved assessment for SCEI-HE

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Query Parameters:**
- `type`: Assessment type ObjectId
- `element_id`: Element ID (for questioning type)
- `criteria_id`: Criteria ID (for questioning type)

**Response (Single Assessment):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "_id": "assessment_id",
    "id": "assessment_id",
    "assessment": "Saved assessment content",
    "mappings": [
      {
        "course_learning_outcome": "CLO1",
        "unit_learning_outcome": "ULO2", 
        "graduate_attribute": "GA3",
        "acecqa_content": "AC1.1",
        "industry_standard": "IS1"
      }
    ]
  }
}
```

**Response (Multiple Questioning Assessments):**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "assessment_id",
      "id": "assessment_id",
      "element_id": 12345,
      "criteria_id": 67890,
      "assessment": "Questions and answers content",
      "question_type_name": "Direct Knowledge Questions",
      "mappings": [
        {
          "course_learning_outcome": "CLO1, CLO2",
          "unit_learning_outcome": "ULO1, ULO3",
          "graduate_attribute": "GA1, GA2"
        }
      ]
    }
  ]
}
```

## GET /assessments/{id}

**Description:** Get saved assessment for SCEI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Query Parameters:**
- `type`: Assessment type ObjectId
- `element_id`: Element ID (for questioning type)
- `criteria_id`: Criteria ID (for questioning type)

**Response (Single Assessment):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "_id": "assessment_id",
    "id": "assessment_id",
    "generated_text": "Assessment content",
    "scei_mappings": [
      {
        "performance_criteria": "PC1.1",
        "performance_evidence": "PE1",
        "knowledge_evidence": "KE1"
      }
    ]
  }
}
```

**Response (Multiple Questioning Assessments):**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "assessment_id",
      "id": "assessment_id",
      "element_id": 12345,
      "criteria_id": 67890,
      "generated_text": "Questions and answers",
      "question_type_name": "Direct Knowledge Questions"
    }
  ]
}
```

## GET /assessments/he/mapping/{id}

**Description:** Get assessments with mappings for SCEI-HE

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "assessment_id",
      "id": "assessment_id",
      "assessment": "Essay : Assessment content here",
      "mappings": [
        {
          "learning_outcome": "LO1",
          "assessment_criteria": "AC1"
        }
      ],
      "assessment_type": "assessment_type_id"
    }
  ]
}
```

## GET /assessments/he/mapping/generate/{id}

**Description:** Generate mappings for SCEI-HE assessment using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Assessment ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "mappings": [
      {
        "learning_outcome": "LO1: Analyze educational theories",
        "assessment_criteria": "AC1: Demonstrates analysis",
        "mapping_rationale": "This assessment directly tests..."
      }
    ]
  }
}
```

## GET /assessments/mapping/generate/{id}

**Description:** Generate mappings for SCEI assessment using AI

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Assessment ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "mappings": [
      {
        "performance_criteria": "PC1.1: Identify cultural background",
        "performance_evidence": "PE1: Evidence of reflection",
        "knowledge_evidence": "KE1: Cultural competency frameworks",
        "mapping_rationale": "This assessment covers..."
      }
    ]
  }
}
```

---

# Assessment Schema Endpoints

## GET /assessments/schema/{id}/{type}

**Description:** Get assessment schema with guidelines for creating assessments

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId
- `type`: Assessment type ObjectId

**Response (Questioning Type):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "schema": {
      "components": [
        {
          "name": "Direct Knowledge Questions",
          "description": "Test fundamental knowledge and concepts",
          "guidelines": "Create questions that assess theoretical understanding",
          "example": "Define cultural competency and explain its importance",
          "tips": "Use clear, specific language and avoid ambiguity",
          "related_competencies": "Links to unit elements and performance criteria"
        }
      ],
      "overall_guidelines": "Generate 5 questions of each type with comprehensive answers",
      "suggested_scope": "30 questions total covering all 6 question types",
      "assessment_criteria": "Questions should test understanding and application",
      "required_format": "Each question type should generate 5 questions with PC/PE/KE references"
    }
  }
}
```

**Response (Other Assessment Types):**
```json
{
  "status": true,
  "message": "",
  "data": {
    "schema": {
      "components": [
        {
          "name": "Case Study Analysis",
          "description": "Real-world scenario analysis component",
          "guidelines": "Create realistic scenarios based on unit content",
          "example": "A childcare worker encounters a cultural conflict...",
          "tips": "Make scenarios relevant and challenging",
          "related_competencies": "Maps to specific performance criteria"
        }
      ],
      "overall_guidelines": "Follow the specific assessment format requirements",
      "suggested_scope": "2000-3000 words with detailed analysis",
      "assessment_criteria": "Evaluate critical thinking and application",
      "required_format": "Specific format instructions from assessment type"
    }
  }
}
```

## POST /assessments/schema/query

**Description:** Query assessment schema for specific guidance

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request:**
```json
{
  "query": "How should I structure questioning assessments?",
  "unit_id": "unit_object_id",
  "type": "assessment_type_id",
  "schema": {
    "components": [],
    "overall_guidelines": "..."
  }
}
```

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "answer": "Questioning assessments should be structured with 6 different question types: Direct Knowledge Questions test fundamental concepts, Procedural Questions focus on step-by-step processes..."
  }
}
```

---

# Assessment Sample Management Endpoints

## GET /assessment-samples/{unit_id}/{assessment_type}

**Description:** Get saved assessment samples for a specific unit and assessment type

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `unit_id`: Unit ObjectId
- `assessment_type`: Assessment type ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "sample_id",
      "id": "sample_id",
      "unit_id": "unit_id",
      "assessment_type_id": "assessment_type_id",
      "sample_content": "Sample assessment content",
      "quality_rating": 5,
      "created_at": "2024-01-15T10:30:00Z",
      "question_type_id": "direct_knowledge"
    }
  ]
}
```

## POST /assessment-samples

**Description:** Save a new assessment sample

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Request:**
```json
{
  "unit_id": "unit_object_id",
  "assessment_type_id": "assessment_type_id",
  "sample_content": "High-quality assessment content to save as sample",
  "quality_rating": 5,
  "question_type_id": "direct_knowledge",
  "notes": "Excellent example of theoretical questions"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Sample saved successfully",
  "data": {
    "_id": "sample_id",
    "id": "sample_id"
  }
}
```

## PUT /assessment-samples/{id}

**Description:** Update an existing assessment sample

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Sample ObjectId

**Request:**
```json
{
  "sample_content": "Updated sample content",
  "quality_rating": 4,
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Sample updated successfully",
  "data": []
}
```

## DELETE /assessment-samples/{id}

**Description:** Delete an assessment sample

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Sample ObjectId

**Response:**
```json
{
  "status": true,
  "message": "Sample deleted successfully",
  "data": []
}
```

## GET /assessment-samples/unit/{unit_id}/all

**Description:** Get all samples for a unit (admin/management view)

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `unit_id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": [
    {
      "_id": "sample_id",
      "id": "sample_id",
      "assessment_type_name": "Questioning",
      "question_type_name": "Direct Knowledge Questions",
      "sample_content": "Sample content",
      "quality_rating": 5,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## GET /assessment-samples/unit/{unit_id}/stats

**Description:** Get sample statistics for a unit

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `unit_id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "total_samples": 15,
    "by_assessment_type": {
      "Questioning": 8,
      "Case Study": 4,
      "Role Play": 3
    },
    "by_quality_rating": {
      "5": 10,
      "4": 3,
      "3": 2
    },
    "average_quality": 4.5
  }
}
```

---

# Document Generation Endpoints

## GET /assessments/pdf/{id}

**Description:** Generate and download PDF of unit assessments

**Headers:** None required (anonymous access)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:** PDF file download

## GET /assessments/doc/{id}

**Description:** Generate and download DOCX of unit assessments

**Headers:** None required (anonymous access)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:** DOCX file download

---

# Study Guide Endpoints

## GET /study-guides

**Description:** List all study guides with their status

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Query Parameters:**
- `limit`: Number of study guides per page (default: 10)
- `page`: Page number (0-based, default: 0)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "rows": [
      {
        "unit_id": "unit_id",
        "unit_code": "CHCECE001",
        "unit_title": "Develop cultural competency",
        "competency": "CHC Community Services",
        "has_latex_content": true,
        "has_embeddings": true,
        "page_estimate": {
          "estimated_pages": 25,
          "word_count": 12500
        },
        "generated_at": "2024-01-15T10:30:00Z",
        "content_type": "latex",
        "generation_method": "dynamic_chapters"
      }
    ],
    "hasMorePages": false,
    "count": 1
  }
}
```

## POST /study-guides/assessor-guide

**Description:** Upload and process assessor guide PDF file as embeddings

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Form Data:**
- `assessor_guide_file`: PDF file (required)
- `unit_id`: Unit ObjectId (required)
- `unit_code`: Unit code string (required)

**Response:**
```json
{
  "status": true,
  "message": "Assessor guide uploaded and processed successfully",
  "data": {
    "has_embeddings": true,
    "embedding_count": 45,
    "total_chunks": 45,
    "average_chunk_size": 512,
    "unit_code": "CHCECE001"
  }
}
```

## GET /study-guides/assessor-guide/{id}/status

**Description:** Get the status of assessor guide embeddings for a unit

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "has_embeddings": true,
    "embedding_count": 45,
    "total_chunks": 45,
    "average_chunk_size": 512,
    "unit_code": "CHCECE001",
    "metadata_structure_ok": true
  }
}
```

## GET /study-guides/assessor-guide/count

**Description:** Count how many unique units have assessor guides available

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "units_with_assessor_guides": 25
  }
}
```

## GET /study-guides/{id}/estimate

**Description:** Estimate the scope and complexity of generating a study guide

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "scope_estimate": {
      "estimated_pages": 25,
      "estimated_chapters": 8,
      "complexity_score": 7.5,
      "estimated_generation_time": "15-20 minutes",
      "content_areas": [
        "Unit overview",
        "Learning objectives",
        "Performance criteria analysis"
      ]
    },
    "embeddings_available": true,
    "embeddings_stats": {
      "has_embeddings": true,
      "embedding_count": 45
    }
  }
}
```

## POST /study-guides/{id}/generate-latex

**Description:** Generate complete study guide as LaTeX content

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Request:**
```json
{
  "generation_method": "dynamic_chapters"
}
```

**Available Generation Methods:**
- `dynamic_chapters`: Single call with AI-generated chapter structure (Default)
- `dynamic_multi_call`: Multiple calls with AI-generated chapter structure (Most detailed)
- `enhanced_single`: Single call with predefined structure (Legacy)
- `multi_call`: Multiple calls with predefined structure (Legacy)

**Response:**
```json
{
  "status": true,
  "message": "LaTeX study guide generated successfully using dynamic_chapters",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "generation_method": "dynamic_chapters",
    "method_description": "Single call with AI-generated chapter structure (Default)",
    "generation_stats": {
      "total_generation_time": 18.5,
      "content_length": 25000,
      "chapters_generated": 8
    },
    "page_estimate": {
      "estimated_pages": 25,
      "word_count": 12500
    },
    "content_analysis": {
      "chapters_count": 8,
      "total_length": 25000
    },
    "validation_issues": []
  }
}
```

## GET /study-guides/{id}/latex

**Description:** Get the generated LaTeX content for a study guide

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "latex_content": "\\documentclass{article}\n\\begin{document}...",
    "content_analysis": {
      "chapters": 8,
      "total_length": 25000
    },
    "page_estimate": {
      "estimated_pages": 25,
      "word_count": 12500
    },
    "validation_issues": [],
    "generation_stats": {
      "generation_time": 18.5,
      "method_used": "dynamic_chapters"
    },
    "generated_at": "2024-01-15T10:30:00Z",
    "content_type": "latex",
    "generation_method": "dynamic_chapters"
  }
}
```

## GET /study-guides/{id}/download-latex

**Description:** Download the LaTeX content as a .tex file

**Headers:** None required (anonymous access)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:** LaTeX .tex file download with filename format: `{unit_code}_StudyGuide.tex`

## POST /study-guides/{id}/validate-latex

**Description:** Validate and fix LaTeX content for a study guide

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "LaTeX validation completed",
  "data": {
    "fixes_applied": true,
    "fixed_content": "\\documentclass{article}\n\\begin{document}...",
    "remaining_issues": [],
    "fixes_made": [
      "Fixed missing closing braces",
      "Corrected table formatting"
    ]
  }
}
```

## GET /study-guides/{id}/preview-chapters

**Description:** Preview the dynamic chapter structure without generating full content

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "unit_metrics": {
      "total_elements": 4,
      "total_pcs": 12,
      "total_pe_items": 8,
      "total_ke_items": 15
    },
    "dynamic_structure": {
      "chapters": [
        {
          "chapter_number": 1,
          "title": "Introduction to Cultural Competency",
          "description": "Overview of cultural competency concepts",
          "estimated_pages": 3
        },
        {
          "chapter_number": 2,
          "title": "Self-Reflection and Cultural Awareness",
          "description": "Understanding personal cultural perspectives",
          "estimated_pages": 4
        }
      ],
      "total_estimated_pages": 25
    },
    "preview_generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## POST /study-guides/{id}/regenerate-chapter

**Description:** Regenerate a specific chapter of the study guide

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Request:**
```json
{
  "chapter_number": 2,
  "chapter_title": "Self-Reflection and Cultural Awareness",
  "requirements": "Focus more on practical exercises and include more examples"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Chapter regenerated successfully",
  "data": {
    "chapter_number": 2,
    "chapter_title": "Self-Reflection and Cultural Awareness",
    "latex_content": "\\section{Self-Reflection and Cultural Awareness}...",
    "generation_method": "enhanced_single_chapter"
  }
}
```

## GET /study-guides/latex-template

**Description:** Get the basic LaTeX template and guidelines for reference

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "template": "\\documentclass[12pt,a4paper]{article}\n\\usepackage{geometry}...",
    "guidelines": {
      "document_structure": "Use article class with 12pt font",
      "formatting": "Include proper headers and footers",
      "sections": "Use standard LaTeX sectioning commands"
    }
  }
}
```

## DELETE /study-guides/{id}

**Description:** Delete study guide content and embeddings for a unit

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "Study guide and embeddings deleted successfully",
  "data": {
    "content_deleted": true,
    "embeddings_deleted": true
  }
}
```

---

# Presentation Endpoints

## GET /presentations

**Description:** List all presentations with their status

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Query Parameters:**
- `limit`: Number of presentations per page (default: 10)
- `page`: Page number (0-based, default: 0)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "rows": [
      {
        "unit_id": "unit_id",
        "unit_code": "CHCECE001",
        "unit_title": "Develop cultural competency",
        "competency": "CHC Community Services",
        "has_beamer_content": true,
        "has_embeddings": true,
        "slide_estimate": {
          "estimated_slides": 25,
          "presentation_duration": "45 minutes"
        },
        "generated_at": "2024-01-15T10:30:00Z",
        "content_type": "beamer",
        "generation_method": "dynamic_slides",
        "theme": "madrid",
        "color_scheme": "default"
      }
    ],
    "hasMorePages": false,
    "count": 1
  }
}
```

## GET /presentations/{id}/estimate

**Description:** Estimate the scope and complexity of generating a presentation

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "scope_estimate": {
      "estimated_slides": 25,
      "estimated_sections": 6,
      "complexity_score": 7.5,
      "estimated_generation_time": "10-15 minutes",
      "presentation_duration": "45 minutes"
    },
    "embeddings_available": true,
    "embeddings_stats": {
      "has_embeddings": true,
      "embedding_count": 45
    },
    "available_themes": ["madrid", "berlin", "warsaw", "singapore"],
    "available_color_schemes": ["default", "blue", "red", "green"]
  }
}
```

## POST /presentations/{id}/generate-beamer

**Description:** Generate complete instructor presentation as Beamer content

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Request:**
```json
{
  "generation_method": "dynamic_slides",
  "theme": "madrid",
  "color_scheme": "blue"
}
```

**Available Generation Methods:**
- `dynamic_slides`: Single call with AI-generated slide structure (Default)
- `dynamic_multi_call`: Multiple calls with AI-generated slide structure (Most detailed)
- `enhanced_single`: Single call with predefined structure (Legacy)
- `multi_call`: Multiple calls with predefined structure (Legacy)

**Available Themes:**
- `madrid`, `berlin`, `warsaw`, `singapore`, `hannover`, `frankfurt`

**Available Color Schemes:**
- `default`, `blue`, `red`, `green`, `yellow`, `orange`

**Response:**
```json
{
  "status": true,
  "message": "Beamer presentation generated successfully using dynamic_slides",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "generation_method": "dynamic_slides",
    "method_description": "Single call with AI-generated slide structure (Default)",
    "theme": "madrid",
    "color_scheme": "blue",
    "generation_stats": {
      "total_generation_time": 12.3,
      "content_length": 15000,
      "sections_generated": 6
    },
    "slide_estimate": {
      "estimated_slides": 25,
      "presentation_duration": "45 minutes"
    },
    "content_analysis": {
      "slides_count": 25,
      "total_length": 15000
    },
    "validation_issues": []
  }
}
```

## GET /presentations/{id}/beamer

**Description:** Get the generated Beamer content for a presentation

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "beamer_content": "\\documentclass{beamer}\n\\usetheme{madrid}...",
    "content_analysis": {
      "content_slides": 25,
      "total_length": 15000
    },
    "slide_estimate": {
      "estimated_slides": 25,
      "presentation_duration": "45 minutes"
    },
    "validation_issues": [],
    "generation_stats": {
      "generation_time": 12.3,
      "method_used": "dynamic_slides"
    },
    "generated_at": "2024-01-15T10:30:00Z",
    "content_type": "beamer",
    "generation_method": "dynamic_slides",
    "theme": "madrid",
    "color_scheme": "blue"
  }
}
```

## GET /presentations/{id}/download-beamer

**Description:** Download the Beamer content as a .tex file

**Headers:** None required (anonymous access)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:** Beamer .tex file download with filename format: `{unit_code}_Presentation.tex`

## POST /presentations/{id}/validate-beamer

**Description:** Validate and fix Beamer content for a presentation

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "Beamer validation completed",
  "data": {
    "fixes_applied": true,
    "fixed_content": "\\documentclass{beamer}...",
    "remaining_issues": [],
    "fixes_made": [
      "Fixed slide formatting",
      "Corrected theme usage"
    ]
  }
}
```

## GET /presentations/{id}/preview-structure

**Description:** Preview the dynamic slide structure without generating full presentation

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_info": {
      "unit_code": "CHCECE001",
      "unit_title": "Develop cultural competency",
      "competency": "CHC Community Services"
    },
    "unit_metrics": {
      "total_elements": 4,
      "total_pcs": 12,
      "total_pe_items": 8,
      "total_ke_items": 15
    },
    "dynamic_structure": {
      "sections": [
        {
          "section_number": 1,
          "title": "Introduction to Cultural Competency",
          "description": "Overview and importance",
          "estimated_slides": 4
        },
        {
          "section_number": 2,
          "title": "Cultural Self-Awareness",
          "description": "Understanding personal perspectives",
          "estimated_slides": 5
        }
      ],
      "total_estimated_slides": 25
    },
    "preview_generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## POST /presentations/{id}/regenerate-slide

**Description:** Regenerate a specific slide of the presentation

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Request:**
```json
{
  "slide_number": 3,
  "slide_title": "Cultural Self-Awareness",
  "requirements": "Include more interactive elements and visual examples"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Slide regenerated successfully",
  "data": {
    "slide_number": 3,
    "slide_title": "Cultural Self-Awareness",
    "beamer_content": "\\begin{frame}{Cultural Self-Awareness}...",
    "generation_method": "enhanced_single_slide"
  }
}
```

## GET /presentations/beamer-template

**Description:** Get the basic Beamer template and guidelines for reference

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "template": "\\documentclass{beamer}\n\\usetheme{madrid}...",
    "guidelines": {
      "document_structure": "Use beamer class with appropriate theme",
      "slide_formatting": "Keep slides concise and visual",
      "sections": "Use frame environment for slides"
    },
    "available_themes": ["madrid", "berlin", "warsaw", "singapore"],
    "available_color_schemes": ["default", "blue", "red", "green"]
  }
}
```

## DELETE /presentations/{id}

**Description:** Delete presentation content for a unit

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `id`: Unit ObjectId

**Response:**
```json
{
  "status": true,
  "message": "Presentation deleted successfully",
  "data": {
    "content_deleted": true
  }
}
```

---

# Unit Details Scraping Endpoint

## GET /unit-details/{code}

**Description:** Scrape and return unit details from training.gov.au

**Headers:**
- `Authorization`: JWT token (if route is protected)

**Path Parameters:**
- `code`: Unit code (e.g., "CHCECE001")

**Response:**
```json
{
  "status": true,
  "message": "",
  "data": {
    "unit_code": "CHCECE001",
    "unit_title": "Develop cultural competency",
    "competency": "CHC Community Services Training Package",
    "domain": "scei",
    "unit_elements": [
      {
        "element": "Reflect on own perspectives",
        "criterias": [
          "Identify own cultural background and how this impacts on work",
          "Reflect on own attitudes and beliefs"
        ]
      }
    ],
    "unit_performance_evidences": [
      {
        "evidence": "Evidence of reflection on cultural perspectives",
        "subtopics": [
          "Personal cultural identity analysis",
          "Impact assessment on professional practice"
        ]
      }
    ],
    "unit_knowledges": [
      {
        "topic": "Cultural competency frameworks",
        "subtopics": [
          "National frameworks",
          "Local implementation strategies"
        ]
      }
    ],
    "_id": {
      "$oid": ""
    }
  }
}
```

---

# Error Handling

## Common Error Responses

**Authentication Error (401):**
```json
{
  "status": false,
  "message": "Token missing",
  "data": [],
  "code": 401
}
```

**Resource Not Found (404):**
```json
{
  "status": false,
  "message": "Unit not found",
  "data": [],
  "code": 404
}
```

**Server Error (500):**
```json
{
  "status": false,
  "message": "Something went wrong!",
  "data": [],
  "code": 500
}
```

**Validation Error (400):**
```json
{
  "status": false,
  "message": "Unit ID is required",
  "data": [],
  "code": 400
}
```

---

# Data Models

## User Model
```json
{
  "_id": "ObjectId",
  "domain": "scei|scei-he",
  "first_name": "string",
  "last_name": "string",
  "email": "string (lowercase)",
  "password": "string (bcrypt hashed)",
  "role": "string",
  "is_admin": "boolean"
}
```

## Unit Model (SCEI)
```json
{
  "_id": "ObjectId",
  "unit_code": "string",
  "unit_title": "string",
  "competency": "string",
  "domain": "scei",
  "unit_elements": [
    {
      "element": "string",
      "criterias": ["string"]
    }
  ],
  "unit_performance_evidences": [
    {
      "evidence": "string",
      "subtopics": ["string"]
    }
  ],
  "unit_knowledges": [
    {
      "topic": "string",
      "subtopics": ["string"]
    }
  ]
}
```

## Unit Model (SCEI-HE)
```json
{
  "_id": "ObjectId",
  "unit_code": "string",
  "unit_title": "string",
  "unit_outline": "string",
  "domain": "scei-he",
  "learning_outcome": ["string"],
  "attributes": ["string"],
  "contents": [
    {
      "content": "string",
      "criteria": ["string"]
    }
  ],
  "standards": ["string"],
  "benchmarks": [
    {
      "uni_name": "string",
      "course_outline": "string",
      "units": ["string"]
    }
  ]
}
```

## Assessment Model (SCEI)
```json
{
  "_id": "ObjectId",
  "unit_id": "ObjectId",
  "type": "ObjectId",
  "element_id": "number",
  "criteria_id": "number",
  "generated_text": "string",
  "mappings": [
    {
      "performance_criteria": "string",
      "performance_evidence": "string",
      "knowledge_evidence": "string"
    }
  ]
}
```

## Assessment Model (SCEI-HE)
```json
{
  "_id": "ObjectId",
  "unit_id": "ObjectId",
  "assessment_type": "ObjectId",
  "assessment": "string",
  "mappings": [
    {
      "learning_outcome": "string",
      "assessment_criteria": "string",
      "mapping_details": "string"
    }
  ]
}
```

---

# Integration Notes

## Frontend Integration Guidelines

1. **Domain Detection**: Always include the `domain` header (`scei` or `scei-he`) in requests to ensure proper routing and data handling.

2. **Authentication**: Store the JWT token from login response and include it in the `Authorization` header for protected endpoints.

3. **Pagination**: Use `limit` and `page` parameters for paginated endpoints. The response includes `hasMorePages` and `count` for UI pagination controls.

4. **Error Handling**: Check the `status` field in responses. If `false`, handle the error using the `message` and `code` fields.

5. **File Uploads**: For assessor guide uploads, use `multipart/form-data` with the file in the `assessor_guide_file` field.

6. **Assessment Types**: The questioning assessment type has a special ID (`6703c26d78548ed67f9862a6` for SCEI) and uses different request/response formats. SCEI-HE has its own questioning assessment type with similar functionality.

7. **ObjectId Handling**: MongoDB ObjectIds are automatically converted to strings in responses with both `_id` and `id` fields for compatibility.

8. **SCEI and SCEI-HE Assessment Format Consistency**: Both systems follow the same pattern for assessment generation:
   - **Questioning Types**: Use array format with `'output': [array of question objects]` containing `question`, `answer`, `references`, and `context` fields
   - **Non-questioning Types**: Use string format with `'output': "assessment content"` that varies by assessment type (essays, case studies, reports, etc.)
   - **Question Types**: Both domains support 6 question types (`direct_knowledge`, `procedural`, `scenario_based`, `reflection_based`, `situational_judgement`, `comparison_analysis`)
   - **Mapping Fields**: SCEI uses `performance_criteria`, `performance_evidence`, `knowledge_evidence` while SCEI-HE uses `course_learning_outcome`, `unit_learning_outcome`, `graduate_attribute`, `acecqa_content`, `industry_standard`, `benchmark`
   - **Assessment Type Uniqueness**: Non-questioning assessment types generate content specific to their purpose (essay questions for essays, case scenarios for case studies, etc.)

## Performance Considerations

1. **Caching**: Consider caching user authentication status and unit/assessment type lists on the frontend.

2. **Pagination**: Use appropriate page sizes (10-20 items) for list endpoints to balance performance and user experience.

3. **File Downloads**: PDF/DOCX generation endpoints may take 10-30 seconds for complex units.

4. **AI Generation**: Assessment and study guide generation can take 30 seconds to several minutes depending on complexity and method chosen.

## Security Notes

1. **Token Security**: JWT tokens should be stored securely on the client side and transmitted only over HTTPS.

2. **File Validation**: Assessor guide uploads only accept PDF files and are processed server-side for text extraction.

3. **Admin Routes**: Some routes require admin privileges which are checked via the user's `is_admin` field.

4. **Domain Isolation**: Users can only access data within their assigned domain (SCEI or SCEI-HE).

---

# Changelog

## Version 1.0 (Current)
- Initial API documentation
- Complete endpoint coverage for SCEI and SCEI-HE domains
- Authentication and authorization documentation
- Data models and error handling specifications
- Frontend integration guidelines

---

This documentation provides complete coverage of all backend API endpoints for both SCEI and SCEI-HE systems. All request/response examples are based on the actual codebase implementation and should be 100% accurate for frontend integration.