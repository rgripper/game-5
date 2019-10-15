import { Observable, fromEvent } from "rxjs";
import { Diff, SimCommand } from "./sim/sim";
import { map, filter } from "rxjs/operators";
import { isReadyMessageEvent, Channel, sendReadyMessage } from "./channel";
import { ClientMessageData, ClientMessageDataType } from "./channel-client";
import { isDefined } from "./helper";
import { WorldParams } from "./sim/sim";

export type SimCycleOutput = Diff[]; // TODO: move to sim

export function createServerOnChannel({ channel, onStart }: CreateServerOnChannelParams): ChannelServer {
    const getCommandFromMessageEvent = _getCommandFromMessageEventOrReplyReady({ channel, onStart });

    return {
        commands: fromEvent<MessageEvent>(channel, "message").pipe(map(getCommandFromMessageEvent), filter(isDefined)),
        sendCycleOutput: (cycleOutput: SimCycleOutput) => channel.send(JSON.stringify({ type: ServerMessageDataType.CycleOutput, cycleOutput }))
    };
}

export type ServerMessageData = {
    type: ServerMessageDataType.CycleOutput;
    cycleOutput: SimCycleOutput;
}

export enum ServerMessageDataType {
    CycleOutput,
}

export type ChannelServer = {
    commands: Observable<SimCommand>;
    sendCycleOutput(cycleOutput: SimCycleOutput): void;
}

type CreateServerOnChannelParams = { channel: Channel; onStart: (worldParams: WorldParams) => void };

const _getCommandFromMessageEventOrReplyReady = (params: CreateServerOnChannelParams) => (event: MessageEvent): SimCommand | undefined => {
    if (isReadyMessageEvent(event)) {
        sendReadyMessage(params.channel);
        return undefined;
    }
    const data = JSON.parse(event.data) as ClientMessageData;
    switch(data.type) {
        case ClientMessageDataType.Start:
            params.onStart(data.params);
            return undefined;
        case ClientMessageDataType.Command:
            return data.command;
    }

    throw new Error(`Unknown client message data type '${data!.type}'`);
}