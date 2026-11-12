import request from "supertest";
import { createApp } from "../../src/API/app";
import { makeTestContext, validDelivery } from "../support";

describe("API HTTP (Express)", () => {
  const ctx = makeTestContext();
  const app = createApp(ctx.useCases);

  it("CRUD completo com os status HTTP corretos", async () => {
    const created = await request(app).post("/deliveries").send(validDelivery()).expect(201);
    const id = created.body.id;
    await request(app).get(`/deliveries/${id}`).expect(200);
    const list = await request(app).get("/deliveries").expect(200);
    expect(list.body.total).toBe(1);
    await request(app).put(`/deliveries/${id}`).send({ status: "Entregue" }).expect(422);
    await request(app).put(`/deliveries/${id}`).send({ destination: "Blumenau - SC" }).expect(200);
    await request(app).post("/deliveries").send(validDelivery()).expect(409);
    await request(app).post("/deliveries").send({}).expect(400);
    await request(app).delete(`/deliveries/${id}`).expect(204);
    await request(app).get(`/deliveries/${id}`).expect(404);
  });

  it("expõe Swagger, OpenAPI e documentação dos eventos", async () => {
    const spec = await request(app).get("/openapi.json").expect(200);
    expect(Object.keys(spec.body.paths)).toContain("/deliveries/{id}/estimate");
    await request(app).get("/docs/").expect(200);
    await request(app).get("/events/docs").expect(200);
    await request(app).get("/health").expect(200);
  });
});
