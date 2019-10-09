import { bufferTime, map } from 'rxjs/operators';
import { Observable, ReplaySubject } from 'rxjs';
import { SimCommand } from '../sim/sim';
import { WorldParams, createSimInJavaScript } from './sim';

export type SimServerEventData = 
    | { type: 'Start', worldParams: WorldParams } 
    | { type: 'SimCommand', command: SimCommand } 
    | { type: 'Finish' }

type SimServerEvent = { data: SimServerEventData }

function listenForCommands(): Observable<SimCommand> {
    const replaySubject = new ReplaySubject<SimCommand>(undefined, 3000);
    addEventListener('message', (event: SimServerEvent) => {
        if (event.data.type !== 'SimCommand') {
            return;
        }
        replaySubject.next(event.data.command as SimCommand);
    });
    addEventListener('messageerror', (event: MessageEvent) => replaySubject.error({ error: 'Failed to process message', event }));
    addEventListener('error', (event: Event | string) => replaySubject.error({ error: 'Unhandled error', event }));
    return replaySubject;
}

onmessage = async (initEvent: SimServerEvent) => {
    if (initEvent.data.type === 'Start') {
        console.log('Start');
        const { worldParams } = initEvent.data; //{ size: { width: 640, height: 480 } };
        const sycleSim = await createSimInJavaScript(worldParams);
        const commands$ = listenForCommands();
        const batchCommands = bufferTime<SimCommand>(10);
        commands$.pipe(batchCommands, map(sycleSim)).subscribe(diffs => {
            if (diffs.length > 0)
                console.log('outgoing', diffs);
            postMessage(diffs, undefined as any)
        });
    }

    if (initEvent.data.type === 'Finish') {
        console.log('Finish');
        close();
        return;
    }
};

export default {} as typeof Worker & (new () => Worker);

