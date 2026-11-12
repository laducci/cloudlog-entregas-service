import { ConflictError, NotFoundError, ValidationError } from "../../src/Domain/Errors";
import { makeTestContext, validDelivery } from "../support";

describe("Casos de uso (Vertical Slices)", () => {
  it("CreateDelivery grava e publica DeliveryCreated", async () => {
    const { useCases, publisher, repository } = makeTestContext();
    const created = await useCases.createDelivery.execute(validDelivery());
    expect(await repository.findById(created.id)).not.toBeNull();
    expect(publisher.published.map((e) => e.type)).toEqual(["DeliveryCreated"]);
  });

  it("CreateDelivery rejeita código duplicado", async () => {
    const { useCases } = makeTestContext();
    await useCases.createDelivery.execute(validDelivery());
    await expect(useCases.createDelivery.execute(validDelivery())).rejects.toBeInstanceOf(ConflictError);
  });

  it("ListDeliveries filtra por status e busca", async () => {
    const { useCases } = makeTestContext();
    await useCases.createDelivery.execute(validDelivery());
    await useCases.createDelivery.execute(validDelivery({ code: "ENT-2", customer: "Farmácia Sol" }));
    expect((await useCases.listDeliveries.execute({ search: "farm" })).total).toBe(1);
    expect((await useCases.listDeliveries.execute({ status: "Pendente" })).total).toBe(2);
    await expect(useCases.listDeliveries.execute({ status: "Voando" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("UpdateDelivery altera, publica DeliveryUpdated e não deixa trocar o código", async () => {
    const { useCases, publisher } = makeTestContext();
    const { id } = await useCases.createDelivery.execute(validDelivery());
    const updated = await useCases.updateDelivery.execute(id, { customer: "Novo Cliente" });
    expect(updated.customer).toBe("Novo Cliente");
    expect(publisher.published.at(-1)?.type).toBe("DeliveryUpdated");
    await expect(useCases.updateDelivery.execute(id, { code: "X" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("GetDelivery e DeleteDelivery retornam 404 de domínio para id inexistente", async () => {
    const { useCases } = makeTestContext();
    await expect(useCases.getDelivery.execute("nao-existe")).rejects.toBeInstanceOf(NotFoundError);
    await expect(useCases.deleteDelivery.execute("nao-existe")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("DeleteDelivery remove e publica DeliveryDeleted", async () => {
    const { useCases, publisher, repository } = makeTestContext();
    const { id } = await useCases.createDelivery.execute(validDelivery());
    await useCases.deleteDelivery.execute(id);
    expect(await repository.findById(id)).toBeNull();
    expect(publisher.published.at(-1)?.type).toBe("DeliveryDeleted");
  });

  it("ApplyFreightEstimate grava frete e prazo vindos da Function", async () => {
    const { useCases } = makeTestContext();
    const { id } = await useCases.createDelivery.execute(validDelivery());
    const d = await useCases.applyFreightEstimate.execute(id, { freightCost: 612.5, etaHours: 4, estimatedDeliveryAt: "2026-11-12T16:00:00Z", serviceLevel: "Expresso" });
    expect(d.estimate).toMatchObject({ freightCost: 612.5, etaHours: 4, serviceLevel: "Expresso" });
    await expect(useCases.applyFreightEstimate.execute(id, { freightCost: "x" })).rejects.toBeInstanceOf(ValidationError);
  });
});
