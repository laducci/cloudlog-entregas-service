import { DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { parseStatus } from "../../../Domain/Delivery/DeliveryStatus";
import { DeliveryRepository } from "../../../Domain/Ports";

export interface ListDeliveriesQuery {
  status?: string;
  search?: string;
  limit?: string | number;
}

export class ListDeliveriesUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository }) {}

  async execute(query: ListDeliveriesQuery = {}): Promise<{ items: DeliveryProps[]; total: number }> {
    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
    const items = await this.deps.repository.list({
      status: query.status ? parseStatus(query.status) : undefined,
      search: query.search?.trim() || undefined,
      limit,
    });
    return { items: items.map((d) => d.toPrimitives()), total: items.length };
  }
}
