# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Setup
Before running the application, copy `.env.example` to `.env.local` and fill in the required values:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your actual Azure Functions key and API base URL.

### Testing
No test framework currently configured in this project.

## Architecture Overview

### Project Type
Next.js 15 application using App Router with TypeScript, serving as the frontend for SCEI (Southern Cross Education Institute) Management System.

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand with persistence
- **API Communication**: Axios with interceptors
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling
- **Query Management**: TanStack Query for server state

### Domain Architecture
The application supports two educational domains:
- `scei` - SCEI (vocational training)
- `scei-he` - SCEI Higher Education (university-level)

Domain is determined at login and affects:
- API endpoints and data filtering
- Available features and UI
- User permissions and access

### Authentication & API
- **Authentication**: JWT tokens stored in Zustand with persistence
- **API Base**: Azure Functions backend (configured via `NEXT_PUBLIC_API_BASE_URL` environment variable)
- **Headers**: All requests include Azure Functions key (from `NEXT_PUBLIC_AZURE_FUNCTIONS_KEY` env var) and domain context
- **Auto-logout**: 401 responses trigger automatic logout and redirect
- **Security**: Sensitive API keys are stored in environment variables, not in source code

### State Management Pattern
```typescript
// Global state with Zustand
const useAuthStore = create<AuthState>()(persist(...))
const useUIStore = create<UIState>()(persist(...))
```

### Component Architecture
- **Layout**: Persistent layout with sidebar navigation (`src/components/layout/`)
- **Forms**: Comprehensive unit forms with step-by-step and single-page variants
- **UI**: Consistent design system based on shadcn/ui
- **Auth**: Route protection with `AuthGuard` component

### Key Features
1. **Unit Management**: CRUD operations for educational units with detailed metadata
2. **Assessment Generation**: AI-powered assessment creation with different types and question formats
3. **Study Guide Generation**: LaTeX-based study material creation
4. **Presentation Generation**: Beamer-based presentation slides
5. **User Management**: Admin functions for user CRUD operations

### Assessment System Complexity
The assessment generation has two distinct systems:
- **SCEI Assessments**: Component filtering (PC/PE/KE) with questioning vs non-questioning types
- **HE Assessments**: Simpler university-level assessment generation

Special handling for questioning assessments (type ID: `6703c26d78548ed67f9862a6`):
- Requires `question_type` parameter
- Ignores component filtering
- Returns structured question arrays vs plain text

### File Structure Patterns
- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable components organized by purpose
- `src/lib/` - Utility functions and API configuration
- `src/store/` - Zustand state management
- `src/types/` - TypeScript type definitions
- `src/constants/` - Application constants and configurations

### API Integration
All API calls go through centralized axios instance with:
- Automatic token attachment
- Domain header injection
- Error handling and logout on 401
- Debug logging for assessment generation

### Form Patterns
Forms use React Hook Form with Zod schemas:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {...}
})
```

### Important Constants
- Assessment type IDs are hardcoded in `src/constants/index.ts`
- Domain values: `'scei'` | `'scei-he'`
- Question types for assessments: 6 predefined types for questioning assessments