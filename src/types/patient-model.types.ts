// Tipos para o modelo de dados do paciente
export interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  cpf: string;
  rg?: string;
  birthDate: Date;
  gender: string;
  phone: string;
  email: string;
  address: string;
  medicalRecordNumber?: string;
  admissionDate?: Date;
  roomNumber?: string;
  responsibleDoctor?: string;
  insurancePlan?: string;
  insuranceNumber?: string;
  insuranceValidity?: Date;
  accommodationType?: string;
  currentAccommodation?: string;
  accommodationStatus?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  observations?: string;
  status: string;
  validationStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export interface PatientDocument extends Patient {
  _id: string;
}

