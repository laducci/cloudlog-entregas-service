import { DeliveryProps } from "../../../Domain/Delivery/Delivery";
import { ValidationError } from "../../../Domain/Errors";
import { Clock, DeliveryRepository } from "../../../Domain/Ports";
import { findDeliveryOrFail } from "../../Common/findDeliveryOrFail";

export interface FreightEstimateInput {
  freightCost?: unknown;
  etaHours?: unknown;
  estimatedDeliveryAt?: unknown;
  serviceLevel?: unknown;
}

/**
 * Caso de uso chamado pela Azure Function depois de consumir o evento DeliveryCreated:
 * grava na entrega o frete e o prazo calculados (enriquecimento de dados).
 */
export class ApplyFreightEstimateUseCase {
  constructor(private readonly deps: { repository: DeliveryRepository; clock: Clock }) {}

  async execute(id: string, input: FreightEstimateInput): Promise<DeliveryProps> {
    const freightCost = Number(input?.freightCost);
    const etaHours = Number(input?.etaHours);
    const estimatedDeliveryAt = String(input?.estimatedDeliveryAt ?? "");
    if (!Number.isFinite(freightCost) || !Number.isFinite(etaHours) || Number.isNaN(Date.parse(estimatedDeliveryAt))) {
      throw new ValidationError("Informe freightCost, etaHours e estimatedDeliveryAt válidos.");
    }
    const delivery = await findDeliveryOrFail(this.deps.repository, id);
    const now = this.deps.clock.now();
    delivery.applyEstimate(
      { freightCost, etaHours, estimatedDeliveryAt, serviceLevel: String(input.serviceLevel ?? "Padrão"), calculatedAt: now.toISOString() },
      now,
    );
    await this.deps.repository.save(delivery);
    return delivery.toPrimitives();
  }
}
