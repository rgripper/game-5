import {
    waitForClients,
    connectToServer,
    AuthorizationPrefix,
    AuthorizationSuccessful,
    ReadyForFrames,
} from './sockets';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { lastValueFrom } from 'rxjs';

describe('server', () => {
    const createFakeServer = (serverEmitter: EventEmitter) => ({
        addEventListener: serverEmitter.addListener.bind(serverEmitter),
        removeEventListener: serverEmitter.removeListener.bind(serverEmitter),
    });
    const createFakeClient = () => {
        // TODO: make return type obey WebSocketLike
        const clientEmitter = new EventEmitter();
        const client = {
            emitter: clientEmitter,
            addEventListener: clientEmitter.addListener.bind(clientEmitter),
            removeEventListener: clientEmitter.removeListener.bind(clientEmitter),
            send: jest.fn(),
        };
        return client;
    };

    xit('throws if socket is not authorized', async () => {});

    xit('times out if socket did not auth in time', () => {});

    xit('times out when socket count is not reached in time', () => {});

    it('returns all sockets when count is reached', async () => {
        const serverEmitter = new EventEmitter();
        const server = createFakeServer(serverEmitter);
        const waitForClientsPromise = lastValueFrom(waitForClients(server, x => x, 3, 1000, 1000));

        const client1 = createFakeClient();
        serverEmitter.emit('connection', client1);
        client1.emitter.emit('message', { data: AuthorizationPrefix + '111' });
        client1.emitter.emit('message', { data: ReadyForFrames });
        const client2 = createFakeClient();
        serverEmitter.emit('connection', client2);
        client2.emitter.emit('message', { data: AuthorizationPrefix + '222' });
        client2.emitter.emit('message', { data: ReadyForFrames });
        const client3 = createFakeClient();
        serverEmitter.emit('connection', client3);
        client3.emitter.emit('message', { data: AuthorizationPrefix + '333' });
        client3.emitter.emit('message', { data: ReadyForFrames });

        const clients = await waitForClientsPromise;
        expect(clients).toHaveLength(3);
        expect(clients.map(x => x.id)).toEqual(['111', '222', '333']);
    });
});

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

describe('real sockets', () => {
    it('connects and receives messages', async done => {
        const client = new WebSocket('http://localhost:3888');
        const server = new WebSocket.Server({ port: 3888 });

        const clientWrapper = {
            addEventListener: client.addEventListener.bind(client),
            removeEventListener: client.removeEventListener.bind(client),
            send: client.send.bind(client),
            isOpen: () => client.readyState === client.OPEN,
        };

        const waitForClientsPromise = lastValueFrom(waitForClients(server, x => x, 1, 1000, 1000)).then();

        const authToken = 'authToken';
        const messageHandler = jest.fn();
        const simpleClient = await connectToServer(clientWrapper as any, authToken);
        simpleClient.frames.subscribe(messageHandler);
        simpleClient.ready();

        const clients = await waitForClientsPromise;
        expect(clients).toHaveLength(1);

        const message = { data: 5 };

        clients[0].socket.send(JSON.stringify(message));

        await Promise.resolve();
        setTimeout(() => {
            client.close();
            server.close();
            expect(messageHandler.mock.calls[0][0].data).toBe(message.data);
            done();
        }, 1000);
    });
});
