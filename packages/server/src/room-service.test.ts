import { createRoomService, RoomState } from "./room-service";
import { BehaviorSubject } from "rxjs";

describe(createRoomService, () => {
  it("correctly transitions through RoomStates", async () => {
    const roomState$ = new BehaviorSubject(RoomState.initial);
    const roomService = createRoomService(roomState$);
    expect(roomState$.value.players.length).toBe(0);
    roomService.login("BloodyOrange");
    expect(roomState$.value.players.length).toBe(1);
    roomService.login("MoomooKing");
    expect(roomState$.value.players.length).toBe(2);
    expect(roomState$.value.players[0].isReady).toBe(false);
    const playerId = roomState$.value.players[0].id;
    roomService.setReady(playerId, true);
    // TODO: add throw
    expect(roomState$.value.players[0].isReady).toBe(true);
    roomService.setReady(playerId, false);
    expect(roomState$.value.players[0].isReady).toBe(false);
    // TODO: add throw
    expect(roomState$.value.players[0].isChannelConnected).toBe(false);
    roomService.setConnected(playerId, true);
    expect(roomState$.value.players[0].isChannelConnected).toBe(true);
  });
});
