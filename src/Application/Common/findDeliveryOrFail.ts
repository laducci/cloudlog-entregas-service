import { Delivery } from "../../Domain/Delivery/Delivery";
import { NotFoundError } from "../../Domain/Errors";
import { DeliveryRepository } from "../../Domain/Ports";

export async function findDeliveryOrFail(repo: DeliveryRepository, id: string): Promise<Delivery> {
  const delivery = await repo.findById(String(id ?? "").trim());
  if (!delivery) throw new NotFoundError("Entrega não encontrada.");
  return delivery;
}
