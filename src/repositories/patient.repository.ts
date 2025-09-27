import { PrismaClient } from '@prisma/client';
import { PatientReadModel, PatientDocument, CreatePatientReadModel } from '../models/patient.model';
import { prisma } from '../config/database';
//import { cacheUtils } from '../config/database';
import { logger } from '../config/logger';
import { 
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  PaginationParams,
  PaginatedResponse
} from '@/types';
import { PatientSearchFilters } from '@/types/patient-search.types';

export class PatientRepository {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'patient:';

  // WRITE OPERATIONS (PostgreSQL)
  async create(data: CreatePatientRequest): Promise<Patient> {
    try {
      const patient = await prisma.patient.create({
        data: {
          fullName: data.fullName,
          cpf: data.cpf,
          rg: data.rg || '',
          birthDate: new Date(data.birthDate),
          gender: data.gender.toUpperCase() as any,
          phone: data.phone,
          email: data.email,
          address: data.address,
          medicalRecordNumber: data.medicalRecordNumber || '',
          admissionDate: data.admissionDate ? new Date(data.admissionDate) : new Date(),
          roomNumber: data.roomNumber || '',
          responsibleDoctor: data.responsibleDoctor || '',
          insurancePlan: data.insurancePlan || '',
          insuranceNumber: data.insuranceNumber || '',
          insuranceValidity: data.insuranceValidity ? new Date(data.insuranceValidity) : new Date(),
          accommodationType: data.accommodationType ? data.accommodationType.toUpperCase() as any : undefined,
          currentAccommodation: data.accommodationType ? data.accommodationType.toUpperCase() as any : 'STANDARD',
          accommodationStatus: 'CORRECT',
          observations: '',
          status: 'ACTIVE',
          validationStatus: 'PENDING'
        }
      });

      // Sync to read database (MongoDB/Cosmos DB)
      await this.syncToReadDatabase(patient);

      // Clear related cache
      //await this.clearPatientCache(patient.id);

      logger.info('Patient created successfully:', { patientId: patient.id });
      return this.mapPrismaToPatient(patient);
    } catch (error) {
      logger.error('Failed to create patient:', error);
      throw error;
    }
  }

