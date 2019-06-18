import { Actor, Activity, Entity, Projectile, AxisState, EntityBehaviour } from "../worldProcessor";
import { Diff } from "../Diff";
import { getNewId } from "../Identity";
import { move } from "../Physics";

export const actorBehaviour: EntityBehaviour<Actor> = {
  reduce(actor: Actor, activity: Activity): Diff[] {
    switch(activity.type) {
      case "CharacterMove": {
        const updatedActor = { 
          ...actor, 
          location: move(actor.location, 2, activity.direction) 
        };
        return [{ target: updatedActor, targetType: "Entity", type: "Upsert" }];
      }
      case "CharacterShoot": return shoot(actor);
      default: return [];
    }
  },
  
  affect(entity: Actor, otherEntity: Entity): Diff[] {
    return []; // nothing for now
  }
}

function shoot (actor: Actor): Diff[] {
  const projectile: Projectile = { 
    id: getNewId(), 
    location: { ...actor.location, x: actor.location.x + actor.size.width, y: actor.location.y - 4 }, // TODO: generate shooting point
    size: { width: 4, height: 2 },
    rotation: actor.rotation,
    type: "Projectile" 
  };

  const projectileActivity: Activity = { 
    id: getNewId(),
    rotation: projectile.rotation, 
    velocity: 5, 
    type: "ProjectileMove", 
    entityId: projectile.id
  }
  return [
    { target: projectile, targetType: "Entity", type: "Upsert" },
    { target: projectileActivity, targetType: "Activity", type: "Upsert" }
  ];
}