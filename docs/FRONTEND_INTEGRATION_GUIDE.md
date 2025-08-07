# Frontend Integration Guide for SCEI Generation APIs

## Overview

This guide provides comprehensive instructions for integrating the new asynchronous SCEI (Study Guide and Presentation) generation APIs with the frontend. The new system uses job-based processing with progress tracking instead of synchronous generation.

## Key Changes from Legacy APIs

### Old Flow (Synchronous)
1. POST request to generate PDF
2. Wait for complete response (blocking)
3. GET request to fetch LaTeX/Beamer content
4. Display results

### New Flow (Asynchronous)
1. POST request to start generation job
2. Receive job_id immediately
3. Poll generation status with progress updates
4. GET request to fetch results when complete
5. Display results with enhanced metadata

## API Endpoints

### 1. Study Guide Generation

#### Start Generation Job
```http
POST /api/study-guides/{unit_id}/generate
Content-Type: application/json

{
  "generation_method": "dynamic_chapters", // or "dynamic_multi_call"
  "user_timezone": "UTC" // optional, defaults to UTC
}
```

**Response:**
```json
{
  "success": true,
  "job_id": "03ff57b5-cdc8-4dc6-98a6-68e229b5671a",
  "message": "Study guide generation started",
  "estimated_duration": "10-25 minutes"
}
```

#### Check Generation Status
```http
GET /api/study-guides/{unit_id}/generation-status/{job_id}
```

**Response (In Progress):**
```json
{
  "success": true,
  "job_id": "03ff57b5-cdc8-4dc6-98a6-68e229b5671a",
  "status": "processing",
  "progress": 45,
  "current_step": "Generating Chapter 3: Practical Application",
  "created_at": "2025-01-07T10:30:00Z",
  "started_at": "2025-01-07T10:30:05Z"
}
```

**Response (Completed):**
```json
{
  "success": true,
  "job_id": "03ff57b5-cdc8-4dc6-98a6-68e229b5671a",
  "status": "completed",
  "progress": 100,
  "current_step": "Study guide generated successfully",
  "created_at": "2025-01-07T10:30:00Z",
  "started_at": "2025-01-07T10:30:05Z",
  "completed_at": "2025-01-07T10:45:30Z"
}
```

**Response (Failed):**
```json
{
  "success": true,
  "job_id": "03ff57b5-cdc8-4dc6-98a6-68e229b5671a",
  "status": "failed",
  "progress": 0,
  "current_step": "Processing failed",
  "error_message": "OpenAI API rate limit exceeded"
}
```

#### Get Generation Result
```http
GET /api/study-guides/{unit_id}/generation-result/{job_id}
```

**Response:**
```json
{
  "success": true,
  "job_id": "03ff57b5-cdc8-4dc6-98a6-68e229b5671a",
  "job_type": "study_guide",
  "result": {
    "_id": "67d3f...",
    "unit_id": "6886f0e3931ec9ae9fa34435",
    "latex_content": "\\documentclass{article}...",
    "content_analysis": {
      "chapters": [...],
      "sections": [...],
      "total_sections": 15
    },
    "page_estimate": {
      "estimated_pages": 55,
      "word_count": 12500
    },
    "validation_issues": [],
    "generation_method": "dynamic_chapters",
    "generated_at": "2025-01-07T10:45:30Z",
    "content_type": "latex"
  },
  "processing_stats": {
    "unit_code": "BSBMKG552",
    "dynamic_chapters": [...],
    "generation_method": "dynamic_chapters"
  }
}
```

### 2. Presentation Generation

#### Start Generation Job
```http
POST /api/presentations/{unit_id}/generate
Content-Type: application/json

{
  "generation_method": "dynamic_slides", // or "dynamic_multi_call"
  "theme": "madrid", // optional, defaults to "madrid"
  "color_scheme": "default", // optional, defaults to "default"
  "user_timezone": "UTC" // optional, defaults to UTC
}
```

#### Check Generation Status
```http
GET /api/presentations/{unit_id}/generation-status/{job_id}
```

#### Get Generation Result
```http
GET /api/presentations/{unit_id}/generation-result/{job_id}
```

**Response includes `beamer_content` instead of `latex_content` and `slide_estimate` instead of `page_estimate`**

## Frontend Implementation Strategy

### 1. Job Management System

Create a job management system to handle multiple concurrent generation jobs:

