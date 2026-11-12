import { ApplyFreightEstimateUseCase } from "../Application/Features/ApplyFreightEstimate/ApplyFreightEstimateUseCase";
import { CreateDeliveryUseCase } from "../Application/Features/CreateDelivery/CreateDeliveryUseCase";
import { DeleteDeliveryUseCase } from "../Application/Features/DeleteDelivery/DeleteDeliveryUseCase";
import { GetDeliveryUseCase } from "../Application/Features/GetDelivery/GetDeliveryUseCase";
import { ListDeliveriesUseCase } from "../Application/Features/ListDeliveries/ListDeliveriesUseCase";
import { UpdateDeliveryUseCase } from "../Application/Features/UpdateDelivery/UpdateDeliveryUseCase";
import { Infrastructure } from "../Infrastructure/buildInfrastructure";

/** Composition Root: único ponto que liga casos de uso aos adaptadores concretos. */
export function composeUseCases(infra: Pick<Infrastructure, "repository" | "publisher" | "clock" | "ids">) {
  const { repository, publisher, clock, ids } = infra;
  return {
    createDelivery: new CreateDeliveryUseCase({ repository, publisher, clock, ids }),
    getDelivery: new GetDeliveryUseCase({ repository }),
    listDeliveries: new ListDeliveriesUseCase({ repository }),
    updateDelivery: new UpdateDeliveryUseCase({ repository, publisher, clock }),
    deleteDelivery: new DeleteDeliveryUseCase({ repository, publisher, clock }),
    applyFreightEstimate: new ApplyFreightEstimateUseCase({ repository, clock }),
  };
}

export type UseCases = ReturnType<typeof composeUseCases>;
