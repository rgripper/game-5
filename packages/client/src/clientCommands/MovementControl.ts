
import { map, distinctUntilChanged, scan } from "rxjs/operators";
import { Observable, merge } from "rxjs";
import { SimCommand } from "../../../page-server/src/sim/sim";
import { getRadians } from "./createCommands";

enum AxisState { Negative, Positive }
type AxisTracker = { active?: AxisState; suppressed?: AxisState; };
type MovementTracker = { vertical: AxisTracker; horizontal: AxisTracker; };
type AxisTrackerReducer = (tracker: AxisTracker, stateToSet: AxisState) => AxisTracker;

const initialMovementTracker: MovementTracker = {
  vertical: {},
  horizontal: {}
};

type MapKeysToCommandsParams = {
  keyUps$: Observable<KeyboardEvent>; 
  keyDowns$: Observable<KeyboardEvent>;
  entityId: number;
}

export type MovementKeys = {
  forward: string,
  back: string,
  left: string,
  right: string
};

export function mapMovementKeysToCommands (movementKeys: MovementKeys, { keyUps$, keyDowns$, entityId }: MapKeysToCommandsParams) {
  const keyEvents$ = merge(
    keyUps$.pipe(map(event => ({ event, reducer: removeAxisState }))),
    keyDowns$.pipe(map(event => ({ event, reducer: setAxisState })))
  );

  return keyEvents$.pipe(
    scan<{ event: KeyboardEvent; reducer: AxisTrackerReducer }, MovementTracker>(
      (tracker, { event, reducer }) => reduceTrackerWithKey(movementKeys, tracker, event.key, reducer), initialMovementTracker
    ),
    distinctUntilChanged(),
    map(movementTracker =>  mapKeyboard(movementTracker, entityId))
  );
}

function reduceTrackerWithKey (movementKeys: MovementKeys, movementTracker: MovementTracker, key: string, axisStateTrackerReducer: AxisTrackerReducer): MovementTracker {
  switch (key) {
    case movementKeys.back: return { ...movementTracker, vertical: axisStateTrackerReducer(movementTracker.vertical, AxisState.Positive) };
    case movementKeys.forward: return { ...movementTracker, vertical: axisStateTrackerReducer(movementTracker.vertical, AxisState.Negative) };
    case movementKeys.right: return { ...movementTracker, horizontal: axisStateTrackerReducer(movementTracker.horizontal, AxisState.Positive) };
    case movementKeys.left: return { ...movementTracker, horizontal: axisStateTrackerReducer(movementTracker.horizontal, AxisState.Negative) };
    default: return movementTracker;
  }
}

function setAxisState (axisTracker: AxisTracker, stateToSet: AxisState): AxisTracker {
  if (axisTracker.active === stateToSet) return axisTracker;

  return {
    active: stateToSet,
    suppressed: axisTracker.active
  }
}

function removeAxisState (axisTracker: AxisTracker, stateToRemove: AxisState): AxisTracker {
  const removeActiveState = axisTracker.active === stateToRemove;
  if (removeActiveState) {
    return {
      active: axisTracker.suppressed,
      suppressed: undefined
    }
  }
  else {
    return {
      active: axisTracker.active,
      suppressed: undefined
    }
  }
}

function getDirection(movementTracker: MovementTracker): number {

  // right
  if (movementTracker.vertical.active === undefined && movementTracker.horizontal.active === AxisState.Positive) {
    return 0;
  }

  // top right
  if (movementTracker.vertical.active === AxisState.Positive && movementTracker.horizontal.active === AxisState.Positive) {
    return 45;
  }

  // top
  if (movementTracker.vertical.active === AxisState.Positive && movementTracker.horizontal.active === undefined) {
    return 90;
  }

  // top left
  if (movementTracker.vertical.active === AxisState.Positive && movementTracker.horizontal.active === AxisState.Negative) {
    return 135;
  }
  
  // left
  if (movementTracker.vertical.active === undefined && movementTracker.horizontal.active === AxisState.Negative) {
    return 180;
  }

  // bottom left
  if (movementTracker.vertical.active === AxisState.Negative && movementTracker.horizontal.active === AxisState.Negative) {
    return 225;
  }

  // bottom
  if (movementTracker.vertical.active === AxisState.Negative && movementTracker.horizontal.active === undefined) {
    return 270;
  }

  // bottom right
  if (movementTracker.vertical.active === AxisState.Negative && movementTracker.horizontal.active === AxisState.Positive) {
    return 315;
  }

  throw new Error('Must not get here');
}

function mapKeyboard(movementTracker: MovementTracker, actor_id: number): SimCommand {
  const is_on = !!(movementTracker.vertical.active !== undefined || movementTracker.horizontal.active !== undefined);

  return is_on 
    ? {
        type: "ActorMoveStart",  
        actor_id,
        payload: {
          direction: getRadians(getDirection(movementTracker))
        }
    }
    : {
      type: "ActorMoveStop",
      actor_id,
    }
}