// Exportar todos os tipos internos do microsserviço
export * from './auth.types';
export * from './common.types';
export * from './patient.types';
export * from './patient-model.types';
export * from './patient-search.types';

// Re-exportar tipos específicos para facilitar o uso
export type {
  JWTPayload,
  AuthenticatedUser,
  PaginationParams,
  ValidationStatus
} from './auth.types';

// Exportar enum como valor (não como type)
export { UserRole } from './auth.types';

export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  HealthCheckResponse,
  Address,
  Contact,
  Identification
} from './common.types';

export type {
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchFilters,
  PatientStatistics,
  PatientRiskAnalysis,
  PatientStatus,
  Gender,
  BloodType
} from './patient.types';

export type {
  PatientSearchFilters as SearchFilters
} from './patient-search.types';

export type {
  Patient,
  PatientDocument
} from './patient-model.types';

