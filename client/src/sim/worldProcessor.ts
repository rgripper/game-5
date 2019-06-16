import { Diff } from "./Diff";
import { actorBehaviour } from "./behaviours/actorBehaviour";
import { projectileBehaviour } from "./behaviours/projectileBehaviour";
import { Size, intersects, Point, Radians } from "./Geometry";
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

type CharacterMove = {
  type: "CharacterMove";
  direction: Radians;
  entityId: Actor["id"];
}

type CharacterShoot = {
  type: "CharacterShoot";
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

export type Activity = ActivityBase & (CharacterMove | CharacterShoot | ProjectileActivity)

export type CharacterControlCommand = {
  type: "CharacterControlCommand";
  activity: 
    | ({ type: "CharacterMove"; entityId: Actor["id"]; } & ({ isOn: true; direction: Radians; } | { isOn: false; }))
    | ({ type: "CharacterShoot"; entityId: Actor["id"]; } & ({ isOn: true; } | { isOn: false; }));
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
  
  const activityDiffs = clientCommands.map(c => reduceActivitiesByCommand(simUpdate1.world.activities, c)).filter(x => x != undefined) as Diff[];
  activityDiffs.forEach(diff => applyDiffToWorld(world, diff));
  
  const allDiffs = [...simUpdate1.diffs, ...activityDiffs];
  //const entityDiffs = lobbyCommands.map(x => ({ target: { location: { x: 25, y: 25 }, id: 1 }, type: "Upsert", targetType: "Entity" }) as EntityDiff);
  return { world, diffs: allDiffs };
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { activity }: ClientCommand): Diff | undefined {
  let currentActivity = Object.values(activities).find(x => x.type === activity.type && x.entityId === activity.entityId);
  console.log(activity, currentActivity);
  if (activity.isOn) {
    if (!currentActivity) {
      currentActivity = { id: getNewId(), ...activity };
    }
    
    return { type: "Upsert", targetType: "Activity", target: { ...currentActivity, ...activity } } as Diff;
  }
  else if (currentActivity) {
    return { type: "Delete", targetType: "Activity", targetId: currentActivity.id } as Diff;
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
      console.log('delete', diff);
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
    console.log('perf', activity, activity.entityId)
    const projectile = world.entities[activity.entityId] as Projectile; // TODO: remove type casting
    
    const diffs = projectileBehaviour.reduce(projectile, activity);
    diffs.forEach(diff => applyDiffToWorld(world, diff));
    const diffs2 = affect(world, projectile);
    diffs2.forEach(diff => applyDiffToWorld(world, diff));
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
    diffs2.forEach(diff => applyDiffToWorld(world, diff));
    return {
      world,
      diffs: [...diffs, ...diffs2]
    }
  }
}

function affect (world: World, entity: Entity): Diff[] {
  if (entity.type === "Projectile") {
    if (!intersects(entity, { size: world.size, location: { x: 0, y: 0 } })) {
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