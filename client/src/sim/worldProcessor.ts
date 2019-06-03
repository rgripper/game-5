import { Diff } from "./Diff";
import { actorBehaviour } from "./behaviours/actorBehaviour";
import { projectileBehaviour } from "./behaviours/projectileBehaviour";
import { Size, intersects, Point } from "./Geometry";
import { getNewId } from "./Identity";

export interface EntityBehaviour<TEntity extends Entity> {
  reduce(entity: TEntity, activity: Activity): Diff[]
  affect(entity: TEntity, otherEntity: Entity): Diff[]
}

export type UnitType = "Human" | "Monster" 

export type Actor = {
  id: number;
  unitType: UnitType;
  type: "Actor";
  playerId: number;
  location: Point;
  rotation: number;
  size: Size;

  maxHealth: number;
  currentHealth: number;
}

export type Projectile = {
  id: number;
  type: "Projectile";
  location: Point;
  rotation: number;
  size: Size;
}

export type Entity = Actor | Projectile

type ActivityBase = { id: number }

export enum AxisState { Negative, Positive }

type CharacterActivity = ({
  type: "CharacterMove";
  vertical?: AxisState;
  horizontal?: AxisState;
} | {
  type: "CharacterShoot";
})
& {
  playerId: number; // TODO: ensure player access beforehand and not pass
  entityId: Actor["id"];
}

type ProjectileActivity = {
  type: "ProjectileMove";
  rotation: number;
  velocity: number;
}
& {
  entityId: Projectile["id"];
}

export type Activity = ActivityBase & (CharacterActivity | ProjectileActivity)

export type CharacterControlCommand = {
  type: "CharacterControlCommand";
  activity: CharacterActivity & { isOn: boolean; };
}

export type ClientCommand = CharacterControlCommand

export type GameInitCommand = {
  diffs: Diff[];
}

export type Player = {
  id: number;
}

export type ObjectMap<T> = {[key: string]: T}

export type World = {
  size: Size;
  entities: ObjectMap<Entity>;
  activities: ObjectMap<Activity>;
  players: ObjectMap<Player>;
}

export type SimUpdate = { world: World; diffs: Diff[] };

export function reduceWorldOnTick ({ world }: SimUpdate, clientCommands: ClientCommand[]): SimUpdate {
  const prevActivities = Object.values(world.activities);
  const simUpdate1 = prevActivities.reduce((simUpdate, item) => performActivity(simUpdate.world, item), { world, diffs: [] as Diff[] })
  
  const nextActivities = clientCommands.reduce(reduceActivitiesByCommand, simUpdate1.world.activities);
  const activityDiffs = Object.values(nextActivities).map(target => ({ type: "Upsert", targetType: "Activity", target }) as Diff);
  activityDiffs.forEach(diff => applyDiffToWorld(world, diff));
  
  const allDiffs = [...simUpdate1.diffs, ...activityDiffs];
  //const entityDiffs = lobbyCommands.map(x => ({ target: { location: { x: 25, y: 25 }, id: 1 }, type: "Upsert", targetType: "Entity" }) as EntityDiff);
  return { world, diffs: allDiffs };
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { activity: { isOn, ...otherProps } }: ClientCommand): ObjectMap<Activity> {
  let currentActivity = Object.values(activities).find(x => x.type === otherProps.type && x.entityId === otherProps.entityId);
  
  if (isOn) {
    if (!currentActivity) {
      currentActivity = { id: getNewId(), ...otherProps };
    }
    
    return { ...activities, [currentActivity.id]: { ...currentActivity, ...otherProps } };
  }
  else {
    const copy = { ...activities };
    if (currentActivity) {
      delete copy[currentActivity.id]
    }
    return copy;
  }
}

// TODO: maybe make immutable
function applyDiffToWorld (world: World, diff: Diff): void {
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

function performActivity (world: World, activity: Activity): SimUpdate {
  if (activity.type === "ProjectileMove") { // TODO: review this magic into a rule
    const projectile = world.entities[activity.entityId] as Projectile; // TODO: remove type casting
    
    const diffs = projectileBehaviour.reduce(projectile, activity);
    diffs.forEach(diff => applyDiffToWorld(world, diff));
    const diffs2 = affect(world, projectile);

    return {
      world,
      diffs: [...diffs, ...diffs2]
    }
  }
  else {
    const actor = world.entities[activity.entityId] as Actor; // TODO: remove type casting

    const diffs = actorBehaviour.reduce(actor, activity);
    diffs.forEach(diff => applyDiffToWorld(world, diff));
    const diffs2 = affect(world, actor);

    return {
      world,
      diffs: [...diffs, ...diffs2]
    }
  }
}

function affect (world: World, entity: Entity): Diff[] {
  if (entity.type === "Projectile") {
    if (!intersects(entity, { size: world.size, location: { x: 0, y: 0 } })) {
      delete world.entities[entity.id];
      return [{ type: "Delete", targetType: "Entity", targetId: entity.id }]
    }
  }

  return findAffectedEntities(world, entity).map(otherEntity => {
    if (entity.type === "Projectile") {
      if (otherEntity.type === "Projectile") return [];// TODO: its a hack
      return projectileBehaviour.affect(entity, otherEntity);
    }
    else {
      return actorBehaviour.affect(entity, otherEntity);
    }
  }).flat();
}

// PORTED
function findAffectedEntities (world: World, entity: Entity) {
  return Object.values(world.entities).filter(x => intersects(entity, x));
}

function findActivatedEntities (world: World, activities: Activity[]) {
  return activities.map(x => world.entities[x.entityId]);
}