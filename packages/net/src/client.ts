import { Observable, firstValueFrom, from, fromEvent, throwError } from 'rxjs';
import { AuthorizationPrefix, AuthorizationSuccessful, ReadyForFrames } from './control-commands';
import { timeoutWith, tap, mergeMap, first, map } from 'rxjs/dist/types/operators';
import { WebSocketLike } from './base';

export type SimpleClient<TCommand, TFrame> = {
    frames: Observable<TFrame>;
    sendCommand(command: TCommand): void;
    ready: () => void;
};

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
