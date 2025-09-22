import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { requireRole, requirePermission } from '../middleware/auth';
import { UserRole } from '@/types';

const router = Router();
const patientController = new PatientController();

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Create a new patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - fullName
 *               - cpf
 *               - birthDate
 *               - gender
 *               - phone
 *               - email
 *               - address
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "João"
 *               lastName:
 *                 type: string
 *                 example: "Silva"
 *               fullName:
 *                 type: string
 *                 example: "João Silva"
 *               cpf:
 *                 type: string
 *                 example: "12345678901"
 *               birthDate:
 *                 type: string
 *                 format: date
 *                 example: "1985-03-15"
 *               gender:
 *                 type: string
 *                 example: "M"
 *               phone:
 *                 type: string
 *                 example: "(11) 99999-9999"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "joao@email.com"
 *               address:
 *                 type: string
 *                 example: "Rua das Flores, 123"
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Create patient - requires admin, director, or analyst role
router.post(
  '/',
  requireRole([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ANALYST]),
  patientController.createPatient
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   put:
 *     summary: Update a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 */
// Update patient - requires admin, director, analyst, or doctor role
router.put(
  '/:id',
  requireRole([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ANALYST, UserRole.DOCTOR]),
  patientController.updatePatient
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   delete:
 *     summary: Delete a patient
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
// Delete patient - requires admin or director role only
router.delete(
  '/:id',
  requireRole([UserRole.ADMIN, UserRole.DIRECTOR]),
  patientController.deletePatient
);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient found
 *       404:
 *         description: Patient not found
 */
// Get patient by ID - all authenticated users can view
router.get(
  '/:id',
  patientController.getPatient
);

/**
 * @swagger
 * /api/v1/patients/cpf/{cpf}:
 *   get:
 *     summary: Get patient by CPF
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cpf
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient CPF
 *     responses:
 *       200:
 *         description: Patient found
 *       404:
 *         description: Patient not found
 */
// Get patient by CPF - all authenticated users can view
router.get(
  '/cpf/:cpf',
  patientController.getPatientByCpf
);

/**
 * @swagger
 * /api/v1/patients/medical-record/{medicalRecordNumber}:
 *   get:
 *     summary: Get patient by medical record number
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: medicalRecordNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Medical record number
 *     responses:
 *       200:
 *         description: Patient found
 *       404:
 *         description: Patient not found
 */
// Get patient by medical record - all authenticated users can view
router.get(
  '/medical-record/:medicalRecordNumber',
  patientController.getPatientByMedicalRecord
);

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Search patients with filters
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of patients
 */
// Search patients - all authenticated users can search
router.get(
  '/',
  patientController.searchPatients
);

/**
 * @swagger
 * /api/v1/patients/statistics:
 *   get:
 *     summary: Get patient statistics
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient statistics
 */
// Get patient statistics - requires admin, director, or analyst role
router.get(
  '/statistics',
  requireRole([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.ANALYST]),
  patientController.getPatientStatistics
);

/**
 * @swagger
 * /api/v1/patients/{id}/validate:
 *   patch:
 *     summary: Validate patient data
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               validationStatus:
 *                 type: string
 *                 example: "approved"
 *               validationNotes:
 *                 type: string
 *                 example: "Patient data verified"
 *     responses:
 *       200:
 *         description: Patient validated successfully
 */
// Validate patient - requires admin, director, or auditor role
router.patch(
  '/:id/validate',
  requireRole([UserRole.ADMIN, UserRole.DIRECTOR, UserRole.AUDITOR]),
  patientController.validatePatient
);

export default router;

