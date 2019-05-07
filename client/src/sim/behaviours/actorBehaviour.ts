import { Actor, Activity, Entity, Projectile, ProjectileActivity } from "../process";
import { EntityBehaviour } from "./EntityBehaviour";
import { Diff } from "../Diff";

// TODO: refactor
let projectile = 10;

function generateProjectileId () {
  return projectile++;
}

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
      case "Shoot": return shoot(actor);
      default: return [];
    }
  },
  
  affect(entity: Actor, otherEntity: Entity): Diff[] {
    return []; // nothing for now
  }
}

function shoot (actor: Actor): Diff[] {
  const projectile: Projectile = { 
    id: generateProjectileId(), 
    location: { ...actor.location, x: actor.location.x + actor.size.width, y: actor.location.y - actor.size.height - 15 }, // TODO: generate shooting point
    size: { width: 4, height: 2 },
    rotation: actor.rotation,
    type: "Projectile" 
  };

  const projectileActivity: Activity = { 
    id: generateProjectileId(),
    rotation: projectile.rotation, velocity: 5, type: "Projectile", entityId: projectile.id, 
    // TODO: use generic id generator?
  }
  return [
    { target: projectile, targetType: "Entity", type: "Upsert" },
    { target: projectileActivity, targetType: "Activity", type: "Upsert" }
  ];
}