import cors from "cors";
import express, { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { UseCases } from "./Composition";
import { asyncApiPage } from "./Docs/asyncApiPage";
import { openApiDocument } from "./Docs/openapi";
import { mapApplyFreightEstimate } from "./Features/ApplyFreightEstimate/applyFreightEstimate.endpoint";
import { mapCreateDelivery } from "./Features/CreateDelivery/createDelivery.endpoint";
import { mapDeleteDelivery } from "./Features/DeleteDelivery/deleteDelivery.endpoint";
import { mapGetDelivery } from "./Features/GetDelivery/getDelivery.endpoint";
import { mapListDeliveries } from "./Features/ListDeliveries/listDeliveries.endpoint";
import { mapUpdateDelivery } from "./Features/UpdateDelivery/updateDelivery.endpoint";
import { errorHandler } from "./Http/errorHandler";

export function createApp(useCases: UseCases, info: Record<string, string> = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/", (_req, res) => res.redirect("/docs"));
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "cloudlog-entregas-service", ...info }));
  app.get("/openapi.json", (_req, res) => res.json(openApiDocument));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument, { customSiteTitle: "CloudLog · Entregas API" }));

  const asyncApiFile = path.resolve(process.cwd(), "docs/asyncapi.yaml");
  app.get("/events/asyncapi.yaml", (_req, res) => {
    if (!fs.existsSync(asyncApiFile)) return res.status(404).json({ error: "asyncapi.yaml não encontrado." });
    res.type("text/yaml").send(fs.readFileSync(asyncApiFile, "utf8"));
  });
  app.get("/events/docs", (_req, res) => res.type("html").send(asyncApiPage));

  const router = Router();
  mapListDeliveries(router, useCases.listDeliveries);
  mapGetDelivery(router, useCases.getDelivery);
  mapCreateDelivery(router, useCases.createDelivery);
  mapUpdateDelivery(router, useCases.updateDelivery);
  mapDeleteDelivery(router, useCases.deleteDelivery);
  mapApplyFreightEstimate(router, useCases.applyFreightEstimate);
  app.use(router);

  app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
  app.use(errorHandler);
  return app;
}
