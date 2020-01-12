import { createRoomService, RoomState, PlayerState } from ".";
import { BehaviorSubject } from "rxjs";

describe(createRoomService, () => {
  it("correctly transitions through RoomStates", () => {
    const roomState$ = new BehaviorSubject(RoomState.initial);
    const roomService = createRoomService(roomState$);
    expect(roomState$.value.players.length).toBe(0);
    roomService.login("BloodyOrange");
    expect(roomState$.value.players.length).toBe(1);
    roomService.login("MoomooKing");
    expect(roomState$.value.players.length).toBe(2);
    expect(roomState$.value.players[0].state).toBe(PlayerState.NotReady);
    const playerId = roomState$.value.players[0].id;
    roomService.setReady(playerId, true);
    // TODO: add throw
    expect(roomState$.value.players[0].state).toBe(PlayerState.Ready);
    roomService.setReady(playerId, false);
    expect(roomState$.value.players[0].state).toBe(PlayerState.NotReady);
    // TODO: add throw
    expect(roomState$.value.players[0].isChannelConnected).toBe(false);
    roomService.setConnected(playerId, true);
    expect(roomState$.value.players[0].isChannelConnected).toBe(true);
  });
});
