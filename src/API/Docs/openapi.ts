import { DELIVERY_STATUS_VALUES } from "../../Domain/Delivery/DeliveryStatus";

const error = { type: "object", properties: { error: { type: "string" } } };
const errorResponse = (description: string) => ({ description, content: { "application/json": { schema: error } } });
const idParam = { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } };
const deliveryRef = { $ref: "#/components/schemas/Delivery" };

/** Documento OpenAPI 3 (Swagger) do microserviço de Entregas. */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "CloudLog · Microserviço de Entregas",
    version: "1.0.0",
    description:
      "Domínio de Entregas (RF-03) com MongoDB Atlas. Publica DeliveryCreated, DeliveryUpdated e DeliveryDeleted no Azure Service Bus " +
      "(contrato em /events/docs). Alunos: Camilla Augusta Uber, João Davi, Laura Guillarducci.",
  },
  tags: [{ name: "Entregas" }, { name: "Integração" }],
  paths: {
    "/deliveries": {
      get: {
        tags: ["Entregas"], summary: "Listar entregas", operationId: "listDeliveries",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: DELIVERY_STATUS_VALUES } },
          { name: "search", in: "query", description: "Busca por código, cliente ou destino", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50, maximum: 200 } },
        ],
        responses: {
          200: { description: "Lista", content: { "application/json": { schema: { type: "object", properties: { items: { type: "array", items: deliveryRef }, total: { type: "integer" } } } } } },
          400: errorResponse("Filtro inválido"),
        },
      },
      post: {
        tags: ["Entregas"], summary: "Cadastrar entrega (publica DeliveryCreated)", operationId: "createDelivery",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NewDelivery" } } } },
        responses: {
          201: { description: "Criada", content: { "application/json": { schema: deliveryRef } } },
          400: errorResponse("Dados inválidos"),
          409: errorResponse("Código já existe"),
        },
      },
    },
    "/deliveries/{id}": {
      get: {
        tags: ["Entregas"], summary: "Buscar entrega por id", operationId: "getDelivery", parameters: [idParam],
        responses: { 200: { description: "Entrega", content: { "application/json": { schema: deliveryRef } } }, 404: errorResponse("Não encontrada") },
      },
      put: {
        tags: ["Entregas"], summary: "Alterar entrega / mudar status (publica DeliveryUpdated)", operationId: "updateDelivery", parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryChanges" } } } },
        responses: {
          200: { description: "Alterada", content: { "application/json": { schema: deliveryRef } } },
          400: errorResponse("Dados inválidos"), 404: errorResponse("Não encontrada"),
          422: errorResponse("Regra de negócio violada (ex.: transição de status não permitida)"),
        },
      },
      delete: {
        tags: ["Entregas"], summary: "Excluir entrega (publica DeliveryDeleted)", operationId: "deleteDelivery", parameters: [idParam],
        responses: { 204: { description: "Excluída" }, 404: errorResponse("Não encontrada"), 422: errorResponse("Entrega em andamento") },
      },
    },
    "/deliveries/{id}/estimate": {
      put: {
        tags: ["Integração"], summary: "Gravar frete/prazo calculados pela Azure Function", operationId: "applyFreightEstimate", parameters: [idParam],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/FreightEstimateInput" } } } },
        responses: { 200: { description: "Entrega enriquecida", content: { "application/json": { schema: deliveryRef } } }, 400: errorResponse("Estimativa inválida"), 404: errorResponse("Não encontrada") },
      },
    },
    "/health": { get: { tags: ["Integração"], summary: "Health check", responses: { 200: { description: "OK" } } } },
  },
  components: {
    schemas: {
      NewDelivery: {
        type: "object", required: ["code", "customer", "origin", "destination", "weightKg", "distanceKm"],
        properties: {
          code: { type: "string", example: "ENT-1001" },
          customer: { type: "string", example: "Mercado Bom Preço" },
          origin: { type: "string", example: "Curitiba - PR" },
          destination: { type: "string", example: "Joinville - SC" },
          weightKg: { type: "number", example: 850 },
          distanceKm: { type: "number", example: 130 },
          driverId: { type: "string", nullable: true, description: "Id do motorista (Microserviço de Frota)" },
          vehicleId: { type: "string", nullable: true, description: "Id do veículo (Microserviço de Frota)" },
        },
      },
      DeliveryChanges: {
        type: "object",
        properties: {
          customer: { type: "string" }, origin: { type: "string" }, destination: { type: "string" },
          weightKg: { type: "number" }, distanceKm: { type: "number" },
          driverId: { type: "string", nullable: true }, vehicleId: { type: "string", nullable: true },
          status: { type: "string", enum: DELIVERY_STATUS_VALUES },
        },
      },
      FreightEstimateInput: {
        type: "object", required: ["freightCost", "etaHours", "estimatedDeliveryAt"],
        properties: { freightCost: { type: "number" }, etaHours: { type: "number" }, estimatedDeliveryAt: { type: "string", format: "date-time" }, serviceLevel: { type: "string" } },
      },
      Delivery: {
        type: "object",
        properties: {
          id: { type: "string" }, code: { type: "string" }, customer: { type: "string" }, origin: { type: "string" }, destination: { type: "string" },
          weightKg: { type: "number" }, distanceKm: { type: "number" },
          driverId: { type: "string", nullable: true }, vehicleId: { type: "string", nullable: true },
          status: { type: "string", enum: DELIVERY_STATUS_VALUES },
          estimate: {
            type: "object", nullable: true,
            properties: { freightCost: { type: "number" }, etaHours: { type: "number" }, estimatedDeliveryAt: { type: "string" }, serviceLevel: { type: "string" }, calculatedAt: { type: "string" } },
          },
          createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
};
