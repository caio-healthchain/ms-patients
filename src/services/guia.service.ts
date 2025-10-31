import { GuiaRepository } from '../repositories/guia.repository';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error-handler';

export class GuiaService {
  private guiaRepository: GuiaRepository;

  constructor() {
    this.guiaRepository = new GuiaRepository();
  }

  async getAllGuides(limit = 100, offset = 0) {
    try {
      const data = await this.guiaRepository.findAll(limit, offset);
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error retrieving guides:', error);
      throw new AppError('Failed to retrieve guides', 500);
    }
  }

  async getGuideById(id: string) {
    try {
      const guide = await this.guiaRepository.findById(id);
      if (!guide) {
        throw new AppError('Guide not found', 404);
      }

      return {
        success: true,
        data: guide,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error retrieving guide by id:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide', 500);
    }
  }

  async getGuideProcedures(numeroGuiaPrestador: string, limit = 200, offset = 0) {
    try {
      const data = await this.guiaRepository.findProceduresByNumeroGuiaPrestador(numeroGuiaPrestador, limit, offset);
      
      if (!data || data.length === 0) {
        throw new AppError('Guide not found or has no procedures', 404);
      }
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error retrieving guide procedures:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide procedures', 500);
    }
  }

  async getGuideProcedureById(id: string) {
    try {
      const data = await this.guiaRepository.findProcedureById(id);
      if (!data) {
        throw new AppError('Guide procedure not found', 404);
      }
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error retrieving guide procedure by id:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to retrieve guide procedure', 500);
    }
  }
}
