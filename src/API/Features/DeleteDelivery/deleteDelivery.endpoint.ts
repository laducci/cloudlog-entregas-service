import { Router } from "express";
import { DeleteDeliveryUseCase } from "../../../Application/Features/DeleteDelivery/DeleteDeliveryUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapDeleteDelivery(router: Router, useCase: DeleteDeliveryUseCase) {
  router.delete("/deliveries/:id", asyncHandler(async (req, res) => {
    await useCase.execute(req.params.id);
    res.status(204).end();
  }));
}
