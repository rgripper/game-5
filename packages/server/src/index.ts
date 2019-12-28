import WebSocket from "ws";
import uuid from "uuid/v1";
import { BehaviorSubject } from "rxjs";
import { URLSearchParams } from "url";

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
    join(name: string) {
      throwIfNotStarted();

      if (roomState$.value.players.some(x => x.name === name)) {
        throw new Error(`Player '${name}' has already been added`);
      }

      roomState$.next({
        ...roomState$.value,
        players: [
          ...roomState$.value.players,
          {
            id: uuid(),
            isChannelConnected: false,
            name,
            state: PlayerState.NotReady
          }
        ]
      });
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
