import { connectToServer } from './client';
import { EventEmitter } from 'events';
import { AuthorizationSuccessful, AuthorizationPrefix } from './control-commands';

describe('client', () => {
    xit('times out if server did not respond time', () => {});

    it('connects and receives messages', async () => {
        const clientEmitter = new EventEmitter();
        const client = {
            emitter: clientEmitter,
            addEventListener: clientEmitter.addListener.bind(clientEmitter),
            removeEventListener: clientEmitter.removeListener.bind(clientEmitter),
            send: jest.fn(),
            isOpen: () => false,
        };

        const messageHandler = jest.fn();
        const authToken = 'authToken';

        const simpleClientPromise = connectToServer(client, authToken);
        client.emitter.emit('open');
        client.emitter.emit('message', { data: AuthorizationSuccessful });

        const simpleClient = await simpleClientPromise;
        simpleClient.frames.subscribe(messageHandler);
        simpleClient.ready();

        await Promise.resolve();
        const message = { data: 5 };

        client.emitter.emit('message', message); // TODO: should it allowed to send other messages straight after auth success?
        await Promise.resolve();

        expect(client.send).toBeCalledWith(AuthorizationPrefix + authToken);

        expect(messageHandler).toBeCalledWith(message.data);
    });
});
