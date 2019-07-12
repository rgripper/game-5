import { Observable, Observer, Subscription } from "rxjs";

import { SimCommand, Diff } from "./sim/sim";
import { SimServerEventData, WorldParams } from "./server/pipeline";

type UpdateStreamParams = {
    worldParams: WorldParams;
}

type Update = Diff[];

type PipelineClient = {
    subscribeInput: (input$: Observable<SimCommand>) => Subscription;
    output$: Observable<Update>;
}

export function configurePipeline() {
    
}

export function createPipeline (params: UpdateStreamParams): PipelineClient {
    const simWorker = new Worker('serverPipeline.bundle.js');
    const postStart = (worldParams: WorldParams) => simWorker.postMessage({ type: 'Start', worldParams } as SimServerEventData, undefined as any);
    const postCommand = (command: SimCommand) => simWorker.postMessage({ type: 'SimCommand', command } as SimServerEventData, undefined as any);
    const postFinish = () => simWorker.postMessage({ type: 'Finish' } as SimServerEventData, undefined as any)
    
    postStart(params.worldParams);

    return {
        subscribeInput: (input$: Observable<SimCommand>) => input$.subscribe({ next: postCommand, complete: postFinish }),
        output$: Observable.create((o: Observer<Update>) => {
            simWorker.onmessage = (event: MessageEvent) => o.next(event.data as Update);
            simWorker.onerror = ({ error }: ErrorEvent) => o.error({ error });
        })
    }
}