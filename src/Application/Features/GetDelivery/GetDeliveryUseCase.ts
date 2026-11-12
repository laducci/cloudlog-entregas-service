import { DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { DeliveryRepository } from "../../../Domain/Ports";
import { findDeliveryOrFail } from "../../Common/findDeliveryOrFail";

export class GetDeliveryUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository }) {}

  async execute(id: string): Promise<DeliveryProps> {
    return (await findDeliveryOrFail(this.deps.repository, id)).toPrimitives();
  }
}
