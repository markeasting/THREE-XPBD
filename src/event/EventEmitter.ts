
type CustomEventConstructor<T> = new (...args: any) => T;

// https://stackoverflow.com/questions/51567462/typescript-class-extends-a-generic-type
type ExtractGeneric<T> = T extends CustomEvent<infer X> ? X : never;
type EventArgument<T> = ExtractGeneric<T>;

export class EventEmitter extends EventTarget {

    private listeners: Record<string, Array<EventListenerOrEventListenerObject>> = {}

    public emit<T extends CustomEvent>(event: T) {
        this.dispatchEvent(event);
    }

    public on<T = typeof CustomEvent>(
        event: CustomEventConstructor<T>, 
        callback: (e: EventArgument<T>) => void
    ) {

        const cb = (e: Event) => {
            callback((e as CustomEvent).detail);
        }

        if (!this.listeners[event.name])
            this.listeners[event.name] = [];
            
        this.listeners[event.name].push(cb);
        
        this.addEventListener(event.name, cb);

    }

    public removeAllListeners() {
        for (const eventType in this.listeners) {
            const listeners = this.listeners[eventType];

            listeners.forEach(l => {
                this.removeEventListener(eventType, l as EventListenerOrEventListenerObject)
            })
        }
    }

}
