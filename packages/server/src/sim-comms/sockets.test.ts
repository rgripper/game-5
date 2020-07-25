import { waitForClients, connectToServer, AuthorizationPrefix, AuthorizationSuccessful } from './sockets';
import { EventEmitter } from 'events';
import { fromEvent } from 'rxjs';
import { first } from 'rxjs/operators';

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

    it('throws if socket is not authorized', async () => {});

    it('times out if socket did not auth in time', () => {});

    it('times out when socket count is not reached in time', () => {});

    it('returns all sockets when count is reached', async () => {
        const serverEmitter = new EventEmitter();
        const server = createFakeServer(serverEmitter);
        const waitForClientsPromise = waitForClients(server, x => x, 3, 1000).toPromise();

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
    it('times out if server did not respond time', () => {});

    fit('connects and receives messages', async () => {
        const clientEmitter = new EventEmitter();
        const client = {
            emitter: clientEmitter,
            addEventListener: clientEmitter.addListener.bind(clientEmitter),
            removeEventListener: clientEmitter.removeListener.bind(clientEmitter),
            send: jest.fn(), // TODO: add type field or remove completely?
        };

        const messageHandler = jest.fn();
        const authToken = 'authToken';
        const authMessagePromise = fromEvent(client, 'message').pipe(first()).toPromise();
        const connectionPromise = connectToServer(client, authToken, messageHandler, 1000, 1000).then();
        client.emitter.emit('open');
        //await authMessagePromise;
        client.emitter.emit('message', { data: AuthorizationSuccessful });
        //await expect(authMessagePromise).resolves.toBe(AuthorizationPrefix + authToken);
        // client.emitter.emit('message', AuthorizationSuccessful);
        // client.emitter.emit('message', 'blah');
        await connectionPromise;
        expect(messageHandler).toBeCalledWith('blah');
    });
});
