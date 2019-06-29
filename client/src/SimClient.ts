import { Observable, Observer, Subscription } from "rxjs";
import { Diff } from "./sim/Diff";
import { ClientCommand } from "./sim/worldProcessor";

type UpdateStreamParams = {
    inputStream: Observable<ClientCommand>;
}

type Update = Diff[];

export function createUpdateStream (params: UpdateStreamParams): Observable<Update> {
    const simWorker = new Worker('SimWorker.js');
    params.inputStream.subscribe({ next: x => simWorker.postMessage(x), complete: () => simWorker.terminate() });

    return Observable.create((o: Observer<Update>) => {
        simWorker.onmessage = (event: MessageEvent) => o.next(event.data as Update);
        simWorker.onerror = ({ error }: ErrorEvent) => o.error({ error });
    });
}