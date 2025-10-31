import { Router } from 'express';
import { GuiaController } from '../controllers/guia.controller';
import { apiKeyMiddleware } from '../middleware/api-key';

const router = Router();
const controller = new GuiaController();

/**
 * @route GET /api/v1/guides
 * @desc List guides (with optional ?limit & ?offset)
 * @access API Key required (X-API-Key header or api_key query param)
 */
router.get('/', apiKeyMiddleware, controller.getAllGuides);

/**
 * @route GET /api/v1/guides/:id
 * @desc Get a single guide by id
 * @access API Key required (X-API-Key header or api_key query param)
 */
router.get('/:id', apiKeyMiddleware, controller.getGuideById);

/**
 * @route GET /api/v1/guides/:numeroGuiaPrestador/procedures
 * @desc List procedures for a guide by numeroGuiaPrestador
 * @access API Key required
 */
router.get('/:numeroGuiaPrestador/procedures', apiKeyMiddleware, controller.getGuideProcedures);

/**
 * @route GET /api/v1/guides/procedures/:procedureId
 * @desc Get a single guide procedure by id
 * @access API Key required
 */
router.get('/procedures/:procedureId', apiKeyMiddleware, controller.getGuideProcedureById);

export default router;
