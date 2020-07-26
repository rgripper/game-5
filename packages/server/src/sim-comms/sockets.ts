import { Observable, fromEvent, ReplaySubject } from 'rxjs';
import { map, scan, mergeMap, first, timeout, tap } from 'rxjs/operators';
import { HasEventTargetAddRemove, NodeCompatibleEventEmitter } from 'rxjs/internal/observable/fromEvent';

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
            const id = await fromEvent<MessageEvent>(socket, 'message')
                .pipe(map(getAuthToken), first(isNonEmptyString), timeout(authTimeout), map(getClientIdByToken))
                .toPromise();

            return { socket, id };
        }),
        tap(socketAndId => socketAndId.socket.send(AuthorizationSuccessful)),
        scan((acc, socketAndId) => acc.concat(socketAndId), [] as SocketAndId<TClient>[]),
        first(socketsAndIds => socketsAndIds.length === expectedClientCount),
        timeout(waitForClientsTimeout),
    );
}

export async function connectToServer<T extends WebSocketLike>(
    socket: T,
    authToken: string,
    onMessage: (message: MessageEvent) => void,
    openTimeout: number,
    authTimeout: number,
): Promise<() => void> {
    const authMessageEvent$ = new ReplaySubject<MessageEvent>();
    fromEvent<MessageEvent>(socket, 'message')
        .pipe(
            first(x => x.data === AuthorizationSuccessful),
            tap(() => socket.addEventListener('message', onMessage)),
            timeout(authTimeout),
        )
        .subscribe(authMessageEvent$);

    await fromEvent(socket, 'open').pipe(first(), timeout(openTimeout)).toPromise();

    socket.send(AuthorizationPrefix + authToken);
    await authMessageEvent$.toPromise();
    return () => socket.removeEventListener('message', onMessage);
}

//type MessageReducer<TIn, TOut> = (input: TIn) => TOut;

//function connectReducer<TIn, TOut>(reducer: MessageReducer<TIn, TOut>) {}
