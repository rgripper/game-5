import { fromEvent, merge, Observable } from "rxjs";

import { filter, map } from "rxjs/operators";
import { FromEventTarget } from "rxjs/internal/observable/fromEvent";
import { mapMovementKeysToCommands, MovementKeys } from "./MovementControl";
import { SimCommand } from "../../../../page-server/src/sim/sim";

type MapEventsToCommandsParams = {
  target: FromEventTarget<any>;
  movementKeys: MovementKeys;
  entityId: number;
};

export function mapEventsToCommands({
  target,
  movementKeys,
  entityId
}: MapEventsToCommandsParams) {
  const keyDowns$ = fromEvent<KeyboardEvent>(target, "keydown").pipe(
    filter(x => !x.repeat)
  );
  const keyUps$ = fromEvent<KeyboardEvent>(target, "keyup");

  const movementCommands$ = mapMovementKeysToCommands(movementKeys, {
    keyUps$,
    keyDowns$,
    entityId
  });

  const shootingCommands$ = merge(
    keyDowns$.pipe(
      filter(e => e.key === " "),
      map((e): SimCommand => ({ type: "ActorShootStart", actor_id: entityId }))
    ),
    keyUps$.pipe(
      filter(e => e.key === " "),
      map((e): SimCommand => ({ type: "ActorShootStop", actor_id: entityId }))
    )
  );

  // const mouseCommandsOn$ = fromEvent<MouseEvent>(document, 'mousedown').pipe(map(event => mapMouse(event, true, entityId)));
  // const mouseCommandsOff$ = fromEvent<MouseEvent>(document, 'mouseup').pipe(map(event => mapMouse(event, false, entityId)));
  // const mouseCommands$ = merge(mouseCommandsOn$, mouseCommandsOff$).pipe(filter(x => x !== null)) as Observable<ClientCommand>;

  const allCommands$ = merge(movementCommands$, shootingCommands$); //, mouseCommands$);

  return allCommands$;
}

function mapMouse(
  event: MouseEvent,
  is_on: boolean,
  actor_id: number
): SimCommand | undefined {
  switch (event.button) {
    case 0:
      return is_on
        ? { type: "ActorShootStart", actor_id }
        : { type: "ActorShootStop", actor_id };
    default:
      return undefined;
  }
}
