import Joi from 'joi';
import { CreatePatientRequest, UpdatePatientRequest } from '@/types';
import { PatientSearchFilters } from '@/types/patient-search.types';

// Validation schema for creating a patient
export const createPatientSchema = Joi.object<CreatePatientRequest>({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 100 characters'
    }),

  cpf: Joi.string()
    .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/)
    .required()
    .messages({
      'string.pattern.base': 'CPF must be in format XXX.XXX.XXX-XX or 11 digits',
      'string.empty': 'CPF is required'
    }),

  rg: Joi.string()
    .optional()
    .allow('')
    .messages({
      'string.base': 'RG must be a string'
    }),

  birthDate: Joi.date()
    .max('now')
    .required()
    .messages({
      'date.max': 'Birth date cannot be in the future',
      'date.base': 'Birth date must be a valid date'
    }),

  gender: Joi.string()
    .valid('male', 'female', 'other', 'not_informed')
    .required()
    .messages({
      'any.only': 'Gender must be one of: male, female, other, not_informed'
    }),

  phone: Joi.string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone must be in format (XX) XXXXX-XXXX or 10-11 digits'
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email address'
    }),

  address: Joi.string()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.min': 'Address must be at least 10 characters',
      'string.max': 'Address must not exceed 200 characters'
    }),

  medicalRecordNumber: Joi.string()
    .optional()
    .allow(''),

  admissionDate: Joi.date()
    .optional(),

  roomNumber: Joi.string()
    .optional()
    .allow(''),

  responsibleDoctor: Joi.string()
    .optional()
    .allow(''),

  insurancePlan: Joi.string()
    .optional()
    .allow(''),

  insuranceNumber: Joi.string()
    .optional()
    .allow(''),

  insuranceValidity: Joi.date()
    .optional(),

  accommodationType: Joi.string()
    .valid('standard', 'premium', 'vip')
    .optional(),

  allergies: Joi.array()
    .items(Joi.string())
    .optional(),

  chronicConditions: Joi.array()
    .items(Joi.string())
    .optional(),

  emergencyContact: Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().required(),
    phone: Joi.string().required()
  }).optional()
});

// Validation schema for updating a patient
export const updatePatientSchema = Joi.object<UpdatePatientRequest>({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  phone: Joi.string()
    .pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$|^\d{10,11}$/)
    .optional(),

  email: Joi.string()
    .email()
    .optional(),

  address: Joi.string()
    .min(10)
    .max(200)
    .optional(),

  roomNumber: Joi.string()
    .optional()
    .allow(''),

  responsibleDoctor: Joi.string()
    .optional()
    .allow(''),

  insurancePlan: Joi.string()
    .optional()
    .allow(''),

  insuranceNumber: Joi.string()
    .optional()
    .allow(''),

  insuranceValidity: Joi.date()
    .optional(),

  accommodationType: Joi.string()
    .valid('standard', 'premium', 'vip')
    .optional(),

  allergies: Joi.array()
    .items(Joi.string())
    .optional(),

  chronicConditions: Joi.array()
    .items(Joi.string())
    .optional(),

  emergencyContact: Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().required(),
    phone: Joi.string().required()
  }).optional()
});

// Validation schema for patient search filters
export const patientSearchFiltersSchema = Joi.object<PatientSearchFilters>({
  name: Joi.string().optional(),
  cpf: Joi.string().optional(),
  email: Joi.string().optional(),
  phone: Joi.string().optional(),
  status: Joi.string().optional(),
  gender: Joi.string().optional(),
  roomNumber: Joi.string().optional(),
  insurancePlan: Joi.string().optional(),
  responsibleDoctor: Joi.string().optional(),
  admissionDateFrom: Joi.date().optional(),
  admissionDateTo: Joi.date().optional(),
  birthDateFrom: Joi.date().optional(),
  birthDateTo: Joi.date().optional(),
  accommodationType: Joi.string().optional(),
  validationStatus: Joi.string().optional()
});

// Validation middleware
export const validateCreatePatient = (req: any, res: any, next: any) => {
  const { error } = createPatientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

export const validateUpdatePatient = (req: any, res: any, next: any) => {
  const { error } = updatePatientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

export const validatePatientSearchFilters = (req: any, res: any, next: any) => {
  const { error } = patientSearchFiltersSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  next();
};

