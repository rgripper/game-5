import { World } from "../sim/worldProcessor";
import { Diff } from "../sim/Diff";

export function applyDiffToWorld (world: World, diff: Diff): void {
    switch (diff.type) {
      case "Upsert": {
        if (diff.targetType == 'Entity') {
          world.entities[diff.target.id] = diff.target;
        }
        else {
          world.activities[diff.target.id] = diff.target;
        }
        break;
      }
      case "Delete": {
        if (diff.targetType === 'Entity') {
          delete world.entities[diff.targetId];
          Object.values(world.activities).filter(x => x.entityId === diff.targetId).forEach(x => delete world.activities[x.id]);
        }
        else {
          delete world.activities[diff.targetId];
        }
        break;
      }
    }
  }