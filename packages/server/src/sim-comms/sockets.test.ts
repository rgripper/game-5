import { waitForClients, AuthorizationPrefix } from './sockets';
import { EventEmitter } from 'events';

describe('server', () => {
    const createFakeServer = (serverEmitter: EventEmitter) => ({
        addEventListener: (name: any, listener: any) => {
            serverEmitter.addListener.bind(serverEmitter)(name, (...args) => {
                //console.log('server', name, args);
                listener(...args);
            });
        },
        removeEventListener: serverEmitter.removeListener.bind(serverEmitter),
    });
    const createFakeClient = (serverEmitter: EventEmitter) => {
        // TODO: make return type obey WebSocketLike
        const clientEmitter = new EventEmitter();
        const client = {
            emitter: clientEmitter,
            addEventListener: clientEmitter.addListener.bind(clientEmitter),
            removeEventListener: clientEmitter.removeListener.bind(clientEmitter),
            send: jest.fn((data: string) => clientEmitter.emit('message', { data })), // TODO: add type field or remove completely?
        };
        serverEmitter.emit('connection', client);
        return client;
    };

    it('throws if socket is not authorized', async () => {});

    it('times out if socket did not auth in time', () => {});

    it('times out when socket count is not reached in time', () => {});

    fit('returns all sockets when count is reached', async () => {
        const serveEmitter = new EventEmitter();
        const server = createFakeServer(serveEmitter);
        const waitForClientsPromise = waitForClients(server, x => x, 3, 1000).toPromise();

        const client1 = createFakeClient(serveEmitter);
        client1.send(AuthorizationPrefix + '111');
        const client2 = createFakeClient(serveEmitter);
        client2.send(AuthorizationPrefix + '222');
        const client3 = createFakeClient(serveEmitter);
        client3.send(AuthorizationPrefix + '333');

        const clients = await waitForClientsPromise;
        expect(clients).toHaveLength(3);
    });
});

describe('client', () => {
    it('times out if server did not respond time', () => {});
});
