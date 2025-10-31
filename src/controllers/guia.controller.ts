import { Request, Response } from 'express';
import { GuiaService } from '../services/guia.service';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { logger } from '../config/logger';

export class GuiaController {
  private guiaService: GuiaService;

  constructor() {
    this.guiaService = new GuiaService();
  }

  // GET /api/v1/guides
  getAllGuides = asyncHandler(async (req: Request, res: Response) => {
    logger.info('Getting all guides', { query: req.query });

    const limit = parseInt((req.query.limit as string) || '100', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    const result = await this.guiaService.getAllGuides(limit, offset);
    res.json(result);
  });

  // GET /api/v1/guides/:id
  getGuideById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Guide ID is required', 400);
    }

    logger.info('Getting guide by id', { id });
    const result = await this.guiaService.getGuideById(id);
    res.json(result);
  });

  // GET /api/v1/guides/:numeroGuiaPrestador/procedures
  getGuideProcedures = asyncHandler(async (req: Request, res: Response) => {
    const { numeroGuiaPrestador } = req.params;
    if (!numeroGuiaPrestador) {
      throw new AppError('numeroGuiaPrestador is required', 400);
    }

    const limit = parseInt((req.query.limit as string) || '200', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    logger.info('Getting guide procedures', { numeroGuiaPrestador, limit, offset });
    const result = await this.guiaService.getGuideProcedures(numeroGuiaPrestador, limit, offset);
    res.json(result);
  });

  // GET /api/v1/guides/procedures/:procedureId
  getGuideProcedureById = asyncHandler(async (req: Request, res: Response) => {
    const { procedureId } = req.params;
    if (!procedureId) {
      throw new AppError('Guide procedure ID is required', 400);
    }

    logger.info('Getting guide procedure by id', { procedureId });
    const result = await this.guiaService.getGuideProcedureById(procedureId);
    res.json(result);
  });
}
