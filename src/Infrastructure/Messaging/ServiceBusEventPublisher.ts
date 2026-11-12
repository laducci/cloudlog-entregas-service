import { ServiceBusClient, ServiceBusSender } from "@azure/service-bus";
import { DeliveryEvent } from "../../Domain/Delivery/DeliveryEvents";
import { EventPublisher } from "../../Domain/Ports";

/** Publica os eventos de domínio em uma fila do Azure Service Bus. */
export class ServiceBusEventPublisher implements EventPublisher {
  private readonly sender: ServiceBusSender;

  constructor(connectionString: string, queue: string, private readonly log: (msg: string) => void = console.log) {
    this.sender = new ServiceBusClient(connectionString).createSender(queue);
  }

  async publish(event: DeliveryEvent): Promise<void> {
    try {
      await this.sender.sendMessages({
        body: event,
        contentType: "application/json",
        subject: event.type,
        messageId: `${event.aggregateId}:${event.type}:${event.occurredAt}`,
        applicationProperties: { eventType: event.type, version: event.version },
      });
      this.log(`[evento] ${event.type} publicado (${event.data.code})`);
    } catch (err) {
      // best effort: a falha na mensageria não desfaz a operação já gravada no banco
      this.log(`[evento] falha ao publicar ${event.type}: ${(err as Error).message}`);
    }
  }
}