```javascript
class SCEIJobManager {
  constructor() {
    this.activeJobs = new Map();
    this.pollingInterval = 2000; // 2 seconds
    this.maxPollingDuration = 1800000; // 30 minutes
  }

  async startGeneration(type, unitId, options = {}) {
    const endpoint = type === 'study_guide' 
      ? `/api/study-guides/${unitId}/generate`
      : `/api/presentations/${unitId}/generate`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.startPolling(type, unitId, result.job_id);
        return result;
      }
      
      throw new Error(result.message);
    } catch (error) {
      console.error('Failed to start generation:', error);
      throw error;
    }
  }

  startPolling(type, unitId, jobId) {
    const jobKey = `${type}_${unitId}_${jobId}`;
    const startTime = Date.now();
    
    const poll = async () => {
      try {
        const status = await this.checkStatus(type, unitId, jobId);
        
        // Emit progress event
        this.emit('progress', { type, unitId, jobId, status });
        
        if (status.status === 'completed') {
          const result = await this.getResult(type, unitId, jobId);
          this.emit('completed', { type, unitId, jobId, result });
          this.activeJobs.delete(jobKey);
        } else if (status.status === 'failed') {
          this.emit('failed', { type, unitId, jobId, error: status.error_message });
          this.activeJobs.delete(jobKey);
        } else if (Date.now() - startTime > this.maxPollingDuration) {
          this.emit('timeout', { type, unitId, jobId });
          this.activeJobs.delete(jobKey);
        } else {
          // Continue polling
          setTimeout(poll, this.pollingInterval);
        }
      } catch (error) {
        this.emit('error', { type, unitId, jobId, error: error.message });
        this.activeJobs.delete(jobKey);
      }
    };
    
    this.activeJobs.set(jobKey, { poll, startTime });
    poll();
  }

  async checkStatus(type, unitId, jobId) {
    const endpoint = type === 'study_guide'
      ? `/api/study-guides/${unitId}/generation-status/${jobId}`
      : `/api/presentations/${unitId}/generation-status/${jobId}`;
    
    const response = await fetch(endpoint);
    return await response.json();
  }

  async getResult(type, unitId, jobId) {
    const endpoint = type === 'study_guide'
      ? `/api/study-guides/${unitId}/generation-result/${jobId}`
      : `/api/presentations/${unitId}/generation-result/${jobId}`;
    
    const response = await fetch(endpoint);
    return await response.json();
  }

  // Event emitter methods
  emit(event, data) {
    // Implement your event system (custom events, Redux, etc.)
  }
}
```

### 2. UI Components

#### Progress Indicator Component

```javascript
function GenerationProgress({ jobStatus, onCancel }) {
  const { status, progress, current_step, estimated_duration } = jobStatus;
  
  return (
    <div className="generation-progress">
      <div className="progress-header">
        <h3>Generating Content...</h3>
        <button onClick={onCancel} className="cancel-btn">Cancel</button>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="progress-info">
        <p>{current_step}</p>
        <p className="progress-percentage">{progress}%</p>
      </div>
      
      {estimated_duration && (
        <p className="estimated-time">
          Estimated time: {estimated_duration}
        </p>
      )}
    </div>
  );
}
```

#### Generation Options Component

```javascript
function GenerationOptions({ type, onGenerate }) {
  const [options, setOptions] = useState({
    generation_method: type === 'study_guide' ? 'dynamic_chapters' : 'dynamic_slides',
    theme: 'madrid',
    color_scheme: 'default',
    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  return (
    <div className="generation-options">
      <div className="option-group">
        <label>Generation Method:</label>
        <select 
          value={options.generation_method}
          onChange={(e) => setOptions({...options, generation_method: e.target.value})}
        >
          <option value={type === 'study_guide' ? 'dynamic_chapters' : 'dynamic_slides'}>
            Single Call (Faster)
          </option>
          <option value="dynamic_multi_call">
            Multi Call (More Detailed)
          </option>
        </select>
      </div>
      
      {type === 'presentation' && (
        <>
          <div className="option-group">
            <label>Theme:</label>
            <select 
              value={options.theme}
              onChange={(e) => setOptions({...options, theme: e.target.value})}
            >
              <option value="madrid">Madrid</option>
              <option value="berlin">Berlin</option>
              <option value="warsaw">Warsaw</option>
            </select>
          </div>
          
          <div className="option-group">
            <label>Color Scheme:</label>
            <select 
              value={options.color_scheme}
              onChange={(e) => setOptions({...options, color_scheme: e.target.value})}
            >
              <option value="default">Default</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
            </select>
          </div>
        </>
      )}
      
      <button onClick={() => onGenerate(options)}>
        Generate {type === 'study_guide' ? 'Study Guide' : 'Presentation'}
      </button>
    </div>
  );
}
```

### 3. State Management Integration

#### Redux Actions Example

```javascript
// actions.js
export const GENERATION_ACTIONS = {
  START_GENERATION: 'START_GENERATION',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  GENERATION_COMPLETED: 'GENERATION_COMPLETED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  CLEAR_GENERATION: 'CLEAR_GENERATION'
};

export const startGeneration = (type, unitId, options) => async (dispatch) => {
  dispatch({
    type: GENERATION_ACTIONS.START_GENERATION,
    payload: { type, unitId, status: 'starting' }
  });

  try {
    const jobManager = new SCEIJobManager();
    const result = await jobManager.startGeneration(type, unitId, options);
    
    jobManager.on('progress', (data) => {
      dispatch({
        type: GENERATION_ACTIONS.UPDATE_PROGRESS,
        payload: data
      });
    });
    
    jobManager.on('completed', (data) => {
      dispatch({
        type: GENERATION_ACTIONS.GENERATION_COMPLETED,
        payload: data
      });
    });
    
    jobManager.on('failed', (data) => {
      dispatch({
        type: GENERATION_ACTIONS.GENERATION_FAILED,
        payload: data
      });
    });
    
  } catch (error) {
    dispatch({
      type: GENERATION_ACTIONS.GENERATION_FAILED,
      payload: { error: error.message }
    });
  }
};
```

