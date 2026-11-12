import { Router } from "express";
import { ApplyFreightEstimateUseCase } from "../../../Application/Features/ApplyFreightEstimate/ApplyFreightEstimateUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapApplyFreightEstimate(router: Router, useCase: ApplyFreightEstimateUseCase) {
  router.put("/deliveries/:id/estimate", asyncHandler(async (req, res) => {
    res.json(await useCase.execute(req.params.id, req.body ?? {}));
  }));
}
