import { DeliveryProps } from "./Delivery";

export type DeliveryEventType = "DeliveryCreated" | "DeliveryUpdated" | "DeliveryDeleted";

/** Contrato dos eventos publicados no Azure Service Bus (documentado em docs/asyncapi.yaml). */
export interface DeliveryEvent {
  type: DeliveryEventType;
  version: 1;
  source: "cloudlog-entregas-service";
  aggregateId: string;
  occurredAt: string;
  data: Pick<DeliveryProps, "id" | "code" | "customer" | "origin" | "destination" | "weightKg" | "distanceKm" | "status">;
}

export function deliveryEvent(type: DeliveryEventType, d: DeliveryProps, now: Date): DeliveryEvent {
  return Object.freeze({
    type,
    version: 1 as const,
    source: "cloudlog-entregas-service" as const,
    aggregateId: d.id,
    occurredAt: now.toISOString(),
    data: {
      id: d.id, code: d.code, customer: d.customer, origin: d.origin, destination: d.destination,
      weightKg: d.weightKg, distanceKm: d.distanceKm, status: d.status,
    },
  });
}
