import WebSocket from 'ws';

export type Channel = Pick<WebSocket, 'addEventListener' | 'removeEventListener' | 'send'>;

const READY_KEY = 'READY';
export function isReadyMessageEvent(event: { data: unknown }): boolean {
    return event.data === READY_KEY;
}

export function sendReadyMessage(channel: Channel): void {
    channel.send(READY_KEY);
}
