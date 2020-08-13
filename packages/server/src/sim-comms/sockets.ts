import { Observable, fromEvent, firstValueFrom, throwError, from, merge, lastValueFrom } from 'rxjs';
import { map, scan, mergeMap, first, timeout, tap, timeoutWith } from 'rxjs/operators';
import { HasEventTargetAddRemove, NodeCompatibleEventEmitter } from 'rxjs/dist/types/internal/observable/fromEvent';
import WebSocket from 'ws';

export type SimpleClient<TCommand, TFrame> = {
    frames: Observable<TFrame>;
    sendCommand(command: TCommand): void;
    ready: () => void;
};

export type SimpleServer<TCommand, TFrame> = {
    commands: Observable<TCommand>;
    sendFrame(frame: TFrame): void;
};

type Data = string | Buffer | ArrayBuffer | Buffer[];

type MessageEvent = {
    data: Data;
    type: string;
};

export const ReadyForFrames = 'ReadyForFrames';
export const AuthorizationPrefix = 'Authorization:';
export const AuthorizationSuccessful = 'AuthorizationSuccessful';

function getAuthToken(message: MessageEvent) {
    return (
        (typeof message.data === 'string' &&
            message.data.startsWith(AuthorizationPrefix) &&
            message.data.substring(AuthorizationPrefix.length)) ||
        null
    );
}

type SocketAndId<T extends WebSocketLike> = { socket: T; id: string };

enum SocketNegotiationState {
    Unauth,
    AuthAndNotReady,
    AuthAndReady,
}
type SocketNegotiation = { state: SocketNegotiationState; id: null | string };

export type WebSocketLike = HasEventTargetAddRemove<any> & { send: (data: Data) => void; isOpen(): boolean };
export type ServerLike = NodeCompatibleEventEmitter | HasEventTargetAddRemove<any>;

// const clients = await lastValueFrom(waitForClients(server, x => x, clientCount, 200, 5000));

export function createSimpleServer<TCommand, TFrame>(
    clients: SocketAndId<WebSocketLike>[],
): SimpleServer<TCommand, TFrame> {
    const commands = merge(
        ...clients.map(x => fromEvent<MessageEvent>(x.socket, 'message').pipe(map(x => JSON.parse(x.data as string)))),
    );
    const sendFrame = (frame: TFrame) => clients.forEach(x => x.socket.send(JSON.stringify(frame)));
    return {
        commands,
        sendFrame,
    };
}

/**
 * Completes when all sockets have been returned.
 */
export function waitForClients<TClient extends WebSocketLike, TServer extends ServerLike>(
    server: TServer,
    getClientIdByToken: (authToken: string) => string,
    expectedClientCount: number,
    authTimeout: number,
    waitForClientsTimeout: number,
): Observable<SocketAndId<TClient>[]> {
    return fromEvent<TClient | [TClient]>(server, 'connection').pipe(
        mergeMap(async args => {
            const socket = Array.isArray(args) ? args[0] : args;
            const id = await firstValueFrom(
                fromEvent<MessageEvent>(socket, 'message').pipe(
                    scan(
                        (negotiation, event) => {
                            if (negotiation.state === SocketNegotiationState.Unauth) {
                                const id = getAuthToken(event);
                                if (id === null) throw new Error('Expected command to be Authorization');
                                return { id, state: SocketNegotiationState.AuthAndNotReady };
                            }

                            if (negotiation.state === SocketNegotiationState.AuthAndNotReady) {
                                if (event.data !== ReadyForFrames)
                                    throw new Error('Expected command to be ReadyForFrames');
                                return { id: negotiation.id, state: SocketNegotiationState.AuthAndReady };
                            }

                            throw new Error('no more commands expected after socket has been authorized and ready');
                        },
                        { id: null, state: SocketNegotiationState.Unauth } as SocketNegotiation,
                    ),
                    tap(
                        x => x.state === SocketNegotiationState.AuthAndNotReady && socket.send(AuthorizationSuccessful), // TODO: make sure it's sent only once
                    ),
                    first(x => x.state === SocketNegotiationState.AuthAndReady),
                    map(x => x.id!),
                    timeout(authTimeout),
                    map(getClientIdByToken),
                ),
            );
            return { socket, id };
        }),
        scan((acc, socketAndId) => acc.concat(socketAndId), [] as SocketAndId<TClient>[]),
        first(socketsAndIds => socketsAndIds.length === expectedClientCount),
        timeout(waitForClientsTimeout),
    );
}

export async function connectToServer<TCommand, TFrame>(
    socket: WebSocketLike,
    authToken: string,
): Promise<SimpleClient<TCommand, TFrame>> {
    return await firstValueFrom(
        (socket.isOpen() ? from([true]) : fromEvent(socket, 'open')).pipe(
            timeoutWith(1000, throwError(new Error('Timed out waiting for socket to open'))),
            tap<WebSocket>(() => socket.send(AuthorizationPrefix + authToken)),
            mergeMap(() =>
                fromEvent<MessageEvent>(socket, 'message').pipe(
                    first(),
                    timeoutWith(1000, throwError(new Error('Timed out waiting for an authorization message'))),
                    tap(message => {
                        if (message.data !== AuthorizationSuccessful) {
                            throw new Error(
                                'Expected message data to by AuthorizationSuccessful but was something else',
                            );
                        }
                    }),
                    map(
                        (): SimpleClient<TCommand, TFrame> => {
                            let isReady = false;
                            return {
                                ready: () => {
                                    isReady = true;
                                    socket.send(ReadyForFrames);
                                },
                                frames: fromEvent(socket, 'message').pipe(
                                    map((event: MessageEvent) => {
                                        return JSON.parse(event.data as string) as TFrame;
                                    }),
                                ),
                                sendCommand: (command: TCommand) => {
                                    if (!isReady) throw new Error('Must call ready before sending commands');
                                    socket.send(JSON.stringify(command));
                                },
                            };
                        },
                    ),
                ),
            ),
        ),
    );
}
