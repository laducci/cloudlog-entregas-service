import { composeUseCases } from "../src/API/Composition";
import { InMemoryEventPublisher } from "../src/Infrastructure/Messaging/InMemoryEventPublisher";
import { InMemoryDeliveryRepository } from "../src/Infrastructure/Persistence/InMemory/InMemoryDeliveryRepository";

export const fixedClock = (iso = "2026-11-12T12:00:00.000Z") => ({ now: () => new Date(iso) });
export const seqIds = () => { let i = 0; return { next: () => `id-${++i}` }; };

export function makeTestContext() {
  const repository = new InMemoryDeliveryRepository();
  const publisher = new InMemoryEventPublisher();
  const useCases = composeUseCases({ repository, publisher, clock: fixedClock(), ids: seqIds() });
  return { repository, publisher, useCases };
}

export const validDelivery = (over: Record<string, unknown> = {}) => ({
  code: "ent-1001", customer: "Mercado Bom Preço", origin: "Curitiba - PR", destination: "Joinville - SC",
  weightKg: 850, distanceKm: 130, ...over,
});
