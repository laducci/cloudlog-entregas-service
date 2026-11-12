import { buildInfrastructure } from "../Infrastructure/buildInfrastructure";
import { createApp } from "./app";
import { composeUseCases } from "./Composition";

const infra = buildInfrastructure(process.env);
const app = createApp(composeUseCases(infra), infra.description);
const port = Number(process.env.PORT ?? 8080);

app.listen(port, () => {
  console.log(`cloudlog-entregas-service ouvindo na porta ${port} (repo=${infra.description.repository}, eventos=${infra.description.publisher})`);
});
