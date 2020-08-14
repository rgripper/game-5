import WebSocket from 'ws';
import { lastValueFrom } from 'rxjs';
import { connectToServer } from './client';
import { waitForClients } from './server';

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
