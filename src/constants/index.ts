export const API_BASE_URL = 'http://localhost:7071/api';

export const DOMAINS = {
  SCEI: 'scei',
  SCEI_HE: 'scei-he'
} as const;

export const ASSESSMENT_TYPES = {
  QUESTIONING: '6703c26d78548ed67f9862a6',
  CASE_STUDY: '6703c26d78548ed67f9862a7',
  ROLE_PLAY: '6703c26d78548ed67f9862a8',
  WORKPLACE_ASSESSMENT: '6703c26d78548ed67f9862a9',
} as const;

export const QUESTION_TYPES = {
  DIRECT_KNOWLEDGE: 'direct_knowledge',
  PROCEDURAL: 'procedural',
  SCENARIO_BASED: 'scenario_based',
  REFLECTION_BASED: 'reflection_based',
  SITUATIONAL_JUDGEMENT: 'situational_judgement',
  COMPARISON_ANALYSIS: 'comparison_analysis',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  UNITS: '/units',
  USERS: '/users',
  ASSESSMENTS: '/assessments',
  STUDY_GUIDES: '/study-guides',
  PRESENTATIONS: '/presentations',
} as const;