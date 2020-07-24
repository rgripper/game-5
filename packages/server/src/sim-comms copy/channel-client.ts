import { Observable, fromEvent } from 'rxjs';

import { map, filter, first, timeout } from 'rxjs/operators';
import { Channel, isReadyMessageEvent } from './channel';
import { SimCycleOutput, ServerMessageData, ServerMessageDataType } from './channel-server';
import { isDefined } from '../helper';
import { WorldParams, SimCommand } from '../sim/sim';
import { MessageEvent } from 'ws';

export async function createClientOnChannel(
    channel: Channel,
    worldParams: WorldParams,
    readinessTimeout: number,
): Promise<ChannelClient> {
    const createClient = (): ChannelClient => ({
        cycleOutputs: fromEvent<MessageEvent>(channel as any, 'message').pipe(
            map(getCycleOutputFromMessageEvent),
            filter(isDefined),
        ),
        sendCommand: (command: SimCommand) => {
            const data: ClientMessageData = { type: ClientMessageDataType.Command, command };
            channel.send(JSON.stringify(data));
        },
    });

    // todo: send ready

    channel.send(JSON.stringify({ type: ClientMessageDataType.Start, worldParams }));

    return fromEvent<MessageEvent>(channel as any, 'message')
        .pipe(first(isReadyMessageEvent), timeout(readinessTimeout), map(createClient))
        .toPromise();
}

export enum ClientMessageDataType {
    Command,
}

export type ChannelClient = {
    cycleOutputs: Observable<SimCycleOutput>;
    sendCommand(command: SimCommand): void;
};

export type ClientMessageData = {
    type: ClientMessageDataType.Command;
    command: SimCommand;
};

function getCycleOutputFromMessageEvent(event: MessageEvent): SimCycleOutput | undefined {
    if (isReadyMessageEvent(event)) {
        return undefined;
    }

    if (typeof event.data !== 'string') {
        throw new TypeError('Event data must be a string');
    }

    const data = JSON.parse(event.data) as ServerMessageData;
    if (data.type === ServerMessageDataType.CycleOutput) {
        return data.cycleOutput;
    }

    throw new Error(`Unknown server message data type '${data.type}'`);
}
