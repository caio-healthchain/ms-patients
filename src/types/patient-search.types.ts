// Tipos para busca e filtros de pacientes
export interface PatientSearchFilters {
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  status?: string;
  gender?: string;
  roomNumber?: string;
  insurancePlan?: string;
  responsibleDoctor?: string;
  admissionDateFrom?: string | Date;
  admissionDateTo?: string | Date;
  birthDateFrom?: string | Date;
  birthDateTo?: string | Date;
  accommodationType?: string;
  validationStatus?: string;
}

