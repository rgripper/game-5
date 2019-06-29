import { CharacterControlCommand, AxisState } from "../sim/worldProcessor";
import { map, distinctUntilChanged, scan } from "rxjs/operators";
import { Observable, merge } from "rxjs";
import { Radians, getRadians } from "../sim/Geometry";

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
  playerId: number;
  entityId: number;
}

export type MovementKeys = {
  forward: string,
  back: string,
  left: string,
  right: string
};

export function mapMovementKeysToCommands (movementKeys: MovementKeys, { keyUps$, keyDowns$, playerId, entityId }: MapKeysToCommandsParams) {
  const keyEvents$ = merge(
    keyUps$.pipe(map(event => ({ event, reducer: removeAxisState }))),
    keyDowns$.pipe(map(event => ({ event, reducer: setAxisState })))
  );

  return keyEvents$.pipe(
    scan<{ event: KeyboardEvent; reducer: AxisTrackerReducer }, MovementTracker>(
      (tracker, { event, reducer }) => reduceTrackerWithKey(movementKeys, tracker, event.key, reducer), initialMovementTracker
    ),
    distinctUntilChanged(),
    map(movementTracker =>  mapKeyboard(movementTracker, playerId, entityId))
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

function mapKeyboard(movementTracker: MovementTracker, playerId: number, entityId: number): CharacterControlCommand {
  const isOn = !!(movementTracker.vertical.active !== undefined || movementTracker.horizontal.active !== undefined);
  console.log({ isOn, entityId });
  return {
    type: "CharacterControlCommand",
    activity: isOn 
      ? {
        type: "CharacterMove",  
        entityId,
        isOn,
        direction: getRadians(getDirection(movementTracker))
      }
      : {
        type: "CharacterMove",  
        entityId,
        isOn
      }
  }
}