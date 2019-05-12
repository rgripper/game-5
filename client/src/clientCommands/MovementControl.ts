import { CharacterControlCommand, AxisState } from "../sim/worldProcessor";
import { map, distinctUntilChanged, scan } from "rxjs/operators";
import { Observable, merge } from "rxjs";

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

export function mapKeysToCommands ({ keyUps$, keyDowns$, playerId, entityId }: MapKeysToCommandsParams) {
  const keyEvents$ = merge(
    keyUps$.pipe(map(event => ({ event, reducer: removeAxisState }))),
    keyDowns$.pipe(map(event => ({ event, reducer: setAxisState })))
  );

  return keyEvents$.pipe(
    scan<{ event: KeyboardEvent; reducer: AxisTrackerReducer }, MovementTracker>(
      (tracker, { event, reducer }) => reduceTrackerWithKey(tracker, event.key, reducer), initialMovementTracker
    ),
    distinctUntilChanged(),
    map(movementTracker =>  mapKeyboard(movementTracker, playerId, entityId))
  );
}

function reduceTrackerWithKey (movementTracker: MovementTracker, key: string, axisStateTrackerReducer: AxisTrackerReducer): MovementTracker {
  switch (key) {
    case 's': return { ...movementTracker, vertical: axisStateTrackerReducer(movementTracker.vertical, AxisState.Positive) };
    case 'w': return { ...movementTracker, vertical: axisStateTrackerReducer(movementTracker.vertical, AxisState.Negative) };
    case 'd': return { ...movementTracker, horizontal: axisStateTrackerReducer(movementTracker.horizontal, AxisState.Positive) };
    case 'a': return { ...movementTracker, horizontal: axisStateTrackerReducer(movementTracker.horizontal, AxisState.Negative) };
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

function mapKeyboard(movementTracker: MovementTracker, playerId: number, entityId: number): CharacterControlCommand {
  const isOn = !!(movementTracker.vertical.active !== undefined || movementTracker.horizontal.active !== undefined);
  return {
    type: "CharacterControlCommand",
    activity: {
      type: "CharacterMove", 
      playerId,  
      entityId,
      isOn,
      vertical: movementTracker.vertical.active,
      horizontal: movementTracker.horizontal.active
    }
  }
}