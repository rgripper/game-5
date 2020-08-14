import { Observable, merge, fromEvent, firstValueFrom } from 'rxjs';
import { AuthorizationPrefix, ReadyForFrames, AuthorizationSuccessful } from './control-commands';
import { NodeCompatibleEventEmitter, HasEventTargetAddRemove } from 'rxjs/dist/types/internal/observable/fromEvent';
import { map, mergeMap, scan, tap, first, timeout } from 'rxjs/operators';
import { WebSocketLike } from './base';

export type SimpleServer<TCommand, TFrame> = {
    commands: Observable<TCommand>;
    sendFrame(frame: TFrame): void;
};

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

type ServerLike = NodeCompatibleEventEmitter | HasEventTargetAddRemove<any>;

// const clients = await lastValueFrom(waitForClients(server, x => x, clientCount, 200, 5000));
