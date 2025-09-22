import { PatientRepository } from '../repositories/patient.repository';
import { logger } from '../config/logger';
import { 
  Patient, 
  CreatePatientRequest, 
  UpdatePatientRequest, 
  PatientSearchFilters, 
  PaginationParams, 
  PaginatedResponse,
  PatientStatistics,
  ApiResponse
} from '@/types';
import { AppError } from '../middleware/error-handler';
import { eventBusService } from '../config/eventbus';
// import { eventBusService } from '../config/kafka'; // Disabled for MVP1

export class PatientService {
  private patientRepository: PatientRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
  }

  async createPatient(data: CreatePatientRequest, userId: string): Promise<ApiResponse<Patient>> {
    try {
      // Validate business rules
      await this.validateCreatePatient(data);

      // Create patient
      const patient = await this.patientRepository.create(data);

      // Publish event
      await eventBusService.publishPatientCreated(patient);

      // Log audit
      logger.info('Patient created:', { 
        patientId: patient.id, 
        userId,
        cpf: data.cpf 
      });

      return {
        success: true,
        data: patient,
        message: 'Patient created successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to create patient:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to create patient', 500);
    }
  }

  async updatePatient(id: string, data: UpdatePatientRequest, userId: string): Promise<ApiResponse<Patient>> {
    try {
      // Check if patient exists
      const existingPatient = await this.patientRepository.findById(id);
      if (!existingPatient) {
        throw new AppError('Patient not found', 404);
      }

      // Validate business rules
      await this.validateUpdatePatient(id, data);

      // Update patient
      const patient = await this.patientRepository.update(id, data);

      // Publish event
      await eventBusService.publishPatientUpdated(id, existingPatient, patient);

      // Log audit
      logger.info('Patient updated:', { 
        patientId: id, 
        userId,
        changes: this.getChanges(existingPatient, patient)
      });

      return {
        success: true,
        data: patient,
        message: 'Patient updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to update patient:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to update patient', 500);
    }
  }

  async deletePatient(id: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Check if patient exists
      const existingPatient = await this.patientRepository.findById(id);
      if (!existingPatient) {
        throw new AppError('Patient not found', 404);
      }

      // Validate business rules for deletion
      await this.validateDeletePatient(id);

      // Delete patient (soft delete)
      await this.patientRepository.delete(id);

      // Publish event
      await eventBusService.publishPatientDeleted(id, existingPatient);

      // Log audit
      logger.info('Patient deleted:', { 
        patientId: id, 
        userId,
        cpf: existingPatient.cpf
      });

      return {
        success: true,
        message: 'Patient deleted successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to delete patient:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to delete patient', 500);
    }
  }

  async getPatientById(id: string): Promise<ApiResponse<Patient>> {
    try {
      const patient = await this.patientRepository.findById(id);
      
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      return {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get patient:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to get patient', 500);
    }
  }

  async getPatientByCpf(cpf: string): Promise<ApiResponse<Patient>> {
    try {
      const patient = await this.patientRepository.findByCpf(cpf);
      
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      return {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get patient by CPF:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to get patient', 500);
    }
  }

  async getPatientByMedicalRecord(medicalRecordNumber: string): Promise<ApiResponse<Patient>> {
    try {
      const patient = await this.patientRepository.findByMedicalRecord(medicalRecordNumber);
      
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      return {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get patient by medical record:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to get patient', 500);
    }
  }

  async searchPatients(
    filters: PatientSearchFilters,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    try {
      const result = await this.patientRepository.findMany(filters, pagination);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to search patients:', error);
      throw new AppError('Failed to search patients', 500);
    }
  }

  async getPatientStatistics(): Promise<ApiResponse<PatientStatistics>> {
    try {
      // This would typically involve complex aggregation queries
      // For now, implementing basic statistics
      const stats: PatientStatistics = {
        total: 0,
        byStatus: {
          active: 0,
          inactive: 0,
          deceased: 0,
          blocked: 0
        },
        byGender: {
          male: 0,
          female: 0,
          other: 0,
          not_informed: 0
        },
        byBloodType: {
          'A+': 0,
          'A-': 0,
          'B+': 0,
          'B-': 0,
          'AB+': 0,
          'AB-': 0,
          'O+': 0,
          'O-': 0,
          unknown: 0
        },
        byAgeGroup: {
          '0-18': 0,
          '19-30': 0,
          '31-50': 0,
          '51-70': 0,
          '70+': 0
        },
        averageAge: 0,
        newPatientsThisMonth: 0,
        newPatientsThisYear: 0
      };

      // TODO: Implement actual statistics queries
      // This would involve MongoDB aggregation pipelines

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get patient statistics:', error);
      throw new AppError('Failed to get statistics', 500);
    }
  }

  async validatePatient(id: string, validationStatus: string, userId: string): Promise<ApiResponse<Patient>> {
    try {
      const patient = await this.patientRepository.findById(id);
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      // Update validation status
      const updatedPatient = await this.patientRepository.update(id, {
        id,
        // Add validation status to update request type if needed
      });

      // Publish validation event
      await eventBusService.publishPatientValidated(id, {
        status: validationStatus,
        validatedBy: userId,
        validatedAt: new Date()
      });

      logger.info('Patient validated:', { 
        patientId: id, 
        validationStatus,
        userId
      });

      return {
        success: true,
        data: updatedPatient,
        message: 'Patient validation updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to validate patient:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to validate patient', 500);
    }
  }

  // PRIVATE VALIDATION METHODS
  private async validateCreatePatient(data: CreatePatientRequest): Promise<void> {
    // Check if CPF already exists
    const existingByCpf = await this.patientRepository.findByCpf(data.cpf);
    if (existingByCpf) {
      throw new AppError('Patient with this CPF already exists', 409);
    }

    // Check if medical record already exists (only if provided)
    if (data.medicalRecordNumber) {
      const existingByRecord = await this.patientRepository.findByMedicalRecord(data.medicalRecordNumber);
      if (existingByRecord) {
        throw new AppError('Patient with this medical record number already exists', 409);
      }
    }

    // Validate CPF format
    if (!this.isValidCpf(data.cpf)) {
      throw new AppError('Invalid CPF format', 400);
    }

    // Validate dates
    const birthDate = new Date(data.birthDate);
    const admissionDate = data.admissionDate ? new Date(data.admissionDate) : null;
    const insuranceValidity = data.insuranceValidity ? new Date(data.insuranceValidity) : null;
    const now = new Date();

    if (birthDate > now) {
      throw new AppError('Birth date cannot be in the future', 400);
    }

    if (admissionDate && admissionDate > now) {
      throw new AppError('Admission date cannot be in the future', 400);
    }

    if (insuranceValidity && insuranceValidity < now) {
      throw new AppError('Insurance validity date must be in the future', 400);
    }

    // Validate age (must be reasonable)
    const age = now.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 150) {
      throw new AppError('Invalid birth date', 400);
    }
  }

  private async validateUpdatePatient(id: string, data: UpdatePatientRequest): Promise<void> {
    // Check CPF uniqueness if being updated
    if (data.cpf) {
      const existingByCpf = await this.patientRepository.findByCpf(data.cpf);
      if (existingByCpf && existingByCpf.id !== id) {
        throw new AppError('Patient with this CPF already exists', 409);
      }

      if (!this.isValidCpf(data.cpf)) {
        throw new AppError('Invalid CPF format', 400);
      }
    }

    // Check medical record uniqueness if being updated
    if (data.medicalRecordNumber) {
      const existingByRecord = await this.patientRepository.findByMedicalRecord(data.medicalRecordNumber);
      if (existingByRecord && existingByRecord.id !== id) {
        throw new AppError('Patient with this medical record already exists', 409);
      }
    }

    // Validate dates if being updated
    const now = new Date();

    if (data.birthDate) {
      const birthDate = new Date(data.birthDate);
      if (birthDate > now) {
        throw new AppError('Birth date cannot be in the future', 400);
      }

      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 150) {
        throw new AppError('Invalid birth date', 400);
      }
    }

    if (data.admissionDate) {
      const admissionDate = new Date(data.admissionDate);
      if (admissionDate > now) {
        throw new AppError('Admission date cannot be in the future', 400);
      }
    }

    if (data.insuranceValidity) {
      const insuranceValidity = new Date(data.insuranceValidity);
      if (insuranceValidity < now) {
        throw new AppError('Insurance validity date must be in the future', 400);
      }
    }
  }

  private async validateDeletePatient(id: string): Promise<void> {
    // Add business rules for deletion
    // For example: check if patient has active procedures, pending billing, etc.
    
    // TODO: Check for related records that would prevent deletion
    // This would involve checking procedures, billing items, etc.
  }

  // UTILITY METHODS
  private isValidCpf(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Check if has 11 digits
    if (cleanCpf.length !== 11) return false;
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validate CPF algorithm
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
    
    return true;
  }

  private getChanges(oldData: any, newData: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};
    
    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key],
        };
      }
    }
    
    return changes;
  }
}

