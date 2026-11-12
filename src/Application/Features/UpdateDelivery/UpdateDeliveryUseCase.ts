import { DeliveryChanges, DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { deliveryEvent } from "../../../Domain/Delivery/DeliveryEvents";
import { ValidationError } from "../../../Domain/Errors";
import { Clock, DeliveryRepository, EventPublisher } from "../../../Domain/Ports";
import { findDeliveryOrFail } from "../../Common/findDeliveryOrFail";

/** Caso de uso: alterar dados/status (com regra de transição) e publicar DeliveryUpdated. */
export class UpdateDeliveryUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository; publisher: EventPublisher; clock: Clock }) {}

  async execute(id: string, changes: DeliveryChanges): Promise<DeliveryProps> {
    if (!changes || !Object.keys(changes).length) throw new ValidationError("Informe ao menos um campo para alterar.");
    if ("code" in changes) throw new ValidationError("O código da entrega não pode ser alterado.");
    const delivery = await findDeliveryOrFail(this.deps.repository, id);
    const now = this.deps.clock.now();
    delivery.update(changes, now);
    await this.deps.repository.save(delivery);
    const data = delivery.toPrimitives();
    await this.deps.publisher.publish(deliveryEvent("DeliveryUpdated", data, now));
    return data;
  }
}
