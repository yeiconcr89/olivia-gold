export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = 'Solicitud inválida') {
    super(message, 400);
    this.name = 'BadRequestError';
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Conflicto de recursos') {
    super(message, 409);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = 'Error interno del servidor') {
    super(message, 500);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
