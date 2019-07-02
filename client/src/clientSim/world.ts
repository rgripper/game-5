import { WorldState } from "../sim/sim";
import { Diff } from "../sim/Diff";

export function applyDiffToWorld (world: WorldState, diff: Diff): void {
  switch (diff.type) {
    case "Upsert": {
      if (diff.targetType == 'Entity') {
        world.entities[diff.target.id] = diff.target;
      }
      else if (diff.targetType == 'Activity') {
        world.activities[diff.target.id] = diff.target;
      }
      else if (diff.targetType == 'Player') {
        world.players[diff.target.id] = diff.target;
      }
      break;
    }
    case "Delete": {
      if (diff.targetType === 'Entity') {
        delete world.entities[diff.targetId];
        Object.values(world.activities).filter(x => x.entityId === diff.targetId).forEach(x => delete world.activities[x.id]);
      }
      else if (diff.targetType == 'Activity') {
        delete world.activities[diff.targetId];
      }
      else if (diff.targetType == 'Player') {
        delete world.players[diff.targetId];
      }
      break;
    }
  }
}