import { Observable, fromEvent, firstValueFrom, BehaviorSubject, throwError, from } from 'rxjs';
import { map, scan, mergeMap, first, timeout, tap, timeoutWith } from 'rxjs/operators';
import { HasEventTargetAddRemove, NodeCompatibleEventEmitter } from 'rxjs/dist/types/internal/observable/fromEvent';
import WebSocket from 'ws';

type Data = string | Buffer | ArrayBuffer | Buffer[];

type MessageEvent = {
    data: Data;
    type: string;
};

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

function isNonEmptyString(value: string | null): value is string {
    return !!value;
}

type SocketAndId<T> = { socket: T; id: string };

export type WebSocketLike = HasEventTargetAddRemove<any> & { send: (data: Data) => void };
export type ServerLike = NodeCompatibleEventEmitter | HasEventTargetAddRemove<any>;
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
                    map(getAuthToken),
                    first(isNonEmptyString),
                    timeout(authTimeout),
                    map(getClientIdByToken),
                ),
            );

            return { socket, id };
        }),
        tap(socketAndId => socketAndId.socket.send(AuthorizationSuccessful)),
        scan((acc, socketAndId) => acc.concat(socketAndId), [] as SocketAndId<TClient>[]),
        first(socketsAndIds => socketsAndIds.length === expectedClientCount),
        timeout(waitForClientsTimeout),
    );
}

export async function connectToServer(
    socket: HasEventTargetAddRemove<any> & { isOpen(): boolean; send: (data: string) => void },
    authToken: string,
    onMessage: (message: MessageEvent) => void,
): Promise<() => void> {
    await firstValueFrom(
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
                    tap(() => socket.addEventListener('message', onMessage)),
                ),
            ),
        ),
    );

    return () => socket.removeEventListener('message', onMessage);
}

//type MessageReducer<TIn, TOut> = (input: TIn) => TOut;

//function connectReducer<TIn, TOut>(reducer: MessageReducer<TIn, TOut>) {}
