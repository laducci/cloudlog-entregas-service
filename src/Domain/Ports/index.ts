import { Delivery } from "../Delivery/Delivery";
import { DeliveryStatusValue } from "../Delivery/DeliveryStatus";
import { DeliveryEvent } from "../Delivery/DeliveryEvents";

/** Portas (interfaces) que a infraestrutura implementa - Dependency Inversion. */
export interface DeliveryFilter {
  status?: DeliveryStatusValue;
  search?: string;
  limit?: number;
}

export interface DeliveryRepository {
  add(delivery: Delivery): Promise<void>;
  save(delivery: Delivery): Promise<void>;
  findById(id: string): Promise<Delivery | null>;
  findByCode(code: string): Promise<Delivery | null>;
  list(filter: DeliveryFilter): Promise<Delivery[]>;
  remove(id: string): Promise<void>;
}

export interface EventPublisher {
  publish(event: DeliveryEvent): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}
