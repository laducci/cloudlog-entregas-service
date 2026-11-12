import { Delivery } from "../../src/Domain/Delivery/Delivery";
import { deliveryEvent } from "../../src/Domain/Delivery/DeliveryEvents";
import { BusinessRuleError, ValidationError } from "../../src/Domain/Errors";
import { validDelivery } from "../support";

const now = new Date("2026-11-12T12:00:00Z");

describe("Entidade Delivery", () => {
  it("cria com status Pendente e código em maiúsculas", () => {
    const d = Delivery.create(validDelivery(), "id-1", now).toPrimitives();
    expect(d).toMatchObject({ id: "id-1", code: "ENT-1001", status: "Pendente", estimate: null });
  });

  it("rejeita campos obrigatórios vazios e números inválidos", () => {
    expect(() => Delivery.create(validDelivery({ customer: " " }), "x", now)).toThrow(ValidationError);
    expect(() => Delivery.create(validDelivery({ weightKg: 0 }), "x", now)).toThrow(ValidationError);
    expect(() => Delivery.create(validDelivery({ distanceKm: "abc" }), "x", now)).toThrow(ValidationError);
  });

  it("só sai em rota com motorista e veículo", () => {
    const d = Delivery.create(validDelivery(), "x", now);
    expect(() => d.update({ status: "Em rota" }, now)).toThrow(BusinessRuleError);
    d.update({ status: "Em rota", driverId: "m1", vehicleId: "v1" }, now);
    expect(d.status).toBe("Em rota");
  });

  it("bloqueia transição de status não permitida", () => {
    const d = Delivery.create(validDelivery(), "x", now);
    expect(() => d.update({ status: "Entregue" }, now)).toThrow(BusinessRuleError);
  });

  it("entrega finalizada não pode ser alterada nem recebe estimativa", () => {
    const d = Delivery.create(validDelivery(), "x", now);
    d.update({ status: "Cancelada" }, now);
    expect(() => d.update({ customer: "Outro" }, now)).toThrow(BusinessRuleError);
    expect(() => d.applyEstimate({ freightCost: 1, etaHours: 1, estimatedDeliveryAt: now.toISOString(), serviceLevel: "x", calculatedAt: "" }, now)).toThrow(BusinessRuleError);
  });

  it("mudar distância ou peso invalida a estimativa anterior", () => {
    const d = Delivery.create(validDelivery(), "x", now);
    d.applyEstimate({ freightCost: 500, etaHours: 3, estimatedDeliveryAt: now.toISOString(), serviceLevel: "Padrão", calculatedAt: now.toISOString() }, now);
    expect(d.toPrimitives().estimate?.freightCost).toBe(500);
    d.update({ distanceKm: 300 }, now);
    expect(d.toPrimitives().estimate).toBeNull();
  });

  it("não permite excluir entrega em andamento", () => {
    const d = Delivery.create(validDelivery({ driverId: "m", vehicleId: "v" }), "x", now);
    d.update({ status: "Em rota" }, now);
    expect(() => d.assertCanBeDeleted()).toThrow(BusinessRuleError);
  });

  it("monta o envelope do evento congelado", () => {
    const ev = deliveryEvent("DeliveryCreated", Delivery.create(validDelivery(), "id-9", now).toPrimitives(), now);
    expect(ev).toMatchObject({ type: "DeliveryCreated", version: 1, source: "cloudlog-entregas-service", aggregateId: "id-9" });
    expect(Object.isFrozen(ev)).toBe(true);
  });
});