#### Reducer Example

```javascript
// reducer.js
const initialState = {
  activeGenerations: {},
  generationHistory: [],
  results: {}
};

export const generationReducer = (state = initialState, action) => {
  switch (action.type) {
    case GENERATION_ACTIONS.START_GENERATION:
      return {
        ...state,
        activeGenerations: {
          ...state.activeGenerations,
          [`${action.payload.type}_${action.payload.unitId}`]: {
            ...action.payload,
            startTime: Date.now()
          }
        }
      };
      
    case GENERATION_ACTIONS.UPDATE_PROGRESS:
      const key = `${action.payload.type}_${action.payload.unitId}`;
      return {
        ...state,
        activeGenerations: {
          ...state.activeGenerations,
          [key]: {
            ...state.activeGenerations[key],
            ...action.payload.status
          }
        }
      };
      
    case GENERATION_ACTIONS.GENERATION_COMPLETED:
      const completedKey = `${action.payload.type}_${action.payload.unitId}`;
      return {
        ...state,
        activeGenerations: {
          ...state.activeGenerations,
          [completedKey]: undefined
        },
        results: {
          ...state.results,
          [completedKey]: action.payload.result
        },
        generationHistory: [
          ...state.generationHistory,
          {
            ...action.payload,
            completedAt: Date.now()
          }
        ]
      };
      
    default:
      return state;
  }
};
```

## Error Handling Strategy

### 1. Network Errors
- Implement retry logic for failed requests
- Show user-friendly error messages
- Provide option to restart generation

### 2. Timeout Handling
- Set maximum polling duration (30 minutes recommended)
- Allow user to extend timeout if needed
- Save job_id for later retrieval

### 3. Rate Limiting
- Implement exponential backoff for polling
- Handle 429 responses gracefully
- Queue multiple requests appropriately

## Performance Optimizations

### 1. Efficient Polling
```javascript
class AdaptivePolling {
  constructor(initialInterval = 2000) {
    this.interval = initialInterval;
    this.maxInterval = 10000; // 10 seconds max
    this.consecutiveNoChanges = 0;
  }
  
  getNextInterval(progressChanged) {
    if (progressChanged) {
      // Reset to fast polling when progress is made
      this.consecutiveNoChanges = 0;
      this.interval = 2000;
    } else {
      // Gradually increase interval if no progress
      this.consecutiveNoChanges++;
      if (this.consecutiveNoChanges > 3) {
        this.interval = Math.min(this.interval * 1.5, this.maxInterval);
      }
    }
    
    return this.interval;
  }
}
```

### 2. Background Processing
- Use Web Workers for job management
- Implement service worker for offline support
- Cache results locally for quick access

### 3. Multiple Job Management
- Limit concurrent generations per user
- Queue additional requests
- Show all active jobs in a dashboard

## Migration Steps

### Phase 1: Backend Integration
1. Update API client to use new endpoints
2. Implement job management system
3. Test with single generation type

### Phase 2: UI Updates
1. Replace synchronous loading with progress indicators
2. Add generation options interface
3. Implement result display components

### Phase 3: Enhanced Features
1. Add generation history
2. Implement result caching
3. Add export/download functionality

### Phase 4: Performance & UX
1. Optimize polling strategy
2. Add background generation support
3. Implement error recovery

## Testing Strategy

### 1. Unit Tests
- Job manager functionality
- Progress calculation
- Error handling scenarios

### 2. Integration Tests
- Full generation workflow
- Multiple concurrent jobs
- Network failure recovery

### 3. User Testing
- Progress indicator clarity
- Generation options usability
- Error message comprehension

## Monitoring & Analytics

### 1. Track Key Metrics
- Generation success rate
- Average generation time
- User abandonment rate
- Error frequency by type

### 2. Performance Monitoring
- API response times
- Polling efficiency
- Client-side performance impact

### 3. User Experience Metrics
- Time to first progress update
- User satisfaction with progress visibility
- Feature adoption rates

## Security Considerations

1. **Job ID Protection**: Ensure job IDs are not predictable
2. **User Authorization**: Verify user permissions for each unit
3. **Rate Limiting**: Implement client-side rate limiting
4. **Data Validation**: Validate all API responses
5. **CORS Handling**: Proper cross-origin request management

## Conclusion

This guide provides a comprehensive framework for migrating from synchronous to asynchronous SCEI generation. The key benefits include:

- **Better User Experience**: Real-time progress updates
- **Improved Performance**: Non-blocking operations
- **Enhanced Reliability**: Better error handling and recovery
- **Scalability**: Support for multiple concurrent generations

Follow the implementation phases systematically, test thoroughly, and monitor the system post-deployment for optimal results.