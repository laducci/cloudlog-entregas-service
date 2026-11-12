import { NextFunction, Request, Response } from "express";
import { BusinessRuleError, ConflictError, DomainError, NotFoundError, ValidationError } from "../../Domain/Errors";

/** Traduz erros de domínio para HTTP (o domínio não conhece HTTP). */
export function statusFor(err: unknown): number {
  if (err instanceof ValidationError) return 400;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  if (err instanceof BusinessRuleError) return 422;
  return 500;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = statusFor(err);
  if (status === 500) console.error(err);
  const message = err instanceof DomainError ? err.message : "Erro interno ao processar a requisição.";
  res.status(status).json({ error: message });
}
