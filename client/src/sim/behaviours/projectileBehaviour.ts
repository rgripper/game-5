import { Activity, Entity, Projectile } from "../process";
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
  
  affect(projectile: Projectile, otherEntity: Entity): Diff[] {
    return [
      { type: "Delete", targetType: "Entity", targetId: projectile.id },
      { type: "Delete", targetType: "Entity", targetId: otherEntity.id }
    ]; // TODO: damage
  }

  // TODO: area of effect - damage
}