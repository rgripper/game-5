import { Observable } from 'rxjs';

export type SimpleServer<TCommand, TFrame> = {
    commands: Observable<TCommand>;
    sendFrame(frame: TFrame): void;
};
