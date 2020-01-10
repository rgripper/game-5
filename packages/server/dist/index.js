"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_1 = __importDefault(require("uuid/v1"));
const rxjs_1 = require("rxjs");
const url_1 = require("url");
const apollo_server_1 = require("apollo-server");
//const wss = new WebSocket.Server({ port: 9000 });
function createServer(roomService, wss) {
    wss.on("connection", function connection(ws) {
        const params = new url_1.URLSearchParams(ws.url);
        const playerId = params.get("playerId");
        if (!playerId) {
            throw new Error(`PlayerId must be specified`);
        }
        roomService.setConnected(playerId, true);
        ws.on("close", () => roomService.setConnected(playerId, false));
    });
}
exports.createServer = createServer;
var PlayerState;
(function (PlayerState) {
    PlayerState[PlayerState["NotReady"] = 0] = "NotReady";
    PlayerState[PlayerState["Ready"] = 1] = "Ready";
})(PlayerState = exports.PlayerState || (exports.PlayerState = {}));
var HostState;
(function (HostState) {
    HostState[HostState["NotStarted"] = 0] = "NotStarted";
    HostState[HostState["Started"] = 1] = "Started";
})(HostState = exports.HostState || (exports.HostState = {}));
exports.RoomState = {
    initial: {
        players: [],
        hostState: HostState.NotStarted,
        minPlayers: 1,
        maxPlayers: 8
    }
};
//  let roomState$ = new BehaviorSubject<RoomState>();
function createRoomService(roomState$) {
    const throwIfNotStarted = () => {
        if (roomState$.value.hostState === HostState.Started) {
            throw new Error(`Host must be in NotStarted state to accept a player`);
        }
    };
    return {
        login(name) {
            throwIfNotStarted();
            const player = roomState$.value.players.find(x => x.name === name);
            if (player) {
                return player.id;
            }
            const id = v1_1.default();
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: [
                    ...roomState$.value.players,
                    {
                        id,
                        isChannelConnected: false,
                        name,
                        state: PlayerState.NotReady
                    }
                ] }));
            return id;
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
exports.createRoomService = createRoomService;
const typeDefs = apollo_server_1.gql `
  type Query {
    dummy: String
  }

  type Mutation {
    login(name: String!): ID!

    unready: Boolean
    ready: Boolean
    setConnected(value: Boolean!): Boolean
  }
`;
const roomState$ = new rxjs_1.BehaviorSubject(exports.RoomState.initial);
const auth = (func) => {
    return (object, args, context) => {
        if (!context.userId) {
            throw new apollo_server_1.AuthenticationError("Must be authenticated");
        }
        return func(object, args, context);
    };
};
const apolloServer = new apollo_server_1.ApolloServer({
    typeDefs,
    context: ({ req }) => {
        const token = req.headers.authorization;
        // try to retrieve a user with the token
        const userId = token;
        // add the user to the context
        return { userId, roomService: createRoomService(roomState$) };
    },
    resolvers: {
        Mutation: {
            login: (object, { name }, context) => {
                return context.roomService.login(name);
            },
            ready: auth((object, args, context) => {
                context.roomService.ready(context.userId);
                return null;
            }),
            unready: auth((object, args, context) => {
                context.roomService.unready(context.userId);
                return null;
            }),
            setConnected: auth((object, { value }, context) => {
                context.roomService.setConnected(context.userId, value);
                return null;
            })
        }
    },
    cors: true
});
apolloServer.listen(3434); // TODO: make a setting
