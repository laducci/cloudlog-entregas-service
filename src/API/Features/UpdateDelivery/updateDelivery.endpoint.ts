import { Router } from "express";
import { UpdateDeliveryUseCase } from "../../../Application/Features/UpdateDelivery/UpdateDeliveryUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapUpdateDelivery(router: Router, useCase: UpdateDeliveryUseCase) {
  router.put("/deliveries/:id", asyncHandler(async (req, res) => {
    res.json(await useCase.execute(req.params.id, req.body ?? {}));
  }));
}
