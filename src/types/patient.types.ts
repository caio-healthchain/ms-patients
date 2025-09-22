// Tipos compatíveis com o código existente do ms-patients
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  fullName: string;
  cpf: string;
  rg?: string;
  birthDate: Date | string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medicalRecordNumber?: string;
  admissionDate?: Date | string;
  roomNumber?: string;
  responsibleDoctor?: string;
  insurancePlan?: string;
  insuranceNumber?: string;
  insuranceValidity?: Date | string;
  accommodationType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface UpdatePatientRequest {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  cpf?: string;
  rg?: string;
  birthDate?: Date | string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  medicalRecordNumber?: string;
  admissionDate?: Date | string;
  roomNumber?: string;
  responsibleDoctor?: string;
  insurancePlan?: string;
  insuranceNumber?: string;
  insuranceValidity?: Date | string;
  accommodationType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  status?: string;
}

export interface PatientSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  name?: string;
  status?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  city?: string;
  state?: string;
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Enums para pacientes
export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DECEASED = 'deceased',
  BLOCKED = 'blocked'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  NOT_INFORMED = 'not_informed'
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown'
}

// Tipos para estatísticas de pacientes
export interface PatientStatistics {
  total: number;
  byStatus: Record<PatientStatus, number>;
  byGender: Record<Gender, number>;
  byBloodType: Record<BloodType, number>;
  byAgeGroup: {
    '0-18': number;
    '19-30': number;
    '31-50': number;
    '51-70': number;
    '70+': number;
  };
  averageAge: number;
  newPatientsThisMonth: number;
  newPatientsThisYear: number;
}

// Tipos para análise de risco
export interface PatientRiskAnalysis {
  patientId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: {
    age: number;
    chronicConditions: string[];
    allergies: string[];
    recentProcedures: number;
    emergencyVisits: number;
  };
  recommendations: string[];
  lastUpdated: Date;
}

