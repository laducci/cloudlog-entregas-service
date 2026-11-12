import { Delivery, DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { DeliveryFilter, DeliveryRepository } from "../../../Domain/Ports";

/** Adaptador em memória: usado em testes e para rodar localmente sem banco. */
export class InMemoryDeliveryRepository implements DeliveryRepository {
  private readonly rows = new Map<string, DeliveryProps>();

  async add(d: Delivery) { this.rows.set(d.id, d.toPrimitives()); }
  async save(d: Delivery) { this.rows.set(d.id, d.toPrimitives()); }
  async findById(id: string) { const r = this.rows.get(id); return r ? Delivery.restore(r) : null; }
  async findByCode(code: string) {
    const r = [...this.rows.values()].find((x) => x.code === code);
    return r ? Delivery.restore(r) : null;
  }
  async list(filter: DeliveryFilter) {
    const term = filter.search?.toLowerCase();
    return [...this.rows.values()]
      .filter((r) => !filter.status || r.status === filter.status)
      .filter((r) => !term || [r.code, r.customer, r.destination].some((v) => v.toLowerCase().includes(term)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, filter.limit ?? 50)
      .map((r) => Delivery.restore(r));
  }
  async remove(id: string) { this.rows.delete(id); }
}
