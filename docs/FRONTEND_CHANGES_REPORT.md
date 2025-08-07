# Frontend Changes Report: Asynchronous Content Generation

## Overview
The SCEI system has transitioned from synchronous to asynchronous content generation using a hybrid architecture with job-based processing. This report outlines the changes required for frontend implementation.

## **IMPORTANT: Base URLs Remain Unchanged**
⚠️ **The frontend should continue using the same Azure Functions API URLs**. The internal processing has changed to use a microservice architecture, but all existing API endpoints remain the same. The only changes are:
1. **Response format** - Generation endpoints now return job IDs instead of content
2. **New endpoints added** - Status checking endpoints for job monitoring
3. **Processing behavior** - Internal background processing instead of synchronous generation

**No changes to base URLs, authentication, or endpoint paths are required.**

## What Changed and Why

### 1. **Architecture Shift: Synchronous → Asynchronous (Internal Only)**

#### **Before:**
- Direct API calls that blocked until content was generated (5-25 minutes)
- High timeout risk and poor user experience
- Single-threaded processing causing system bottlenecks
- **Same API endpoints, but different response behavior**

#### **After:**
- **Same API endpoints** but immediate job submission with job ID returned
- Background processing via python-apis microservice (internal change)
- Real-time status tracking and progress updates via **new status endpoints**
- Better resource utilization and scalability
- **Frontend URLs remain unchanged**

#### **Why the Change:**
- **User Experience**: No more long waits or timeout errors
- **System Reliability**: Prevents Azure Function timeouts (10-minute limit)
- **Scalability**: Multiple generations can run concurrently
- **Monitoring**: Real-time progress tracking and error handling
- **Backend Architecture**: Internal microservice handles heavy processing

---

## API Changes Summary

### Study Guides

| **Endpoint** | **Before** | **After** | **URL Changes** |
|-------------|------------|-----------|----------------|
| `POST /study-guides/{id}/generate-latex` | Returns complete LaTeX (5-25 min wait) | Returns job_id immediately (202 status) | **No URL change** |
| `GET /study-guides/{id}/latex` | Direct content retrieval | Same (retrieve after completion) | **No change** |
| **NEW** | N/A | `GET /study-guides/{id}/generation-status/{job_id}` | **New endpoint added** |

### Presentations

| **Endpoint** | **Before** | **After** | **URL Changes** |
|-------------|------------|-----------|----------------|
| `POST /presentations/{id}/generate-beamer` | Returns complete Beamer (8-20 min wait) | Returns job_id immediately (202 status) | **No URL change** |
| `GET /presentations/{id}/beamer` | Direct content retrieval | Same (retrieve after completion) | **No change** |
| **NEW** | N/A | `GET /presentations/{id}/generation-status/{job_id}` | **New endpoint added** |

### **Key Points:**
- ✅ **Existing endpoints work the same** - just different response format
- ✅ **Base URLs unchanged** - continue using your current Azure Functions URL
- ✅ **Authentication unchanged** - same headers and tokens
- 🆕 **New status endpoints added** - for job progress monitoring
- 🔄 **Response format changed** - job_id instead of immediate content

---

## Frontend Implementation Requirements

### 1. **Generation Flow Changes**

