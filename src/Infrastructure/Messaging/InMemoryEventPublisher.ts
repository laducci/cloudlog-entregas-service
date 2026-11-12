import { DeliveryEvent } from "../../Domain/Delivery/DeliveryEvents";
import { EventPublisher } from "../../Domain/Ports";

export class InMemoryEventPublisher implements EventPublisher {
  readonly published: DeliveryEvent[] = [];
  async publish(event: DeliveryEvent) { this.published.push(event); }
}

export class LoggingEventPublisher implements EventPublisher {
  async publish(event: DeliveryEvent) { console.log(`[evento] ${event.type}`, JSON.stringify(event.data)); }
}
