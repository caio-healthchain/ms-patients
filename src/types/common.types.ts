// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    kafka: 'connected' | 'disconnected';
  };
}

// Tipos de filtros e busca
export interface BaseSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

// Tipos de auditoria
export interface AuditInfo {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  version: number;
}

// Tipos de endereço
export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Tipos de contato
export interface Contact {
  type: 'phone' | 'email' | 'whatsapp';
  value: string;
  isPrimary: boolean;
}

// Tipos de identificação
export interface Identification {
  type: 'cpf' | 'rg' | 'passport' | 'cns';
  value: string;
  issuer?: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

