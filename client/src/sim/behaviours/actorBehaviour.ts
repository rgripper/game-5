import { Actor, Activity, Entity } from "../process";
import { EntityBehaviour } from "./EntityBehaviour";
import { Diff } from "../Diff";

export const actorBehaviour: EntityBehaviour<Actor> = {
  reduce(actor: Actor, activity: Activity): Diff[] {
    switch(activity.type) {
      case "Horizontal": {
        const updatedActor = { ...actor, location: { ...actor.location, x: actor.location.x + 2 * (activity.isNegative ? -1 : 1) } };
        return [{ target: updatedActor, targetType: "Entity", type: "Upsert" }];
      }
      case "Vertical": {
        const updatedActor = { ...actor, location: { ...actor.location, y: actor.location.y + 2 * (activity.isNegative ? -1 : 1) } };
        return [{ target: updatedActor, targetType: "Entity", type: "Upsert" }];
      }
      default: return [];
    }
  },
  
  affect(entity: Actor, otherEntity: Entity): Diff[] {
    return []; // nothing for now
  }
}