  async update(id: string, data: UpdatePatientRequest): Promise<Patient> {
    try {
      const patient = await prisma.patient.update({
        where: { id },
        data: {
          ...(data.fullName && { fullName: data.fullName }),
          ...(data.cpf && { cpf: data.cpf }),
          ...(data.rg && { rg: data.rg }),
          ...(data.birthDate && { birthDate: new Date(data.birthDate) }),
          ...(data.gender && { gender: data.gender.toUpperCase() as any }),
          ...(data.phone && { phone: data.phone }),
          ...(data.email && { email: data.email }),
          ...(data.address && { address: data.address }),
          ...(data.medicalRecordNumber && { medicalRecordNumber: data.medicalRecordNumber }),
          ...(data.admissionDate && { admissionDate: new Date(data.admissionDate) }),
          ...(data.roomNumber && { roomNumber: data.roomNumber }),
          ...(data.responsibleDoctor && { responsibleDoctor: data.responsibleDoctor }),
          ...(data.insurancePlan && { insurancePlan: data.insurancePlan }),
          ...(data.insuranceNumber && { insuranceNumber: data.insuranceNumber }),
          ...(data.insuranceValidity && { insuranceValidity: new Date(data.insuranceValidity) }),
          ...(data.accommodationType && { accommodationType: data.accommodationType.toUpperCase() as any }),
          ...(data.accommodationType !== undefined && { accommodationType: data.accommodationType.toUpperCase() }),
        }
      });

      // Sync to read database
      await this.syncToReadDatabase(patient);

      // Clear cache
     // await this.clearPatientCache(id);

      logger.info('Patient updated successfully:', { patientId: id });
      return this.mapPrismaToPatient(patient);
    } catch (error) {
      logger.error('Failed to update patient:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await prisma.patient.delete({
        where: { id },
      });

      // Soft delete in read database

      // Clear cache
      //await this.clearPatientCache(id);

      logger.info('Patient deleted successfully:', { patientId: id });
    } catch (error) {
      logger.error('Failed to delete patient:', error);
      throw error;
    }
  }

  // READ OPERATIONS (MongoDB/Cosmos DB with Cache)
  async findById(id: string): Promise<Patient | null> {
    try {
      // Try cache first
    //  const cacheKey = `${this.CACHE_PREFIX}${id}`;
     // const cached = await cacheUtils.get<Patient>(cacheKey);
     // if (cached) {
     //   return cached;
     // }

      // Query read database
      const patient = await PatientReadModel.findOne({ id }).lean();
      if (!patient) {
        return null;
      }

      const result = this.mapMongoToPatient(patient);

      // Cache the result
    //  await cacheUtils.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to find patient by ID:', error);
      throw error;
    }
  }

  async findByCpf(cpf: string): Promise<Patient | null> {
    try {
    //  const cacheKey = `${this.CACHE_PREFIX}cpf:${cpf}`;
     // const cached = await cacheUtils.get<Patient>(cacheKey);
   //   if (cached) {
    //    return cached;
    //  }

      const patient = await PatientReadModel.findOne({ cpf }).lean();
      if (!patient) {
        return null;
      }

      const result = this.mapMongoToPatient(patient);
      //await cacheUtils.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to find patient by CPF:', error);
      throw error;
    }
  }

  async findByMedicalRecord(medicalRecordNumber: string): Promise<Patient | null> {
    try {
      //const cacheKey = `${this.CACHE_PREFIX}record:${medicalRecordNumber}`;
     // const cached = await cacheUtils.get<Patient>(cacheKey);
      //if (cached) {
      //  return cached;
     // }

      const patient = await PatientReadModel.findOne({ medicalRecordNumber }).lean();
      if (!patient) {
        return null;
      }

      const result = this.mapMongoToPatient(patient);
      //await cacheUtils.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      logger.error('Failed to find patient by medical record:', error);
      throw error;
    }
  }

  async findMany(
    filters: PatientSearchFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Patient>> {
    try {
      //const cacheKey = `${this.CACHE_PREFIX}search:${JSON.stringify({ filters, pagination })}`;
      //const cached = await cacheUtils.get<PaginatedResponse<Patient>>(cacheKey);
     // if (cached) {
     //   return cached;
      //}

      // Build query
      const query: any = {};

      if (filters.name) {
        query.$text = { $search: filters.name };
      }
      if (filters.cpf) {
        query.cpf = { $regex: filters.cpf, $options: 'i' };
      }
      if (filters.roomNumber) {
        query.roomNumber = filters.roomNumber;
      }
      if (filters.insurancePlan) {
        query.insurancePlan = filters.insurancePlan;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.responsibleDoctor) {
        query.responsibleDoctor = { $regex: filters.responsibleDoctor, $options: 'i' };
      }
      if (filters.admissionDateFrom || filters.admissionDateTo) {
        query.admissionDate = {};
        if (filters.admissionDateFrom) {
          query.admissionDate.$gte = new Date(filters.admissionDateFrom);
        }
        if (filters.admissionDateTo) {
          query.admissionDate.$lte = new Date(filters.admissionDateTo);
        }
      }

      // Calculate pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;
      const maxLimit = Math.min(limit, 100); // Max 100 items per page

      // Build sort
      const sort: any = {};
      if (pagination.sortBy) {
        sort[pagination.sortBy] = pagination.sortOrder === 'desc' ? -1 : 1;
      } else {
        sort.createdAt = -1; // Default sort by creation date
      }

      // Execute query with pagination
      const [patients, total] = await Promise.all([
        PatientReadModel.find(query)
          .sort(sort)
          .skip(skip)
          .limit(maxLimit)
          .lean(),
        PatientReadModel.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: patients as Patient[],
        pagination: {
          page: page,
          limit: limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      // Cache for shorter time due to frequent updates
     // await cacheUtils.set(cacheKey, result, 300); // 5 minutes

      return result;
    } catch (error) {
      logger.error('Failed to find patients:', error);
      throw error;
    }
  }

  // SYNC OPERATIONS (CQRS)
  private async syncToReadDatabase(prismaPatient: any): Promise<void> {
    try {
      const readData: CreatePatientReadModel = {
        id: prismaPatient.id, // Incluir o ID do Prisma
        fullName: prismaPatient.fullName,
        cpf: prismaPatient.cpf,
        rg: prismaPatient.rg,
        birthDate: prismaPatient.birthDate,
        gender: prismaPatient.gender.toLowerCase(),
        phone: prismaPatient.phone,
        email: prismaPatient.email,
        address: prismaPatient.address,
        medicalRecordNumber: prismaPatient.medicalRecordNumber,
        admissionDate: prismaPatient.admissionDate,
        roomNumber: prismaPatient.roomNumber,
        responsibleDoctor: prismaPatient.responsibleDoctor,
        insurancePlan: prismaPatient.insurancePlan,
        insuranceNumber: prismaPatient.insuranceNumber,
        insuranceValidity: prismaPatient.insuranceValidity,
        accommodationType: prismaPatient.accommodationType.toLowerCase(),
        currentAccommodation: prismaPatient.currentAccommodation || 'standard',
        accommodationStatus: prismaPatient.accommodationStatus.toLowerCase(),
        observations: prismaPatient.observations,
        status: prismaPatient.status.toLowerCase(),
        validationStatus: prismaPatient.validationStatus.toLowerCase()
      };

      await PatientReadModel.findOneAndUpdate(
        { id: prismaPatient.id }, // Usar campo 'id' em vez de '_id'
        { 
          ...readData,
          lastSyncedAt: new Date(),
          $inc: { version: 1 }
        },
        { 
          upsert: true, 
          new: true,
          setDefaultsOnInsert: true
        }
      );

      logger.debug('Patient synced to read database:', { patientId: prismaPatient.id });
    } catch (error) {
      logger.error('Failed to sync patient to read database:', error);
      // Don't throw - this shouldn't break the main operation
    }
  }

  // UTILITY METHODS
  //private async clearPatientCache(patientId: string): Promise<void> {
  //  try {
   //   await Promise.all([
        //cacheUtils.del(`${this.CACHE_PREFIX}${patientId}`),
       // cacheUtils.clearPattern(`${this.CACHE_PREFIX}cpf:*`),
      //  cacheUtils.clearPattern(`${this.CACHE_PREFIX}record:*`),
      //  cacheUtils.clearPattern(`${this.CACHE_PREFIX}search:*`)
    //  ]);
  //  } catch (error) {
  //    logger.error('Failed to clear patient cache:', error);
  //  }
 // }

  private mapPrismaToPatient(prismaPatient: any): Patient {
    return {
      id: prismaPatient.id,
      createdAt: prismaPatient.createdAt,
      updatedAt: prismaPatient.updatedAt,
      fullName: prismaPatient.fullName,
      cpf: prismaPatient.cpf,
      rg: prismaPatient.rg,
      birthDate: prismaPatient.birthDate,
      gender: prismaPatient.gender.toLowerCase(),
      phone: prismaPatient.phone,
      email: prismaPatient.email,
      address: prismaPatient.address,
      medicalRecordNumber: prismaPatient.medicalRecordNumber,
      admissionDate: prismaPatient.admissionDate,
      roomNumber: prismaPatient.roomNumber,
      responsibleDoctor: prismaPatient.responsibleDoctor,
      insurancePlan: prismaPatient.insurancePlan,
      insuranceNumber: prismaPatient.insuranceNumber,
      insuranceValidity: prismaPatient.insuranceValidity,
      accommodationType: prismaPatient.accommodationType.toLowerCase(),
      accommodationStatus: prismaPatient.accommodationStatus.toLowerCase(),
      observations: prismaPatient.observations,
      status: prismaPatient.status.toLowerCase(),
      validationStatus: prismaPatient.validationStatus.toLowerCase()
    };
  }

  private mapMongoToPatient(mongoPatient: any): Patient {
    return {
      id: mongoPatient.id, // Usar campo 'id' em vez de '_id'
      createdAt: mongoPatient.createdAt,
      updatedAt: mongoPatient.updatedAt,
      fullName: mongoPatient.fullName,
      cpf: mongoPatient.cpf,
      rg: mongoPatient.rg,
      birthDate: mongoPatient.birthDate,
      gender: mongoPatient.gender,
      phone: mongoPatient.phone,
      email: mongoPatient.email,
      address: mongoPatient.address,
      medicalRecordNumber: mongoPatient.medicalRecordNumber,
      admissionDate: mongoPatient.admissionDate,
      roomNumber: mongoPatient.roomNumber,
      responsibleDoctor: mongoPatient.responsibleDoctor,
      insurancePlan: mongoPatient.insurancePlan,
      insuranceNumber: mongoPatient.insuranceNumber,
      insuranceValidity: mongoPatient.insuranceValidity,
      accommodationType: mongoPatient.accommodationType,
      accommodationStatus: mongoPatient.accommodationStatus,
      observations: mongoPatient.observations,
      status: mongoPatient.status,
      validationStatus: mongoPatient.validationStatus
    };
  }
}

