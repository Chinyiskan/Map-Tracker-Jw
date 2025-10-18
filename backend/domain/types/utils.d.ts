// Tipos utilitarios de dominio

export type Nullable<T> = T | null | undefined;

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type Brand<T, B extends string> = T & { __brand: B };

export type UUID = Brand<string, 'uuid'>;

// Respuestas genéricas de servicios de aplicación
export type ServiceSuccess<T, M = unknown> = {
  success: true;
  data: T;
  message?: string;
  total?: number;
  metadata?: M;
};

export type ServiceFailure<T = null> = {
  success: false;
  error: string;
  data?: T;
};

export type ServiceResponse<T, M = unknown> =
  | ServiceSuccess<T, M>
  | ServiceFailure<T extends any[] ? T : null>;

// Resultado de validación para entradas de controladores/servicios
export type ValidationIssue = {
  path?: string;
  message: string;
  code?: string;
};

export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationIssue[] };

// Códigos de error estándar
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'DB_ERROR'
  | 'UNKNOWN_ERROR';