import { Router } from "express";
import { GetDeliveryUseCase } from "../../../Application/Features/GetDelivery/GetDeliveryUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapGetDelivery(router: Router, useCase: GetDeliveryUseCase) {
  router.get("/deliveries/:id", asyncHandler(async (req, res) => {
    res.json(await useCase.execute(req.params.id));
  }));
}
