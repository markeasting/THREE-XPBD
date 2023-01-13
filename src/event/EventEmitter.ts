import { RayCastEvent } from "./RayCastEvent";

interface Events {
    RayCastEvent: RayCastEvent,
}

// https://stackoverflow.com/questions/51567462/typescript-class-extends-a-generic-type
type ExtractGeneric<T> = T extends CustomEvent<infer X> ? X : never

export class EventEmitter extends EventTarget {

    public emit<T extends CustomEvent>(event: T) {
        this.dispatchEvent(event);
    }

    public on<
        TKey extends keyof Events, 
        TEvents extends Events,
    >(
        event: TKey, 
        callback: (e: ExtractGeneric<TEvents[TKey]>) => void
    ) {
        this.addEventListener(event, (e: Event) => {
            callback((e as CustomEvent).detail);
        });
    }

    // public on<
    //     T extends typeof CustomEvent,
    // >(
    //     event: T, 
    //     callback: (e: ExtractGeneric<T>) => void
    // ) {
        
    //     /* */
    //     this.addEventListener(event.name, (e: Event) => {
    //         callback((e as CustomEvent).detail);
    //     });

    // }

}
