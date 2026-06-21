import { DomainEvent } from './events';

type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as EventHandler);
  }

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];

    const allHandlers = [...handlers, ...wildcardHandlers];
    if (allHandlers.length === 0) return;

    await Promise.allSettled(
      allHandlers.map((handler) =>
        (async () => {
          try {
            await handler(event);
          } catch (error) {
            console.error(`[EventBus] Handler failed for ${event.type}:`, error);
          }
        })()
      )
    );
  }

  removeAll(): void {
    this.handlers.clear();
  }
}

export const eventBus = EventBus.getInstance();
