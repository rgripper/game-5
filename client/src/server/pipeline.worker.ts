import { bufferTime, map, tap } from 'rxjs/operators';
import { Observable, ReplaySubject } from 'rxjs';
import { SimCommand, Diff } from '../sim/sim';
import { JavaScriptSimInterop } from '../sim/interop';
export type WorldParams = {
    size: { width: number; height: number; };
}

export type SimServerEventData = 
    | { type: 'Start', worldParams: WorldParams } 
    | { type: 'SimCommand', command: SimCommand } 
    | { type: 'Finish' }

type SimServerEvent = { data: SimServerEventData }

async function streamCommandsToSimFromRust(worldParams: WorldParams, commands$: Observable<SimCommand>): Promise<Observable<Diff[]>> {
    const { SimInterop: tmp, set_panic } = await import("../../../game-5-sim/pkg/game_5_sim");
    console.log(worldParams)
    const simInterop = tmp.create(worldParams);// new SimInterop(worldParams);
    const batchCommands = bufferTime<SimCommand>(10);
    const runTickPerCommandBatch = map((commands: SimCommand[]) => {
        console.log('cmds', commands)
        return simInterop.update(commands) as any[];
    });
    return commands$.pipe(batchCommands, runTickPerCommandBatch);
}


async function streamCommandsToSimFromTypeScript(worldParams: WorldParams, commands$: Observable<SimCommand>): Promise<Observable<Diff[]>> {
    const simInterop = JavaScriptSimInterop.create(worldParams);
    const batchCommands = bufferTime<SimCommand>(10);
    const runTickPerCommandBatch = map((commands: SimCommand[]) => {
        if(commands.length > 0)
        console.log('cmds', commands)
        return simInterop.update(commands);
    });
    return commands$.pipe(batchCommands, runTickPerCommandBatch);
}

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

onmessage = (initEvent: SimServerEvent) => {
    if (initEvent.data.type === 'Start') {
        console.log('Start');
        const commands$ = listenForCommands().pipe(tap(x => console.log('cmd:', x)));
        const { worldParams } = initEvent.data; //{ size: { width: 640, height: 480 } };
        const streamCommandsToSim = false ? streamCommandsToSimFromRust : streamCommandsToSimFromTypeScript;
        streamCommandsToSim(worldParams, commands$).then(x => x.subscribe(diffs => {
            if (diffs.length > 0)
                console.log('diffs', diffs);
            postMessage(diffs, undefined as any)
        }));
        return;
    }

    if (initEvent.data.type === 'Finish') {
        console.log('Finish');
        close();
        return;
    }
};

export default {} as typeof Worker & (new () => Worker);

