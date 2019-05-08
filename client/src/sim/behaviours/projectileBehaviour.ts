import { Activity, Entity, Projectile, Actor } from "../worldProcessor";
import { EntityBehaviour } from "./EntityBehaviour";
import { Diff } from "../Diff";
import { move } from "../Physics";

export const projectileBehaviour: EntityBehaviour<Projectile> = {
  reduce(projectile: Projectile, activity: Activity): Diff[] {
    switch (activity.type) {
      case "Projectile": {
        const updatedProjectile = { 
          ...projectile, 
          location: move(projectile.location, activity.velocity, activity.rotation)
        };
        return [{ target: updatedProjectile, targetType: "Entity", type: "Upsert" }];
      }
      default: throw new Error('Invalid activity'); // TODO
    }
  },
  
  // TODO: area of effect - damage, apply to an array?
  affect(projectile: Projectile, otherEntity: Entity): Diff[] {
    if (otherEntity.type === "Projectile") {
      return [];
    }
    return [
      { type: "Delete", targetType: "Entity", targetId: projectile.id },
      applyDamage(projectile, otherEntity)
    ]; // TODO: damage
  }
}

function applyDamage(projectile: Projectile, otherActor: Actor): Diff {
  const nextHealth = otherActor.currentHealth - 2;
  if (nextHealth <= 0) {
    return { type: "Delete", targetType: "Entity", targetId: otherActor.id };
  }
  else {
    return { type: "Upsert", targetType: "Entity", target: { ...otherActor, currentHealth: nextHealth } };
  }
}