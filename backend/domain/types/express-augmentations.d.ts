// Augmentación de tipos Express para propiedades personalizadas

declare global {
  namespace Express {
    interface Request {
      /**
       * ID único de la request generado por ObservabilityMiddleware
       * Usado para tracking y logging de requests
       */
      requestId?: string;
    }
  }
}

export {};