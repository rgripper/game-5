import { fromEvent, merge, Observable } from "rxjs";
import { SimCommand } from "../sim/sim";
import { filter, map } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";
import { mapMovementKeysToCommands, MovementKeys } from "./MovementControl";

export function mapEventsToCommands (target: FromEventTarget<any>, movementKeys: MovementKeys, playerId: number, entityId: number) {

  const keyDowns$ = fromEvent<KeyboardEvent>(target, 'keydown').pipe(filter(x => !x.repeat));
  const keyUps$ = fromEvent<KeyboardEvent>(target, 'keyup');
  
  const movementCommands$ = mapMovementKeysToCommands(movementKeys, { keyUps$, keyDowns$, entityId, playerId });
  
  const shootingCommands$ = 
    merge(
      keyDowns$.pipe(filter(e => e.key === " "), map(e => ({ type: "CharacterControlCommand", activity: { type: "CharacterShoot", entityId, isOn: true } } as SimCommand))),
      keyUps$.pipe(filter(e => e.key === " "), map(e => ({ type: "CharacterControlCommand", activity: { type: "CharacterShoot", entityId, isOn: false } } as SimCommand)))
    );

  // const mouseCommandsOn$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true, playerId, entityId)));
  // const mouseCommandsOff$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false, playerId, entityId)));
  // const mouseCommands$ = merge(mouseCommandsOn$, mouseCommandsOff$).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const allCommands$ = merge(movementCommands$, shootingCommands$)//, mouseCommands$);

  return allCommands$;
}

function mapMouse (event: MouseEvent, isOn: boolean, playerId: number, entityId: number): SimCommand | undefined {
  switch (event.button) {
    case 0: return { type: "CharacterControlCommand", activity: isOn ? { type: "CharacterShoot", entityId, isOn } : { type: "CharacterShoot", entityId, isOn } };
    default: return undefined;
  }
}

