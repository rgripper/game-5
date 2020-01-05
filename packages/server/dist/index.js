import uuid from "uuid/v1";
import { URLSearchParams } from "url";
import { ApolloServer } from "apollo-server";
//const wss = new WebSocket.Server({ port: 9000 });
export function createServer(roomService, wss) {
    wss.on("connection", function connection(ws) {
        const params = new URLSearchParams(ws.url);
        const playerId = params.get("playerId");
        if (!playerId) {
            throw new Error(`PlayerId must be specified`);
        }
        roomService.setConnected(playerId, true);
        ws.on("close", () => roomService.setConnected(playerId, false));
    });
}
export var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["NotReady"] = 0] = "NotReady";
    PlayerState[PlayerState["Ready"] = 1] = "Ready";
})(PlayerState || (PlayerState = {}));
export var HostState;
(function (HostState) {
    HostState[HostState["NotStarted"] = 0] = "NotStarted";
    HostState[HostState["Started"] = 1] = "Started";
})(HostState || (HostState = {}));
export const RoomState = {
    initial: {
        players: [],
        hostState: HostState.NotStarted,
        minPlayers: 1,
        maxPlayers: 8
    }
};
//  let roomState$ = new BehaviorSubject<RoomState>();
export function createRoomService(roomState$) {
    const throwIfNotStarted = () => {
        if (roomState$.value.hostState === HostState.Started) {
            throw new Error(`Host must be in NotStarted state to accept a player`);
        }
    };
    return {
        join(name) {
            throwIfNotStarted();
            if (roomState$.value.players.some(x => x.name === name)) {
                throw new Error(`Player '${name}' has already been added`);
            }
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: [
                    ...roomState$.value.players,
                    {
                        id: uuid(),
                        isChannelConnected: false,
                        name,
                        state: PlayerState.NotReady
                    }
                ] }));
        },
        unready(playerId) {
            throwIfNotStarted();
            const player = roomState$.value.players.find(x => x.id === playerId);
            if (!player) {
                throw new Error(`Could not find player by id ${playerId}`);
            }
            if (player.state === PlayerState.NotReady) {
                throw new Error(`Player must be in Ready state to unready`);
            }
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: roomState$.value.players.map(x => (x.id === playerId ? Object.assign(Object.assign({}, x), { state: PlayerState.NotReady }) : x)) }));
        },
        ready(playerId) {
            throwIfNotStarted();
            const player = roomState$.value.players.find(x => x.id === playerId);
            if (!player) {
                throw new Error(`Could not find player by id ${playerId}`);
            }
            if (player.state === PlayerState.Ready) {
                throw new Error(`Player must be in NotReady state to unready`);
            }
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: roomState$.value.players.map(x => (x.id === playerId ? Object.assign(Object.assign({}, x), { state: PlayerState.Ready }) : x)) }));
        },
        setConnected(playerId, value) {
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: roomState$.value.players.map(x => (x.id === playerId ? Object.assign(Object.assign({}, x), { isChannelConnected: value }) : x)) }));
        },
        start() {
            if (roomState$.value.hostState === HostState.Started) {
                throw new Error(`Host has already started`);
            }
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { hostState: HostState.Started }));
        }
    };
}
const apolloServer = new ApolloServer({
    cors: true
});
apolloServer.listen(3434); // TODO: make a setting
