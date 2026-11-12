import { Router } from "express";
import { ListDeliveriesUseCase } from "../../../Application/Features/ListDeliveries/ListDeliveriesUseCase";
import { asyncHandler } from "../../Http/asyncHandler";

export function mapListDeliveries(router: Router, useCase: ListDeliveriesUseCase) {
  router.get("/deliveries", asyncHandler(async (req, res) => {
    const q = req.query as Record<string, string | undefined>;
    res.json(await useCase.execute({ status: q.status, search: q.search, limit: q.limit }));
  }));
}
