import uuid = require("uuid");
import { BehaviorSubject } from "rxjs";

export type RoomService = ReturnType<typeof createRoomService>;

export enum HostState {
  NotStarted,
  Started,
}

type Player = {
  id: string;
  isChannelConnected: boolean;
  name: string;
  isReady: boolean;
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
    maxPlayers: 8,
  },
};

//  let roomState$ = new BehaviorSubject<RoomState>();
export function createRoomService(roomState$: BehaviorSubject<RoomState>) {
  const throwIfNotStarted = () => {
    if (roomState$.value.hostState === HostState.Started) {
      throw new Error(`Host must be in NotStarted state to accept a player`);
    }
  };

  return {
    getPlayers() {
      return roomState$.value.players;
    },
    login(name: string) {
      throwIfNotStarted();

      const player = roomState$.value.players.find((x) => x.name === name);
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
            isReady: false,
          },
        ],
      });

      return id;
    },
    setReady(playerId: string, isReady: boolean) {
      throwIfNotStarted();
      const player = roomState$.value.players.find((x) => x.id === playerId);
      if (!player) {
        throw new Error(`Could not find player by id ${playerId}`);
      }

      if (player.isReady === isReady) {
        throw new Error(`Player must be in isReady:${!isReady} state`);
      }

      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map((x) =>
          x.id === playerId ? { ...x, isReady } : x
        ),
      });
    },
    setConnected(playerId: string, value: boolean) {
      roomState$.next({
        ...roomState$.value,
        players: roomState$.value.players.map((x) =>
          x.id === playerId ? { ...x, isChannelConnected: value } : x
        ),
      });
    },
    start() {
      if (roomState$.value.hostState === HostState.Started) {
        throw new Error(`Host has already started`);
      }
      roomState$.next({
        ...roomState$.value,
        hostState: HostState.Started,
      });
    },
  };
}
