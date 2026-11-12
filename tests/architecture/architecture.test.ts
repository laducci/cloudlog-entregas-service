/**
 * Testes de ARQUITETURA com ArchUnitTS (pacote npm "archunit").
 * Garantem a Clean Architecture (Domain, Application, Infrastructure, API)
 * e o isolamento das fatias verticais (Vertical Slice).
 */
import { metrics, projectFiles, projectSlices } from "archunit";

const FEATURES = ["CreateDelivery", "GetDelivery", "ListDeliveries", "UpdateDelivery", "DeleteDelivery", "ApplyFreightEstimate"];
const imports = (content: string, pkg: string) => new RegExp(`from\\s+["']${pkg}["']`).test(content);

describe("Clean Architecture — regra de dependência", () => {
  it("as camadas seguem o diagrama permitido", async () => {
    const diagram = `
@startuml
  component [Domain]
  component [Application]
  component [Infrastructure]
  component [API]
  [Application] --> [Domain]
  [Infrastructure] --> [Domain]
  [API] --> [Application]
  [API] --> [Domain]
  [API] --> [Infrastructure]
@enduml`;
    await expect(projectSlices().definedBy("src/(**)/").should().adhereToDiagram(diagram)).toPassAsync();
  });

  it("Domain não depende de nenhuma outra camada", async () => {
    for (const layer of ["Application", "Infrastructure", "API"]) {
      await expect(projectFiles().inFolder("src/Domain/**").shouldNot().dependOnFiles().inFolder(`src/${layer}/**`)).toPassAsync();
    }
  });

  it("Application não depende de Infrastructure nem de API", async () => {
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Application/**").shouldNot().dependOnFiles().inFolder("src/API/**")).toPassAsync();
  });

  it("Infrastructure não depende de Application nem de API", async () => {
    await expect(projectFiles().inFolder("src/Infrastructure/**").shouldNot().dependOnFiles().inFolder("src/Application/**")).toPassAsync();
    await expect(projectFiles().inFolder("src/Infrastructure/**").shouldNot().dependOnFiles().inFolder("src/API/**")).toPassAsync();
  });

  it("endpoints da API não acessam a Infrastructure (só o Composition Root)", async () => {
    await expect(projectFiles().inFolder("src/API/Features/**").shouldNot().dependOnFiles().inFolder("src/Infrastructure/**")).toPassAsync();
  });

  it("não há dependências circulares", async () => {
    await expect(projectFiles().inFolder("src/**").should().haveNoCycles()).toPassAsync();
  });
});

describe("Vertical Slice — isolamento das features", () => {
  for (const feature of FEATURES) {
    it(`a feature ${feature} não depende de outras features`, async () => {
      for (const other of FEATURES.filter((f) => f !== feature)) {
        await expect(
          projectFiles().inFolder(`src/Application/Features/${feature}/**`).shouldNot().dependOnFiles().inFolder(`src/Application/Features/${other}/**`),
        ).toPassAsync();
        await expect(
          projectFiles().inFolder(`src/API/Features/${feature}/**`).shouldNot().dependOnFiles().inFolder(`src/API/Features/${other}/**`),
        ).toPassAsync();
      }
    });
  }

  it("casos de uso seguem a convenção <Feature>UseCase.ts", async () => {
    await expect(projectFiles().inFolder("src/Application/Features/**").should().haveName(/^[A-Z]\w+UseCase\.ts$/)).toPassAsync();
  });

  it("endpoints seguem a convenção <feature>.endpoint.ts", async () => {
    await expect(projectFiles().inFolder("src/API/Features/**").should().haveName(/^[a-z]\w+\.endpoint\.ts$/)).toPassAsync();
  });
});

describe("Pacotes externos confinados às camadas certas", () => {
  it("express só aparece na camada API", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !imports(f.content, "express") || f.path.includes("src/API/"), "express só na API");
    await expect(rule).toPassAsync();
  });

  it("mongodb só aparece em Infrastructure/Persistence/Mongo", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !imports(f.content, "mongodb") || f.path.includes("Infrastructure/Persistence/Mongo"), "mongodb só no adaptador Mongo");
    await expect(rule).toPassAsync();
  });

  it("@azure/service-bus só aparece em Infrastructure/Messaging", async () => {
    const rule = projectFiles().inFolder("src/**").should().adhereTo(
      (f) => !imports(f.content, "@azure/service-bus") || f.path.includes("Infrastructure/Messaging"), "service bus só no adaptador de mensageria");
    await expect(rule).toPassAsync();
  });
});

describe("Métricas de código", () => {
  it("nenhum arquivo de src passa de 200 linhas", async () => {
    await expect(metrics().inFolder("src/**").count().linesOfCode().shouldBeBelow(200)).toPassAsync();
  });
});
