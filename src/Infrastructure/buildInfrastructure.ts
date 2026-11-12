import { Clock, DeliveryRepository, EventPublisher, IdGenerator } from "../Domain/Ports";
import { InMemoryEventPublisher, LoggingEventPublisher } from "./Messaging/InMemoryEventPublisher";
import { ServiceBusEventPublisher } from "./Messaging/ServiceBusEventPublisher";
import { InMemoryDeliveryRepository } from "./Persistence/InMemory/InMemoryDeliveryRepository";
import { MongoDeliveryRepository } from "./Persistence/Mongo/MongoDeliveryRepository";
import { SystemClock, UuidGenerator } from "./Time/SystemClock";

export interface Infrastructure {
  repository: DeliveryRepository;
  publisher: EventPublisher;
  clock: Clock;
  ids: IdGenerator;
  description: { repository: string; publisher: string };
}

/** Escolhe os adaptadores concretos a partir das variáveis de ambiente. */
export function buildInfrastructure(env: NodeJS.ProcessEnv = process.env): Infrastructure {
  const useMongo = (env.DELIVERY_REPOSITORY ?? (env.MONGODB_URI ? "mongo" : "memory")) === "mongo";
  const repository = useMongo
    ? new MongoDeliveryRepository({
        uri: env.MONGODB_URI ?? "",
        database: env.MONGODB_DB ?? "cloudlog",
        collection: env.MONGODB_COLLECTION ?? "entregas",
      })
    : new InMemoryDeliveryRepository();

  const publisherKind = env.EVENT_PUBLISHER ?? (env.SERVICEBUS_CONNECTION ? "servicebus" : "log");
  const publisher =
    publisherKind === "servicebus" && env.SERVICEBUS_CONNECTION
      ? new ServiceBusEventPublisher(env.SERVICEBUS_CONNECTION, env.SERVICEBUS_QUEUE ?? "cloudlog-entregas-eventos")
      : publisherKind === "memory"
        ? new InMemoryEventPublisher()
        : new LoggingEventPublisher();

  return {
    repository,
    publisher,
    clock: new SystemClock(),
    ids: new UuidGenerator(),
    description: { repository: useMongo ? "mongodb" : "memory", publisher: publisher.constructor.name },
  };
}
