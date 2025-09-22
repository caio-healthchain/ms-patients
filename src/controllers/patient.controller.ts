import { Request, Response } from 'express';
import { PatientService } from '../services/patient.service';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';
import { AppError, asyncHandler } from '../middleware/error-handler';
import { CreatePatientRequest, UpdatePatientRequest, PatientSearchFilters, PaginationParams } from '@/types';

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  // Create a new patient
  createPatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Creating patient', { userId: req.user?.userId });

    const patientData: CreatePatientRequest = req.body;
    const result = await this.patientService.createPatient(patientData, req.user?.userId || '');

    res.status(201).json(result);
  });

  // Get patient by ID
  getPatient = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Patient ID is required', 400);
    }

    logger.info('Getting patient', { patientId: id });

    const result = await this.patientService.getPatientById(id);
    res.json(result);
  });

  // Update patient
  updatePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Patient ID is required', 400);
    }

    logger.info('Updating patient', { patientId: id, userId: req.user?.userId });

    const updateData: UpdatePatientRequest = req.body;
    const result = await this.patientService.updatePatient(id, updateData, req.user?.userId || '');

    res.json(result);
  });

  // Delete patient
  deletePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Patient ID is required', 400);
    }

    logger.info('Deleting patient', { patientId: id, userId: req.user?.userId });

    const result = await this.patientService.deletePatient(id, req.user?.userId || '');
    res.json(result);
  });

  // Search patients
  searchPatients = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Searching patients', { query: req.query });

    const filters: PatientSearchFilters = req.query as any;
    const pagination: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10
    };

    const result = await this.patientService.searchPatients(filters, pagination);
    res.json(result);
  });

  // Get patient statistics
  getPatientStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    logger.info('Getting patient statistics', { userId: req.user?.userId });

    const result = await this.patientService.getPatientStatistics();
    res.json(result);
  });

  // Get patient by CPF
  getPatientByCpf = asyncHandler(async (req: Request, res: Response) => {
    const { cpf } = req.params;
    
    if (!cpf) {
      throw new AppError('CPF is required', 400);
    }

    logger.info('Getting patient by CPF', { cpf });

    const result = await this.patientService.getPatientByCpf(cpf);
    res.json(result);
  });

  // Get patient by medical record number
  getPatientByMedicalRecord = asyncHandler(async (req: Request, res: Response) => {
    const { medicalRecordNumber } = req.params;
    
    if (!medicalRecordNumber) {
      throw new AppError('Medical record number is required', 400);
    }

    logger.info('Getting patient by medical record', { medicalRecordNumber });

    const result = await this.patientService.getPatientByMedicalRecord(medicalRecordNumber);
    res.json(result);
  });

  // Validate patient data
  validatePatient = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw new AppError('Patient ID is required', 400);
    }

    logger.info('Validating patient', { patientId: id, userId: req.user?.userId });

    const result = await this.patientService.validatePatient(id, 'validated', req.user?.userId || '');
    res.json(result);
  });
}

