import { prisma } from '../config/database';
import { logger } from '../config/logger';

export class GuiaRepository {
  /**
   * Retorna todas as guias (opcionalmente com paginação simples)
   */
  async findAll(limit = 100, offset = 0): Promise<any[]> {
    try {
  const guides = await prisma.guia.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          guia_procedimentos: true
        }
      });

      return guides || [];
    } catch (error) {
      logger.error('Failed to fetch guides from DB:', error);
      throw error;
    }
  }

  /**
   * Retorna uma guia por id (id é inteiro autoincrement)
   */
  async findById(id: string): Promise<any | null> {
    try {
      const intId = parseInt(id, 10);
      if (Number.isNaN(intId)) return null;

  const guide = await prisma.guia.findUnique({
        where: { id: intId },
        include: { guia_procedimentos: true }
      });

      return guide || null;
    } catch (error) {
      logger.error('Failed to fetch guide by id:', error);
      throw error;
    }
  }

  /**
   * Busca guia pelo numeroGuiaPrestador
   */
  async findByNumeroGuiaPrestador(numeroGuiaPrestador: string): Promise<any | null> {
    try {
      const guide = await (prisma as any).guia.findUnique({
        where: { numeroGuiaPrestador }
      });

      return guide || null;
    } catch (error) {
      logger.error('Failed to fetch guide by numeroGuiaPrestador:', error);
      throw error;
    }
  }

  /**
   * Lista procedimentos (guia_procedimentos) de uma guia usando numeroGuiaPrestador
   */
  async findProceduresByNumeroGuiaPrestador(numeroGuiaPrestador: string, limit = 200, offset = 0): Promise<any[]> {
    try {
      // Primeiro busca a guia pelo numeroGuiaPrestador
      const guide = await this.findByNumeroGuiaPrestador(numeroGuiaPrestador);
      
      if (!guide) {
        return [];
      }

      // Depois busca os procedimentos pelo guiaId (id da guia)
      const procedures = await (prisma as any).guiaProcedimentos.findMany({
        where: { guiaId: guide.id },
        take: limit,
        skip: offset,
        orderBy: [{ sequencialItem: 'asc' }, { id: 'asc' }]
      });

      return procedures || [];
    } catch (error) {
      logger.error('Failed to fetch guide procedures by numeroGuiaPrestador:', error);
      throw error;
    }
  }

  /**
   * Retorna um procedimento específico por id (tabela guia_procedimentos)
   */
  async findProcedureById(id: string): Promise<any | null> {
    try {
      const intId = parseInt(id, 10);
      if (Number.isNaN(intId)) return null;

      const procedure = await (prisma as any).guiaProcedimentos.findUnique({
        where: { id: intId }
      });

      return procedure || null;
    } catch (error) {
      logger.error('Failed to fetch guide procedure by id:', error);
      throw error;
    }
  }
}
