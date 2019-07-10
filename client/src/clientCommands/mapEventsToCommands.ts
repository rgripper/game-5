import { fromEvent, merge, Observable } from "rxjs";

import { filter, map } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";
import { mapMovementKeysToCommands, MovementKeys } from "./MovementControl";
import { SimCommand } from "../sim/sim";

type MapEventsToCommandsParams = { target: FromEventTarget<any>, movementKeys: MovementKeys, entityId: number }

export function mapEventsToCommands ({ target, movementKeys, entityId }: MapEventsToCommandsParams) {

  const keyDowns$ = fromEvent<KeyboardEvent>(target, 'keydown').pipe(filter(x => !x.repeat));
  const keyUps$ = fromEvent<KeyboardEvent>(target, 'keyup');
  
  const movementCommands$ = mapMovementKeysToCommands(movementKeys, { keyUps$, keyDowns$, entityId });
  
  const shootingCommands$ = 
    merge(
      keyDowns$.pipe(filter(e => e.key === " "), map(e => ({ type: "Actor", command: { type: "ActorMoveCommand", actor_id: entityId, isOn: true } } as SimCommand))),
      keyUps$.pipe(filter(e => e.key === " "), map(e => ({ type: "Actor", command: { type: "ActorMoveCommand", actor_id: entityId, isOn: false } } as SimCommand)))
    );

  // const mouseCommandsOn$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true, playerId, entityId)));
  // const mouseCommandsOff$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false, playerId, entityId)));
  // const mouseCommands$ = merge(mouseCommandsOn$, mouseCommandsOff$).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
  
  const allCommands$: Observable<SimCommand> = merge(movementCommands$, shootingCommands$)//, mouseCommands$);

  return allCommands$;
}

function mapMouse (event: MouseEvent, isOn: boolean, actor_id: number): SimCommand | undefined {
  switch (event.button) {
    case 0: return isOn 
      ? { type: "Actor", command: { type: "ActorShootCommand", actor_id, isOn } } 
      : { type: "Actor", command: { type: "ActorShootCommand", actor_id, isOn } };
    default: return undefined;
  }
}

