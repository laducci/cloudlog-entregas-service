import { deliveryEvent } from "../../../Domain/Delivery/DeliveryEvents";
import { Clock, DeliveryRepository, EventPublisher } from "../../../Domain/Ports";
import { findDeliveryOrFail } from "../../Common/findDeliveryOrFail";

export class DeleteDeliveryUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository; publisher: EventPublisher; clock: Clock }) {}

  async execute(id: string): Promise<void> {
    const delivery = await findDeliveryOrFail(this.deps.repository, id);
    delivery.assertCanBeDeleted();
    await this.deps.repository.remove(delivery.id);
    await this.deps.publisher.publish(deliveryEvent("DeliveryDeleted", delivery.toPrimitives(), this.deps.clock.now()));
  }
}
