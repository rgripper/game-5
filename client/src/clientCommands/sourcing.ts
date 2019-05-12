import { fromEvent, merge, Observable } from "rxjs";
import { ClientCommand } from "../sim/worldProcessor";
import { filter, map, tap } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";
import {  mapKeysToCommands } from "./MovementControl";

function mapMouse(event: MouseEvent, isOn: boolean, playerId: number): ClientCommand | undefined {
  switch (event.button) {
    case 0: return { type: "CharacterControlCommand", activity: { type: "CharacterShoot", playerId, entityId: 1, isOn } };
    default: return undefined;
  }
}

export function convertEventsToCommands (target: FromEventTarget<any>, playerId: number) {

  const keyDowns$ = fromEvent<KeyboardEvent>(target, 'keydown').pipe(filter(x => !x.repeat));
  const keyUps$ = fromEvent<KeyboardEvent>(target, 'keyup');
  
  const movementTrackers$ = mapKeysToCommands(keyUps$, keyDowns$);
  
  const mouseCommandsOn$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true, playerId)));
  const mouseCommandsOff$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false, playerId)));
  const mouseCommands$ = merge(mouseCommandsOn$, mouseCommandsOff$).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const allCommands$ = merge(movementTrackers$, mouseCommands$);

  return allCommands$;
}

