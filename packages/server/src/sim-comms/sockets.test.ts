import { waitForClients, connectToServer, AuthorizationPrefix, AuthorizationSuccessful } from './sockets';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

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

    xit('returns all sockets when count is reached', async () => {
        const serverEmitter = new EventEmitter();
        const server = createFakeServer(serverEmitter);
        const waitForClientsPromise = waitForClients(server as any, x => x, 3, 1000).toPromise();

        const client1 = createFakeClient();
        serverEmitter.emit('connection', client1);
        client1.emitter.emit('message', { data: AuthorizationPrefix + '111' });
        const client2 = createFakeClient();
        serverEmitter.emit('connection', client2);
        client2.emitter.emit('message', { data: AuthorizationPrefix + '222' });
        const client3 = createFakeClient();
        serverEmitter.emit('connection', client3);
        client3.emitter.emit('message', { data: AuthorizationPrefix + '333' });

        const clients = await waitForClientsPromise;
        expect(clients).toHaveLength(3);
        expect(clients.map(x => x.id)).toEqual(['111', '222', '333']);
    });
});

describe('client', () => {
    xit('times out if server did not respond time', () => {});

    xit('connects and receives messages', async () => {
        const clientEmitter = new EventEmitter();
        const client = {
            emitter: clientEmitter,
            addEventListener: clientEmitter.addListener.bind(clientEmitter),
            removeEventListener: clientEmitter.removeListener.bind(clientEmitter),
            send: jest.fn(),
        };

        const messageHandler = jest.fn();
        const authToken = 'authToken';

        const connectionPromise = connectToServer(client, authToken, messageHandler, 1000, 1000).then();
        client.emitter.emit('open');
        await Promise.resolve();
        expect(client.send).toBeCalledWith(AuthorizationPrefix + authToken);

        client.emitter.emit('message', { data: AuthorizationSuccessful });
        client.emitter.emit('message', 'blah');

        await connectionPromise;
        expect(messageHandler).toBeCalledWith('blah');
    });
});

describe('real sockets', () => {
    fit('connects and receives messages', async () => {
        const client = new WebSocket('http://localhost:3888');
        const server = new WebSocket.Server({ port: 3888 });

        const clientWrapper = {
            addEventListener: client.addListener.bind(client),
            removeEventListener: client.removeListener.bind(client),
            send: client.send.bind(client),
        };

        try {
            const waitForClientsPromise = waitForClients(server as any, x => x, 3, 1000)
                .toPromise()
                .then();

            const authToken = 'authToken';
            const messageHandler = jest.fn();
            const connectionPromise = connectToServer(clientWrapper, authToken, messageHandler, 1000, 1000).then();
            console.log('waiting for connection');

            await connectionPromise;

            const clients = await waitForClientsPromise;
            expect(clients).toHaveLength(1);

            client.send('blah');
            await Promise.resolve();
            expect(messageHandler).toBeCalledWith('blah');
        } finally {
            client.close();
            server.close();
        }
    });
});
