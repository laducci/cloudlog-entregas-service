import { BusinessRuleError, ValidationError } from "../Errors";
import { DeliveryStatus, DeliveryStatusValue, assertTransition, isFinal, parseStatus } from "./DeliveryStatus";

export interface FreightEstimate {
  freightCost: number;
  etaHours: number;
  estimatedDeliveryAt: string;
  serviceLevel: string;
  calculatedAt: string;
}

export interface DeliveryProps {
  id: string;
  code: string;
  customer: string;
  origin: string;
  destination: string;
  weightKg: number;
  distanceKm: number;
  driverId: string | null;
  vehicleId: string | null;
  status: DeliveryStatusValue;
  estimate: FreightEstimate | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewDeliveryData {
  code?: unknown;
  customer?: unknown;
  origin?: unknown;
  destination?: unknown;
  weightKg?: unknown;
  distanceKm?: unknown;
  driverId?: unknown;
  vehicleId?: unknown;
}

export type DeliveryChanges = NewDeliveryData & { status?: unknown };

const text = (value: unknown, field: string): string => {
  const v = String(value ?? "").trim();
  if (!v) throw new ValidationError(`O campo "${field}" é obrigatório.`);
  return v;
};

const positive = (value: unknown, field: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError(`O campo "${field}" deve ser um número maior que zero.`);
  return n;
};

const optionalId = (value: unknown): string | null => {
  const v = String(value ?? "").trim();
  return v ? v : null;
};

/** Entidade de domínio Entrega (RF-03): concentra as regras de negócio. */
export class Delivery {
  private constructor(private props: DeliveryProps) {}

  static create(data: NewDeliveryData, id: string, now: Date): Delivery {
    return new Delivery({
      id,
      code: text(data.code, "code").toUpperCase(),
      customer: text(data.customer, "customer"),
      origin: text(data.origin, "origin"),
      destination: text(data.destination, "destination"),
      weightKg: positive(data.weightKg, "weightKg"),
      distanceKm: positive(data.distanceKm, "distanceKm"),
      driverId: optionalId(data.driverId),
      vehicleId: optionalId(data.vehicleId),
      status: DeliveryStatus.PENDING,
      estimate: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  static restore(props: DeliveryProps): Delivery {
    return new Delivery({ ...props });
  }

  get id() { return this.props.id; }
  get code() { return this.props.code; }
  get status() { return this.props.status; }

  update(changes: DeliveryChanges, now: Date): void {
    if (isFinal(this.props.status)) {
      throw new BusinessRuleError(`Entrega "${this.props.status}" não pode ser alterada.`);
    }
    const next = { ...this.props };
    if (changes.customer !== undefined) next.customer = text(changes.customer, "customer");
    if (changes.origin !== undefined) next.origin = text(changes.origin, "origin");
    if (changes.destination !== undefined) next.destination = text(changes.destination, "destination");
    if (changes.weightKg !== undefined) next.weightKg = positive(changes.weightKg, "weightKg");
    if (changes.distanceKm !== undefined) next.distanceKm = positive(changes.distanceKm, "distanceKm");
    if (changes.driverId !== undefined) next.driverId = optionalId(changes.driverId);
    if (changes.vehicleId !== undefined) next.vehicleId = optionalId(changes.vehicleId);
    if (changes.status !== undefined) {
      const status = parseStatus(changes.status);
      assertTransition(this.props.status, status);
      if (status === DeliveryStatus.IN_ROUTE && (!next.driverId || !next.vehicleId)) {
        throw new BusinessRuleError("Para sair em rota a entrega precisa de motorista e veículo.");
      }
      next.status = status;
    }
    const routeChanged = next.distanceKm !== this.props.distanceKm || next.weightKg !== this.props.weightKg;
    if (routeChanged) next.estimate = null; // a estimativa antiga deixa de valer
    next.updatedAt = now.toISOString();
    this.props = next;
  }

  applyEstimate(estimate: FreightEstimate, now: Date): void {
    if (isFinal(this.props.status)) throw new BusinessRuleError("Entrega finalizada não recebe nova estimativa.");
    if (!(estimate.freightCost >= 0) || !(estimate.etaHours > 0)) throw new ValidationError("Estimativa inválida.");
    this.props = { ...this.props, estimate: { ...estimate }, updatedAt: now.toISOString() };
  }

  assertCanBeDeleted(): void {
    if (this.props.status === DeliveryStatus.IN_ROUTE || this.props.status === DeliveryStatus.DELAYED) {
      throw new BusinessRuleError("Entrega em andamento não pode ser excluída.");
    }
  }

  toPrimitives(): DeliveryProps {
    return { ...this.props, estimate: this.props.estimate ? { ...this.props.estimate } : null };
  }
}