#### **Study Guide Generation (Same URL, Different Response):**
```javascript
// OLD APPROACH (Remove this behavior, keep the URL)
async function generateStudyGuide(unitId, options) {
  // SAME URL - don't change this
  const response = await fetch(`/api/study-guides/${unitId}/generate-latex`, {
    method: 'POST',
    body: JSON.stringify(options),
    timeout: 1800000 // 30 minutes - REMOVE THIS TIMEOUT
  });
  const result = await response.json(); 
  // OLD: Would contain complete LaTeX content
  return result.data.latex_content; // THIS BEHAVIOR CHANGES
}

// NEW APPROACH (Same URL, handle new response format)
async function startStudyGuideGeneration(unitId, options) {
  // SAME URL - no changes needed
  const response = await fetch(`/api/study-guides/${unitId}/generate-latex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
    // NO TIMEOUT NEEDED - returns immediately
  });
  
  // NEW: Check for 202 status instead of 200
  if (response.status === 202) {
    const data = await response.json();
    // NEW: Response contains job tracking info instead of content
    return {
      jobId: data.data.job_id,
      statusEndpoint: data.data.status_endpoint, // NEW endpoint for polling
      estimatedDuration: data.data.estimated_duration, // NEW progress info
      unitInfo: data.data.unit_info // NEW unit details
    };
  }
  throw new Error('Failed to start generation');
}
```

#### **Presentation Generation (Same URL, Different Response):**
```javascript
// NEW APPROACH - Same URL, new response handling
async function startPresentationGeneration(unitId, options) {
  // SAME URL - no changes to endpoint
  const response = await fetch(`/api/presentations/${unitId}/generate-beamer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generation_method: options.method || 'dynamic_slides',
      theme: options.theme || 'professional',
      color_scheme: options.colorScheme || 'blue',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    })
  });
  
  // NEW: 202 status instead of 200
  if (response.status === 202) {
    const data = await response.json();
    // NEW: Job tracking response instead of content
    return {
      jobId: data.data.job_id,
      statusEndpoint: data.data.status_endpoint, // NEW status checking URL
      estimatedDuration: data.data.estimated_duration,
      theme: data.data.theme,
      colorScheme: data.data.color_scheme
    };
  }
  throw new Error('Failed to start generation');
}
```

### 2. **NEW: Status Polling Implementation**

```javascript
// NEW FEATURE: Status polling for job progress
async function pollJobStatus(unitId, jobId, type = 'study-guides') {
  // NEW ENDPOINT: Status checking URLs
  const statusUrl = `/api/${type}/${unitId}/generation-status/${jobId}`;
  
  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      try {
        // NEW: Poll status endpoint every 30 seconds
        const response = await fetch(statusUrl);
        const data = await response.json();
        
        if (data.success) {
          const status = data.data.status;
          
          // NEW: Progress information available
          updateProgressUI({
            progress: data.data.progress,        // NEW: 0-100 progress
            currentStep: data.data.current_step, // NEW: Current processing step
            estimatedRemaining: data.data.estimated_remaining // NEW: Time estimate
          });
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            resolve(data.data);
          } else if (status === 'failed' || status === 'error') {
            clearInterval(pollInterval);
            reject(new Error(data.message || 'Generation failed'));
          }
          // Continue polling for: 'processing', 'queued', 'started'
        } else {
          clearInterval(pollInterval);
          reject(new Error(data.message));
        }
      } catch (error) {
        clearInterval(pollInterval);
        reject(error);
      }
    }, 30000); // Poll every 30 seconds
    
    // Timeout after 45 minutes (generous for long generations)
    setTimeout(() => {
      clearInterval(pollInterval);
      reject(new Error('Generation timeout'));
    }, 45 * 60 * 1000);
  });
}
```

### 3. **Complete Generation Workflow (New Process)**

```javascript
// NEW: Complete asynchronous generation workflow
async function generateStudyGuideWorkflow(unitId, options) {
  try {
    // Step 1: Start generation (same URL, new response)
    showLoadingState('Starting generation...');
    const jobInfo = await startStudyGuideGeneration(unitId, options);
    
    // Step 2: NEW - Show job started UI with progress tracking
    showJobStartedUI({
      jobId: jobInfo.jobId,
      estimatedDuration: jobInfo.estimatedDuration, // NEW info
      unitInfo: jobInfo.unitInfo                    // NEW info
    });
    
    // Step 3: NEW - Poll for status with real-time updates
    showProgressUI('Generation in progress...');
    const result = await pollJobStatus(unitId, jobInfo.jobId, 'study-guides');
    
    // Step 4: Generation completed
    showCompletionUI({
      message: 'Study guide generated successfully!',
      stats: result.generation_stats, // NEW: Processing statistics
      downloadAvailable: true
    });
    
    // Step 5: Enable content retrieval (existing endpoints work same)
    enableContentActions(unitId);
    
  } catch (error) {
    showErrorUI({
      message: error.message,
      canRetry: true
    });
  }
}
```

---

## NEW Features Added

### 1. **Progress Tracking**
```javascript
// NEW: Progress information in status responses
const progressData = {
  progress: 45,                    // NEW: 0-100 completion percentage  
  current_step: "Generating Chapter 3", // NEW: Current processing step
  estimated_remaining: "5-10 minutes",  // NEW: Time remaining estimate
  started_at: "2025-08-07T04:14:10Z",  // NEW: Start timestamp
  status: "processing"             // NEW: Detailed status
};
```

### 2. **Job Information**
```javascript
// NEW: Job details returned on generation start
const jobInfo = {
  job_id: "uuid-generated-job-id",        // NEW: Unique job identifier
  status_endpoint: "/study-guides/...",   // NEW: Status checking URL  
  estimated_duration: "10-25 minutes",    // NEW: Expected duration
  status_check_interval: "30 seconds",    // NEW: Recommended polling interval
  unit_info: {                           // NEW: Unit details for UI
    unit_code: "TEST104",
    unit_title: "Unit Title", 
    competency: "Competency Area"
  }
};
```

### 3. **Generation Statistics**
```javascript
// NEW: Detailed completion statistics
const completionStats = {
  generation_stats: {              // NEW: Processing metrics
    chapters_generated: 7,         // For study guides
    slides_generated: 25,          // For presentations  
    total_pages: 45,
    processing_time: "15m 35s",
    tokens_used: 125000
  }
};
```

---

## UI/UX Requirements

### 1. **NEW: Enhanced Progress UI Components**

```html
<!-- NEW: Progress tracking card -->
<div class="generation-progress">
  <div class="progress-header">
    <h3>Generating Study Guide</h3>
    <span class="job-id">Job: #{{jobId}}</span> <!-- NEW: Job ID display -->
  </div>
  
  <!-- NEW: Real-time progress bar -->
  <div class="progress-bar">
    <div class="progress-fill" style="width: {{progress}}%"></div>
    <span class="progress-text">{{progress}}%</span>
  </div>
  
  <!-- NEW: Detailed progress information -->
  <div class="progress-details">
    <p class="current-step">{{currentStep}}</p>           <!-- NEW -->
    <p class="estimated-time">Estimated remaining: {{estimatedRemaining}}</p> <!-- NEW -->
    <p class="elapsed-time">Running for: {{elapsedTime}}</p> <!-- NEW -->
  </div>
  
  <div class="unit-info">
    <span>{{unitCode}}: {{unitTitle}}</span>
  </div>
  
  <!-- NEW: Job management actions -->
  <div class="job-actions">
    <button onclick="refreshStatus()">Refresh Status</button>
    <button onclick="viewJobDetails()">Job Details</button>
  </div>
</div>
```

### 2. **Status Response Handling (NEW Information)**

#### **Job Status Values (NEW):**
- `queued` - Job submitted, waiting to start
- `started` - Job started processing  
- `processing` - Active generation in progress
- `completed` - Successfully completed
- `failed` - Generation failed
- `error` - System error occurred

#### **Progress Information (NEW):**
- `progress`: Number (0-100) - Completion percentage
- `current_step`: String - Current processing step description
- `estimated_remaining`: String - Time estimate ("5-10 minutes")
- `elapsed_time`: Calculated - How long job has been running

---

## Migration Summary

### **What Stays the Same:**
- ✅ **All base URLs** - No endpoint URL changes required
- ✅ **Authentication** - Same headers and tokens
- ✅ **Content retrieval** - GET endpoints work identically  
- ✅ **Request payloads** - Same JSON structures for generation options

### **What Changes:**
- 🔄 **Response format** - Generation endpoints return job_id instead of content
- 🔄 **Status codes** - 202 Accepted instead of 200 OK for generation
- 🔄 **Processing time** - Immediate response instead of long waits
- 🆕 **New endpoints** - Status checking URLs added
- 🆕 **Progress tracking** - Real-time progress and status information
- 🆕 **Error handling** - Better error messages and retry options

### **Migration Steps:**
1. **Update generation handlers** - Handle 202 response and job_id
2. **Add status polling** - Implement 30-second interval checking
3. **Add progress UI** - Show real-time generation progress  
4. **Update error handling** - Handle new async error scenarios
5. **Test workflow** - Verify complete async generation process

## Benefits for Users

1. **No more timeouts** - Generations never time out in browser
2. **Real-time progress** - Users see exactly what's happening step-by-step
3. **Background processing** - Users can navigate away and come back
4. **Better error handling** - Clear error messages and retry options
5. **Concurrent generations** - Multiple units can be processed simultaneously
6. **Detailed feedback** - Progress percentages, current steps, time estimates

This architecture provides a much better user experience while making the system more robust and scalable, **without requiring any base URL changes in the frontend**.