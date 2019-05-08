import { Activity, Entity } from "../worldProcessor";
import { Diff } from "../Diff";

export interface EntityBehaviour<TEntity extends Entity> {
  reduce(entity: TEntity, activity: Activity): Diff[]
  affect(entity: TEntity, otherEntity: Entity): Diff[]
}