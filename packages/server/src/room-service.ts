import uuid = require('uuid');
import { BehaviorSubject } from 'rxjs';

export type RoomService = ReturnType<typeof createRoomService>;

export enum HostState {
    AssemblingPlayers,
    ConnectingSim,
    RunningSim,
}

type Player = {
    id: string;
    // TODO: probably not needed
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
        hostState: HostState.AssemblingPlayers,
        minPlayers: 1,
        maxPlayers: 8,
    },
};

//  let roomState$ = new BehaviorSubject<RoomState>();
export function createRoomService(roomState$: BehaviorSubject<RoomState>) {
    const throwIfNotAssemblingPlayers = () => {
        if (roomState$.value.hostState !== HostState.AssemblingPlayers) {
            throw new Error(`Host must be in AssemblingPlayers state to ready/unready a player`);
        }
    };

    return {
        getPlayers() {
            return roomState$.value.players;
        },
        login(name: string) {
            throwIfNotAssemblingPlayers();

            const player = roomState$.value.players.find(x => x.name === name);
            if (player) {
                return player.id;
            }

            const newPlayer = {
                id: uuid(),
                isChannelConnected: false,
                name,
                isReady: false,
            };

            roomState$.next({
                ...roomState$.value,
                players: [...roomState$.value.players, newPlayer],
            });

            return newPlayer.id;
        },
        setReady(playerId: string, isReady: boolean) {
            const roomState = roomState$.value;

            throwIfNotAssemblingPlayers();
            const player = roomState.players.find(x => x.id === playerId);
            if (!player) {
                throw new Error(`Could not find player by id ${playerId}`);
            }

            if (player.isReady === isReady) {
                throw new Error(`Player must be in isReady:${!isReady} state`);
            }

            roomState$.next({
                ...roomState$.value,
                players: roomState$.value.players.map(x => (x.id === playerId ? { ...x, isReady } : x)),
            });
        },
        // TODO: probably not needed
        setConnected(playerId: string, value: boolean) {
            roomState$.next({
                ...roomState$.value,
                players: roomState$.value.players.map(x =>
                    x.id === playerId ? { ...x, isChannelConnected: value } : x,
                ),
            });
        },
        start() {
            if (roomState$.value.hostState === HostState.RunningSim) {
                throw new Error(`Host has already started`);
            }
            roomState$.next({
                ...roomState$.value,
                hostState: HostState.RunningSim,
            });
        },
    };
}
