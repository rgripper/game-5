"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v1_1 = __importDefault(require("uuid/v1"));
const rxjs_1 = require("rxjs");
const apollo_server_1 = require("apollo-server");
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
const pubSub = new apollo_server_1.PubSub();
//  let roomState$ = new BehaviorSubject<RoomState>();
function createRoomService(roomState$) {
    const throwIfNotStarted = () => {
        if (roomState$.value.hostState === HostState.Started) {
            throw new Error(`Host must be in NotStarted state to accept a player`);
        }
    };
    return {
        getPlayers() {
            return roomState$.value.players;
        },
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
                        isReady: false
                    }
                ] }));
            return id;
        },
        setReady(playerId, isReady) {
            throwIfNotStarted();
            const player = roomState$.value.players.find(x => x.id === playerId);
            if (!player) {
                throw new Error(`Could not find player by id ${playerId}`);
            }
            if (player.isReady === isReady) {
                throw new Error(`Player must be in isReady:${!isReady} state`);
            }
            roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: roomState$.value.players.map(x => (x.id === playerId ? Object.assign(Object.assign({}, x), { isReady }) : x)) }));
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
    players: [Player!]!
  }

  type Player {
    id: ID!
    name: String!
    isReady: Boolean!
  }

  type Mutation {
    login(name: String!): ID!

    setReady(isReady: Boolean!): Boolean
    setConnected(value: Boolean!): Boolean
  }

  type Subscription {
    players: [Player!]!
  }
`;
const roomState$ = new rxjs_1.BehaviorSubject(exports.RoomState.initial);
rxjs_1.interval(2200).subscribe(x => {
    roomState$.next(Object.assign(Object.assign({}, roomState$.value), { players: [Object.assign({}, roomState$.value.players[0])] }));
});
roomState$.subscribe(({ players }) => {
    console.log('playersUpdated', players);
    pubSub.publish('players', { players });
});
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
    context: ({ req, connection }) => {
        var _a, _b, _c, _d;
        const authToken = (_b = (_a = req) === null || _a === void 0 ? void 0 : _a.headers.authorization, (_b !== null && _b !== void 0 ? _b : (_d = (_c = connection) === null || _c === void 0 ? void 0 : _c.context) === null || _d === void 0 ? void 0 : _d.authToken));
        // try to retrieve a user with the token
        const userId = authToken;
        // add the user to the context
        return { userId, roomService: createRoomService(roomState$) };
    },
    subscriptions: {
        onConnect: ({ authToken }) => {
            if (authToken !== undefined) {
                return {
                    authToken,
                };
            }
            throw new Error('Missing auth token!');
        }
    },
    resolvers: {
        Query: {
            players: (object, { name }, context) => {
                return context.roomService.getPlayers();
            }
        },
        Mutation: {
            login: (object, { name }, context) => {
                return context.roomService.login(name);
            },
            setReady: auth((object, { isReady }, context) => {
                context.roomService.setReady(context.userId, isReady);
                return null;
            }),
            setConnected: auth((object, { value }, context) => {
                context.roomService.setConnected(context.userId, value);
                return null;
            })
        },
        Subscription: {
            players: {
                subscribe: () => pubSub.asyncIterator("players")
            }
        }
    },
    cors: true
});
apolloServer.listen(5000).then(({ url, subscriptionsUrl }) => {
    console.log(`🚀 Server ready at ${url}`);
    console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
