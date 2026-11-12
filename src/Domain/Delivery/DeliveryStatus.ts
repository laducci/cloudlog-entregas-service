import { BusinessRuleError, ValidationError } from "../Errors";

/** Value Object: estados possíveis de uma entrega. */
export const DeliveryStatus = {
  PENDING: "Pendente",
  IN_ROUTE: "Em rota",
  DELAYED: "Atrasada",
  DELIVERED: "Entregue",
  CANCELED: "Cancelada",
} as const;

export type DeliveryStatusValue = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const DELIVERY_STATUS_VALUES = Object.values(DeliveryStatus) as DeliveryStatusValue[];

/** Regra de negócio: transições permitidas entre estados. */
const TRANSITIONS: Record<DeliveryStatusValue, DeliveryStatusValue[]> = {
  Pendente: ["Em rota", "Cancelada"],
  "Em rota": ["Entregue", "Atrasada"],
  Atrasada: ["Entregue", "Em rota"],
  Entregue: [],
  Cancelada: [],
};

export function parseStatus(value: unknown): DeliveryStatusValue {
  if (!DELIVERY_STATUS_VALUES.includes(value as DeliveryStatusValue)) {
    throw new ValidationError(`Status inválido. Use: ${DELIVERY_STATUS_VALUES.join(", ")}.`);
  }
  return value as DeliveryStatusValue;
}

export function assertTransition(from: DeliveryStatusValue, to: DeliveryStatusValue): void {
  if (from === to) return;
  if (!TRANSITIONS[from].includes(to)) {
    throw new BusinessRuleError(`Não é possível mudar a entrega de "${from}" para "${to}".`);
  }
}

export const isFinal = (status: DeliveryStatusValue) => TRANSITIONS[status].length === 0;
