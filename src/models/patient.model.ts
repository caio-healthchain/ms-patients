import mongoose, { Schema, Document } from 'mongoose';
import { Patient as PatientType, ValidationStatus } from '@/types';

// Interface para o documento MongoDB
export interface PatientDocument extends Document {
  // ID compatível com Prisma (CUID)
  id: string;
  
  // Identificação
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  
  // Contato
  phone: string;
  email: string;
  address: string;
  
  // Atendimento
  medicalRecordNumber: string;
  admissionDate: Date;
  roomNumber: string;
  responsibleDoctor: string;
  insurancePlan: string;
  
  // Plano de Saúde
  insuranceNumber: string;
  insuranceValidity: Date;
  accommodationType: 'apartment' | 'shared';
  currentAccommodation: 'apartment' | 'shared';
  accommodationStatus: 'correct' | 'incorrect';
  observations?: string;
  
  // Status
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  validationStatus: ValidationStatus;
  
  // Metadados para CQRS
  lastSyncedAt: Date;
  version: number;
  
  // Dados desnormalizados para otimização de leitura
  proceduresCount: number;
  totalBillingAmount: number;
  lastProcedureDate?: Date;
  pendingValidations: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Schema otimizado para leitura (CQRS)
const PatientSchema = new Schema<PatientDocument>({
  // ID compatível com Prisma (CUID)
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Identificação
  fullName: { 
    type: String, 
    required: true,
    index: true // Para busca por nome
  },
  cpf: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  rg: { 
    type: String, 
    required: true 
  },
  birthDate: { 
    type: Date, 
    required: true 
  },
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other'], 
    required: true 
  },
  
  // Contato
  phone: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  
  // Atendimento
  medicalRecordNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  admissionDate: { 
    type: Date, 
    required: true,
    index: true // Para filtros por data
  },
  roomNumber: { 
    type: String, 
    required: true,
    index: true // Para busca por quarto
  },
  responsibleDoctor: { 
    type: String, 
    required: true,
    index: true // Para filtros por médico
  },
  insurancePlan: { 
    type: String, 
    required: true,
    index: true // Para relatórios por convênio
  },
  
  // Plano de Saúde
  insuranceNumber: { 
    type: String, 
    required: true 
  },
  insuranceValidity: { 
    type: Date, 
    required: true 
  },
  accommodationType: { 
    type: String, 
    enum: ['APARTMENT', 'shared'], 
    required: true 
  },
  currentAccommodation: { 
    type: String, 
    enum: ['APARTMENT', 'shared'], 
    required: true 
  },
  accommodationStatus: { 
    type: String, 
    enum: ['correct', 'incorrect'], 
    required: true 
  },
  observations: { 
    type: String 
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'transferred', 'discharged'], 
    required: true,
    index: true
  },
  validationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'under_review'], 
    required: true,
    index: true
  },
  
  // Metadados para CQRS
  lastSyncedAt: { 
    type: Date, 
    default: Date.now 
  },
  version: { 
    type: Number, 
    default: 1 
  },
  
  // Dados desnormalizados para otimização
  proceduresCount: { 
    type: Number, 
    default: 0 
  },
  totalBillingAmount: { 
    type: Number, 
    default: 0 
  },
  lastProcedureDate: { 
    type: Date 
  },
  pendingValidations: { 
    type: Number, 
    default: 0 
  },
  
  // Soft delete
  deletedAt: { 
    type: Date 
  }
}, {
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  collection: 'patients_read', // Nome específico da collection
  _id: false, // Desabilita _id automático
  id: false, // Desabilita virtual id
  // Configurações específicas para Cosmos DB
  shardKey: { cpf: 1 }, // Para particionamento no Cosmos DB
});

// Índices compostos para consultas otimizadas
PatientSchema.index({ status: 1, validationStatus: 1 });
PatientSchema.index({ insurancePlan: 1, status: 1 });
PatientSchema.index({ responsibleDoctor: 1, admissionDate: -1 });
PatientSchema.index({ roomNumber: 1, status: 1 });
PatientSchema.index({ admissionDate: -1, status: 1 });

// Índice de texto para busca full-text
PatientSchema.index({ 
  fullName: 'text', 
  cpf: 'text', 
  medicalRecordNumber: 'text' 
});

// Middleware para soft delete
PatientSchema.pre(/^find/, function(this: any) {
  // Excluir documentos deletados por padrão
  this.where({ deletedAt: { $exists: false } });
});

// Métodos do schema
PatientSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

PatientSchema.methods.restore = function() {
  this.deletedAt = undefined;
  return this.save();
};

// Métodos estáticos para consultas otimizadas
PatientSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

PatientSchema.statics.findByInsurancePlan = function(plan: string) {
  return this.find({ insurancePlan: plan });
};

PatientSchema.statics.findPendingValidation = function() {
  return this.find({ validationStatus: 'pending' });
};

PatientSchema.statics.searchByName = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: 'textScore' } });
};

// Virtual para idade
PatientSchema.virtual('age').get(function() {
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual para dias de internação
PatientSchema.virtual('daysAdmitted').get(function() {
  const today = new Date();
  const admissionDate = new Date(this.admissionDate);
  const diffTime = Math.abs(today.getTime() - admissionDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Configurar virtuals no JSON
PatientSchema.set('toJSON', { virtuals: true });
PatientSchema.set('toObject', { virtuals: true });

// Exportar o modelo
export const PatientReadModel = mongoose.model<PatientDocument>('Patient', PatientSchema);

// Tipo para criação de novos documentos
export interface CreatePatientReadModel {
  id: string; // ID do Prisma (CUID)
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  address: string;
  medicalRecordNumber: string;
  admissionDate: Date;
  roomNumber: string;
  responsibleDoctor: string;
  insurancePlan: string;
  insuranceNumber: string;
  insuranceValidity: Date;
  accommodationType: 'apartment' | 'shared';
  currentAccommodation: 'apartment' | 'shared';
  accommodationStatus: 'correct' | 'incorrect';
  observations?: string;
  status: 'active' | 'inactive' | 'transferred' | 'discharged';
  validationStatus: ValidationStatus;
}

