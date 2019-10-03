import { bufferTime, map, first } from 'rxjs/operators';
import { Observable, Observer } from 'rxjs';
import { SimCommand, Diff } from '../sim/sim';
export type WorldParams = {
    size: { width: number; height: number; };
}

export type SimServerEventData = 
    | { type: 'Start', worldParams: WorldParams } 
    | { type: 'SimCommand', command: SimCommand } 
    | { type: 'Finish' }

type SimServerEvent = { data: SimServerEventData }

async function streamCommandsToSim(worldParams: WorldParams, commands$: Observable<SimCommand>): Promise<Observable<Diff[]>> {
    const { create_sim, update_sim, set_panic } = await import("../../../game-5-sim/pkg/game_5_sim");
    set_panic();
    const simInterop = create_sim(worldParams.size.width, worldParams.size.height);// new SimInterop(worldParams);
    /*
        command:
            actor_id: 1001  ​​​
            is_on: true
            payload:
                direction: 0
                type: "ActorMoveCommand"
        type: "Actor"
    */
    const batchCommands = bufferTime<SimCommand>(10);
    const runTickPerCommandBatch = map((commands: SimCommand[]) => {
        const interop_cmds = commands.map(({ type, ...interop_data }) => ({ [type]: interop_data }));
        console.log(interop_cmds);
        return update_sim(simInterop, interop_cmds) as any
    });
    return commands$.pipe(batchCommands, runTickPerCommandBatch);
}

function listenForCommands(): Observable<SimCommand> {
    return Observable.create((o: Observer<SimCommand>) => {
        addEventListener('message', (event: SimServerEvent) => {
            if (event.data.type !== 'SimCommand') {
                return;
            }
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
        streamCommandsToSim(worldParams, commands$).then(x => x.subscribe(diffs => postMessage(diffs, undefined as any)));
        return;
    }

    if (initEvent.data.type === 'Finish') {
        console.log('Finish');
        close();
        return;
    }
};

export default {} as typeof Worker & (new () => Worker);

