/** Erros de domínio: a camada API traduz cada um para um status HTTP. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends DomainError {}
export class NotFoundError extends DomainError {}
export class ConflictError extends DomainError {}
export class BusinessRuleError extends DomainError {}
