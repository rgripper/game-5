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

      const player = roomState$.value.players.find(x => x.name === name);
      if (player) {
        return player.id;
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
    setReady(playerId: string, isReady: boolean) {
      throwIfNotStarted();
      const player = roomState$.value.players.find(x => x.id === playerId);
      if (!player) {
        throw new Error(`Could not find player by id ${playerId}`);
      }

      const newState = isReady ? PlayerState.Ready : PlayerState.NotReady;

      if (player.state === newState) {
        throw new Error(`Player must be in ${PlayerState[newState]} state`);
      }

      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map(x =>
          x.id === playerId ? { ...x, state: newState } : x
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

    setReady(isReady: Boolean!): Boolean
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
      setReady: auth((object, { isReady }, context: AuthCustomContext) => {
        context.roomService.setReady(context.userId, isReady);
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
