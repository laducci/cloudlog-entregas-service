# CloudLog · Microserviço de Entregas (MongoDB Atlas)

Projeto PJBL da disciplina **Arquitetura de Software e Soluções Cloud** (PUCPR) - Prof. Manoel Valerio da Silveira Neto.

## Alunos

- Camilla Augusta Uber
- João Davi
- Laura Guillarducci

## Sobre

Microserviço 1. Responsável pelo domínio **Entregas** (RF-03): CRUD completo, regras de transição de status e publicação de eventos de domínio no **Azure Service Bus** (Event-Driven Architecture). Banco exclusivo: **MongoDB Atlas** (Database per Service).

## Arquitetura da solução

```mermaid
flowchart LR
  U([Usuário]) --> MFE[Microfrontend React<br/>Shell + Dashboard, Entregas, Frota]
  MFE -->|HTTPS + subscription key| GW[API Gateway<br/>Azure API Management]
  GW --> BFF[BFF Node.js / Express<br/>GET /aggregated-data]
  BFF --> MS1[Microserviço Entregas] --> MDB[(MongoDB Atlas)]
  BFF --> MS2[Microserviço Frota] --> SQL[(Azure SQL Database)]
  BFF --> FN1[Azure Function<br/>HTTP Trigger: frete]
  MS1 -- DeliveryCreated / Updated / Deleted --> SB[[Azure Service Bus]]
  SB --> FN2[Azure Function<br/>Service Bus Trigger]
  FN2 -- PUT /deliveries/id/estimate --> MS1
```

| Projeto | Repositório |
|---|---|
| Microfrontend (React) | [cloudlog-frontend](https://github.com/laducci/cloudlog-frontend) |
| BFF (Node.js/Express) | [cloudlog-bff](https://github.com/laducci/cloudlog-bff) |
| Microserviço de Entregas (MongoDB) | [cloudlog-entregas-service](https://github.com/laducci/cloudlog-entregas-service) |
| Microserviço de Frota (Azure SQL) | [cloudlog-frota-service](https://github.com/laducci/cloudlog-frota-service) |
| Azure Function (frete + eventos) | [cloudlog-function](https://github.com/laducci/cloudlog-function) |

### Clean Architecture + Vertical Slice

```
src/
├── Domain/          entidades, regras de negócio, erros e portas (interfaces) - sem dependências externas
├── Application/
│   └── Features/    uma pasta por caso de uso (Vertical Slice)
│       ├── CreateDelivery/  GetDelivery/  ListDeliveries/
│       ├── UpdateDelivery/  DeleteDelivery/  ApplyFreightEstimate/
├── Infrastructure/  adaptadores concretos (banco, mensageria, HTTP) que implementam as portas do Domain
└── API/             camada de entrada (Express/Functions), Swagger e Composition Root
```

Regra de dependência (verificada pelos testes de arquitetura com **ArchUnitTS**):
`API → Application → Domain` e `Infrastructure → Domain`. O Domain não conhece nenhuma outra camada,
a Application não conhece Infrastructure nem API, e uma feature não importa outra feature.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/deliveries` | lista (filtros `status`, `search`) |
| GET | `/deliveries/{id}` | busca |
| POST | `/deliveries` | cadastra e publica `DeliveryCreated` |
| PUT | `/deliveries/{id}` | altera dados/status e publica `DeliveryUpdated` |
| DELETE | `/deliveries/{id}` | exclui e publica `DeliveryDeleted` |
| PUT | `/deliveries/{id}/estimate` | grava frete/prazo calculados pela Azure Function |
| GET | `/docs` · `/openapi.json` | Swagger |
| GET | `/events/docs` · `/events/asyncapi.yaml` | documentação dos eventos (AsyncAPI) |

### Regras de negócio

- Código único (409), peso e distância maiores que zero (400).
- Transições: Pendente → Em rota/Cancelada; Em rota → Entregue/Atrasada; Atrasada → Entregue/Em rota; Entregue e Cancelada são finais (422).
- Só sai **Em rota** com motorista e veículo; entrega em andamento não pode ser excluída.
- Alterar peso ou distância invalida a estimativa de frete anterior.

### Eventos (EDA)

Fila `cloudlog-entregas-eventos` no Azure Service Bus. Envelope: `{ type, version, source, aggregateId, occurredAt, data }`.
A Azure Function `processarEventoEntrega` consome a fila, calcula frete/prazo e chama `PUT /deliveries/{id}/estimate`.

## Tecnologias

- Node.js 22 + TypeScript
- Vitest (testes unitários) + ArchUnitTS (testes de arquitetura)
- Express 4 + swagger-ui-express (OpenAPI 3)
- MongoDB Atlas (driver `mongodb`)
- Azure Service Bus (`@azure/service-bus`) + AsyncAPI para documentar os eventos
- Docker (imagem `node:22-alpine`) · Azure Container Apps

## Endereços na nuvem

| Recurso | URL |
|---|---|
| Frontend (microfrontend) | https://stcloudlogweba6058.z15.web.core.windows.net |
| API Gateway (Azure API Management) | https://apim-cloudlog-a6058.azure-api.net/cloudlog/aggregated-data (header `Ocp-Apim-Subscription-Key`) |
| BFF · Swagger | https://ca-cloudlog-bff.delightfulbeach-476aeb68.brazilsouth.azurecontainerapps.io/docs |
| Microserviço Entregas · Swagger | https://ca-cloudlog-entregas.delightfulbeach-476aeb68.brazilsouth.azurecontainerapps.io/docs |
| Eventos (AsyncAPI) | https://ca-cloudlog-entregas.delightfulbeach-476aeb68.brazilsouth.azurecontainerapps.io/events/docs |
| Microserviço Frota · Swagger | https://ca-cloudlog-frota.delightfulbeach-476aeb68.brazilsouth.azurecontainerapps.io/docs |
| Azure Function · Swagger | https://func-cloudlog-a6058.azurewebsites.net/api/docs |
| Docker Hub | https://hub.docker.com/u/laducci |

## Como rodar localmente

```bash
npm install
cp .env.example .env        # ajuste as variáveis
npm run build
PORT=8081 DELIVERY_REPOSITORY=memory EVENT_PUBLISHER=log npm start
# Swagger: http://localhost:8081/docs
```

> Com `DELIVERY_REPOSITORY=memory` o serviço sobe sem banco (útil para testar).

Com Docker:

```bash
docker build -t cloudlog/cloudlog-entregas-service .
docker run -p 8081:8080 --env-file .env cloudlog/cloudlog-entregas-service
```

Publicação no Docker Hub (`scripts/docker-publish.sh <usuario> v1`):

```bash
docker build -t docker.io/<usuario>/cloudlog-entregas-service:v1 .
docker login docker.io
docker push docker.io/<usuario>/cloudlog-entregas-service:v1
```

## Testes

```bash
npm run test:arch   # testes de arquitetura (ArchUnitTS)
npm run test:unit   # testes unitários
npm test            # todos
```
