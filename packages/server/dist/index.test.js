"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const rxjs_1 = require("rxjs");
describe(_1.createRoomService, () => {
    it("correctly transitions through RoomStates", () => {
        const roomState$ = new rxjs_1.BehaviorSubject(_1.RoomState.initial);
        const roomService = _1.createRoomService(roomState$);
        expect(roomState$.value.players.length).toBe(0);
        roomService.login("BloodyOrange");
        expect(roomState$.value.players.length).toBe(1);
        roomService.login("MoomooKing");
        expect(roomState$.value.players.length).toBe(2);
        expect(roomState$.value.players[0].isReady).toBe(true);
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
