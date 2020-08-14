import { HasEventTargetAddRemove } from 'rxjs/dist/types/internal/observable/fromEvent';

export type WebSocketLike = HasEventTargetAddRemove<any> & { send: (data: Data) => void; isOpen(): boolean };

export type MessageEvent = {
    data: Data;
    type: string;
};

type Data = string | Buffer | ArrayBuffer | Buffer[];
