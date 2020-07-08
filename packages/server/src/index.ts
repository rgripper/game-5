import WebSocket from "ws";
import uuid from "uuid/v1";
import { BehaviorSubject, interval } from "rxjs";
import { URLSearchParams } from "url";
import {
  ApolloServer,
  gql,
  IResolvers,
  AuthenticationError,
  PubSub,
} from "apollo-server";
import { RoomState, RoomService, createRoomService } from "./room-service";

const pubSub = new PubSub();

const typeDefs = gql`
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

const roomState$ = new BehaviorSubject(RoomState.initial);
interval(2200).subscribe((x) => {
  roomState$.next({
    ...roomState$.value,
    players: [{ ...roomState$.value.players[0] }],
  });
});
roomState$.subscribe(({ players }) => {
  console.log("playersUpdated", players);
  pubSub.publish("players", { players });
});

type CustomContext = { roomService: RoomService };

type AuthCustomContext = CustomContext & { userId: string };

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
  context: ({ req, connection }) => {
    const authToken =
      req?.headers.authorization ?? connection?.context?.authToken;

    // try to retrieve a user with the token
    const userId = authToken;

    // add the user to the context
    return { userId, roomService: createRoomService(roomState$) };
  },
  subscriptions: {
    onConnect: ({ authToken }: { authToken?: string }) => {
      if (authToken !== undefined) {
        return {
          authToken,
        };
      }

      throw new Error("Missing auth token!");
    },
  },
  resolvers: {
    Query: {
      players: (
        object: unknown,
        { name }: { name: string },
        context: CustomContext
      ) => {
        return context.roomService.getPlayers();
      },
    },
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
      }),
    },
    Subscription: {
      players: {
        subscribe: () => pubSub.asyncIterator("players"),
      },
    },
  } as any,
  cors: true,
});

apolloServer.listen(5000).then(({ url, subscriptionsUrl }) => {
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionsUrl}`);
});
