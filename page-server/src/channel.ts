export type Channel = Pick<RTCDataChannel, 'addEventListener' | 'removeEventListener' | 'send'>

const READY_KEY = "READY";
export function isReadyMessageEvent(event: { data: string }): boolean {
    return event.data === READY_KEY;
}

export function sendReadyMessage(channel: Channel): void {
    channel.send(READY_KEY);
}
