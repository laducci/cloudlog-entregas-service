import { Delivery, DeliveryProps, NewDeliveryData } from "../../../Domain/Delivery/Delivery";
import { deliveryEvent } from "../../../Domain/Delivery/DeliveryEvents";
import { ConflictError } from "../../../Domain/Errors";
import { Clock, DeliveryRepository, EventPublisher, IdGenerator } from "../../../Domain/Ports";

/** Caso de uso: cadastrar entrega e publicar DeliveryCreated (EDA). */
export class CreateDeliveryUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository; publisher: EventPublisher; clock: Clock; ids: IdGenerator }) {}

  async execute(input: NewDeliveryData): Promise<DeliveryProps> {
    const now = this.deps.clock.now();
    const delivery = Delivery.create(input, this.deps.ids.next(), now);
    if (await this.deps.repository.findByCode(delivery.code)) {
      throw new ConflictError(`Já existe uma entrega com o código ${delivery.code}.`);
    }
    await this.deps.repository.add(delivery);
    const data = delivery.toPrimitives();
    await this.deps.publisher.publish(deliveryEvent("DeliveryCreated", data, now));
    return data;
  }
}
