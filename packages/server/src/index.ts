import WebSocket from "ws";
import uuid from "uuid/v1";
import { BehaviorSubject } from "rxjs";
import { URLSearchParams } from "url";
import {
  ApolloServer,
  gql,
  IResolvers,
  AuthenticationError
} from "apollo-server";

//const wss = new WebSocket.Server({ port: 9000 });
export function createServer(
  roomService: Pick<RoomService, "setConnected">,
  wss: Pick<WebSocket.Server, "on">
) {
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

export enum PlayerState {
  NotReady,
  Ready
}
export enum HostState {
  NotStarted,
  Started
}

type Player = {
  id: string;
  isChannelConnected: boolean;
  name: string;
  state: PlayerState;
};

export type RoomState = {
  players: Player[];
  hostState: HostState;
  minPlayers: number;
  maxPlayers: number;
};

export const RoomState: { initial: RoomState } = {
  initial: {
    players: [],
    hostState: HostState.NotStarted,
    minPlayers: 1,
    maxPlayers: 8
  }
};

export type RoomService = ReturnType<typeof createRoomService>;

//  let roomState$ = new BehaviorSubject<RoomState>();
export function createRoomService(roomState$: BehaviorSubject<RoomState>) {
  const throwIfNotStarted = () => {
    if (roomState$.value.hostState === HostState.Started) {
      throw new Error(`Host must be in NotStarted state to accept a player`);
    }
  };

  return {
    login(name: string) {
      throwIfNotStarted();

      if (roomState$.value.players.some(x => x.name === name)) {
        throw new Error(`Player '${name}' has already been added`);
      }

      const id = uuid();

      roomState$.next({
        ...roomState$.value,
        players: [
          ...roomState$.value.players,
          {
            id,
            isChannelConnected: false,
            name,
            state: PlayerState.NotReady
          }
        ]
      });

      return id;
    },
    unready(playerId: string) {
      throwIfNotStarted();
      const player = roomState$.value.players.find(x => x.id === playerId);
      if (!player) {
        throw new Error(`Could not find player by id ${playerId}`);
      }
      if (player.state === PlayerState.NotReady) {
        throw new Error(`Player must be in Ready state to unready`);
      }

      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map(x =>
          x.id === playerId ? { ...x, state: PlayerState.NotReady } : x
        )
      });
    },
    ready(playerId: string) {
      throwIfNotStarted();

      const player = roomState$.value.players.find(x => x.id === playerId);
      if (!player) {
        throw new Error(`Could not find player by id ${playerId}`);
      }
      if (player.state === PlayerState.Ready) {
        throw new Error(`Player must be in NotReady state to unready`);
      }

      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map(x =>
          x.id === playerId ? { ...x, state: PlayerState.Ready } : x
        )
      });
    },
    setConnected(playerId: string, value: boolean) {
      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map(x =>
          x.id === playerId ? { ...x, isChannelConnected: value } : x
        )
      });
    },
    start() {
      if (roomState$.value.hostState === HostState.Started) {
        throw new Error(`Host has already started`);
      }
      roomState$.next({
        ...roomState$.value,
        hostState: HostState.Started
      });
    }
  };
}

const typeDefs = gql`
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

const roomState$ = new BehaviorSubject(RoomState.initial);

type CustomContext = { roomService: RoomService };

type AuthCustomContext = CustomContext & { userId: string };

type ResolverMap = {
  Mutation: IResolvers<any, CustomContext>;
};

type MutationResolver<TContext extends { userId?: string }, TResult> = (
  object: unknown,
  args: any,
  context: TContext
) => TResult;

const auth = <TObj, TArgs, TContext extends { userId: string }, TResult>(
  func: MutationResolver<TContext, TResult>
) => {
  return (object: TObj, args: TArgs, context: TContext) => {
    if (!context.userId) {
      throw new AuthenticationError("Must be authenticated");
    }
    return func(object, args, context);
  };
};

const apolloServer = new ApolloServer({
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
      login: (
        object: unknown,
        { name }: { name: string },
        context: CustomContext
      ) => {
        return context.roomService.login(name);
      },
      ready: auth((object, args, context: AuthCustomContext) => {
        context.roomService.ready(context.userId);
        return null;
      }),
      unready: auth((object, args, context: AuthCustomContext) => {
        context.roomService.unready(context.userId);
        return null;
      }),
      setConnected: auth((object, { value }, context: AuthCustomContext) => {
        context.roomService.setConnected(context.userId, value);
        return null;
      })
    }
  } as any,
  cors: true
});

apolloServer.listen(3434); // TODO: make a setting
