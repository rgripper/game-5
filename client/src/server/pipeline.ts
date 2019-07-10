import { bufferTime, scan, map, tap } from 'rxjs/operators';
import { Observable, Observer } from 'rxjs';
import { SimInterop } from '../sim/interop';
import { SimCommand, Diff } from '../sim/sim';

export type WorldParams = {
    size: { width: number; height: number; };
}

export type SimServerEventData = 
    | { type: 'Start', worldParams: WorldParams } 
    | { type: 'SimCommand', command: SimCommand } 
    | { type: 'Finish' }

type SimServerEvent = { data: SimServerEventData }

function streamCommandsToSim(worldParams: WorldParams, commands$: Observable<SimCommand>): Observable<Diff[]> {
    const simInterop = new SimInterop(worldParams);
    const batchCommands = bufferTime<SimCommand>(10);
    const runTickPerCommandBatch = map((commands: SimCommand[]) => simInterop.update_world(commands));
    return commands$.pipe(batchCommands, runTickPerCommandBatch);
}

function listenForCommands(): Observable<SimCommand> {
    return Observable.create((o: Observer<SimCommand>) => {
        addEventListener('message', (event: SimServerEvent) => {
            if (event.data.type !== 'SimCommand') {
                return;
            }
            console.log('SimCommand');
            o.next(event.data.command as SimCommand);
        });
        addEventListener('messageerror', (event: MessageEvent) => o.error({ error: 'Failed to process message', event }));
        addEventListener('error', (event: Event | string) => o.error({ error: 'Unhandled error', event }));
    }) as Observable<SimCommand>;
}

onmessage = (initEvent: SimServerEvent) => {
    if (initEvent.data.type === 'Start') {
        console.log('Start');
        const commands$ = listenForCommands();
        const { worldParams } = initEvent.data; //{ size: { width: 640, height: 480 } };
        streamCommandsToSim(worldParams, commands$).subscribe(diffs => postMessage(diffs, undefined as any));
        return;
    }

    if (initEvent.data.type === 'Finish') {
        console.log('Finish');
        close();
        return;
    }
};



