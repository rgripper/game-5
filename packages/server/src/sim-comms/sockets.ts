import { Observable, fromEvent } from 'rxjs';
import { map, scan, mergeMap, first, timeout, tap } from 'rxjs/operators';
import { HasEventTargetAddRemove } from 'rxjs/internal/observable/fromEvent';

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

export type WebSocketLike = HasEventTargetAddRemove<MessageEvent> & { send: (data: Data) => void };
export type ServerLike<T> = HasEventTargetAddRemove<T>;
/**
 * Completes when all sockets have been returned.
 */
export function waitForClients<TClient extends WebSocketLike, TServer extends ServerLike<TClient>>(
    server: TServer,
    getClientIdByToken: (authToken: string) => string,
    expectedClientCount: number,
    authTimeout: number,
): Observable<SocketAndId<TClient>[]> {
    return fromEvent<TClient>(server, 'connection').pipe(
        mergeMap(async socket => {
            const id = await fromEvent<MessageEvent>(socket, 'message')
                .pipe(map(getAuthToken), first(isNonEmptyString), timeout(authTimeout), map(getClientIdByToken))
                .toPromise();

            return { socket, id };
        }),
        tap(socketAndId => socketAndId.socket.send(AuthorizationSuccessful)),
        scan((acc, socketAndId) => acc.concat(socketAndId), [] as SocketAndId<TClient>[]),
        first(socketsAndIds => socketsAndIds.length === expectedClientCount),
    );
}

export async function connectToServer<T extends WebSocketLike>(
    socket: T,
    authToken: string,
    onMessage: (message: MessageEvent) => void,
    openTimeout: number,
    authTimeout: number,
): Promise<() => void> {
    console.log('waiting to open');
    socket.addEventListener('message', x => console.log('some message received', x));
    await fromEvent<MessageEvent>(socket, 'open').pipe(first(), timeout(openTimeout)).toPromise();
    console.log('sending auth token');
    console.log('message received');
    socket.send(AuthorizationPrefix + authToken);
    console.log('waiting for the message');

    await fromEvent<MessageEvent>(socket, 'message')
        .pipe(
            tap(x => console.log('message has arrived', x)),
            first(x => x.data === AuthorizationSuccessful),
            tap(() => socket.addEventListener('message', onMessage)),
            timeout(authTimeout),
        )
        .toPromise();
    console.log('received the message');

    return () => socket.removeEventListener('message', onMessage);
}

//type MessageReducer<TIn, TOut> = (input: TIn) => TOut;

//function connectReducer<TIn, TOut>(reducer: MessageReducer<TIn, TOut>) {}
