import { Router } from "express";
import { CreateDeliveryUseCase } from "../../../Application/Features/CreateDelivery/CreateDeliveryUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapCreateDelivery(router: Router, useCase: CreateDeliveryUseCase) {
  router.post("/deliveries", asyncHandler(async (req, res) => {
    res.status(201).json(await useCase.execute(req.body ?? {}));
  }));
}
