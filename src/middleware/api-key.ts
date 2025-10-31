import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';
import { logger } from '../config/logger';

export interface ApiKeyRequest extends Request {
  apiKeyValid?: boolean;
}

/**
 * Middleware para validar API Key
 * Aceita API Key via:
 * - Header: X-API-Key
 * - Query param: api_key
 */
export const apiKeyMiddleware = (req: ApiKeyRequest, res: Response, next: NextFunction): void => {
  try {
    // Busca API Key no header ou query
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    // Log para debug
    logger.debug('API Key validation:', {
      hasHeader: !!req.headers['x-api-key'],
      hasQuery: !!req.query.api_key,
      providedKey: apiKey ? String(apiKey).substring(0, 8) + '...' : 'none',
      expectedKey: config.apiKey ? config.apiKey.substring(0, 8) + '...' : 'NOT_SET'
    });
    
    if (!apiKey) {
      res.status(401).json({
        success: false,
        message: 'API Key is required. Provide via X-API-Key header or api_key query parameter',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Validar API Key (trim para remover espaços)
    const providedKey = String(apiKey).trim();
    const expectedKey = String(config.apiKey).trim();
    
    if (providedKey !== expectedKey) {
      logger.warn('Invalid API Key attempt:', { 
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        providedKey: providedKey.substring(0, 8) + '...',
        expectedKey: expectedKey.substring(0, 8) + '...',
        match: providedKey === expectedKey
      });
      
      res.status(403).json({
        success: false,
        message: 'Invalid API Key',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.apiKeyValid = true;
    logger.info('API Key validated successfully:', { 
      ip: req.ip,
      path: req.path 
    });
    
    next();
  } catch (error) {
    logger.error('API Key validation error:', error);
    
    res.status(500).json({
      success: false,
      message: 'API Key validation error',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Middleware que aceita tanto JWT quanto API Key
 * Útil para endpoints que precisam suportar ambos métodos de autenticação
 */
export const jwtOrApiKeyMiddleware = (req: any, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  // Se tem Bearer token, tenta validar JWT
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const jwt = require('jsonwebtoken');
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
      logger.info('Authenticated via JWT:', { userId: decoded.userId });
      next();
      return;
    } catch (error) {
      // JWT inválido, tenta API Key
    }
  }

  // Se tem API Key, valida
  if (apiKey) {
    if (apiKey === config.apiKey) {
      req.apiKeyValid = true;
      logger.info('Authenticated via API Key:', { ip: req.ip });
      next();
      return;
    }
  }

  // Nenhum método de autenticação válido
  res.status(401).json({
    success: false,
    message: 'Authentication required. Provide either Bearer token or API Key',
    timestamp: new Date().toISOString(),
  });
};
