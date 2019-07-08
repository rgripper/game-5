import { Actor, Activity, Entity, Projectile, EntityBehaviour } from "../sim";
import { Diff } from "../Diff";
import { getNewId } from "../Identity";
import { move } from "../Physics";
import { rotatePoint } from "../Geometry";

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
      case "CharacterShoot": {
        if (activity.currentCooldown === 0) {
          return [
            { target: { ...activity, currentCooldown: activity.cooldown }, targetType: "Activity", type: "Upsert" },
            ...shoot(actor)
          ];
        }
        else {
          return [
            { target: { ...activity, currentCooldown: activity.currentCooldown - 1 }, targetType: "Activity", type: "Upsert" }
          ];
        }
      }
      default: return [];
    }
  },
  
  affect(entity: Actor, otherEntity: Entity): Diff[] {
    return []; // nothing for now
  }
}

function shoot (actor: Actor): Diff[] {
  const shootingPoint = { x: actor.size.width + 20, y: actor.size.height - 2 };
  const center = { x: actor.size.width / 2, y: actor.size.height / 2 };
  const rotatedShootingPoint = rotatePoint(shootingPoint, center, actor.rotation);
  const newLocation = { x: actor.location.x + rotatedShootingPoint.x, y: actor.location.y + rotatedShootingPoint.y };

  const projectile: Projectile = { 
    id: getNewId(), 
    location: newLocation, // TODO: generate shooting point
    size: { width: 4, height: 2 },
    rotation: actor.rotation,
    type: "Projectile" 
  };

  const projectileActivity: Activity = { 
    id: getNewId(),
    rotation: projectile.rotation, 
    velocity: 2, 
    type: "ProjectileMove", 
    entityId: projectile.id
  }
  return [
    { target: projectile, targetType: "Entity", type: "Upsert" },
    { target: projectileActivity, targetType: "Activity", type: "Upsert" }
  ];
}