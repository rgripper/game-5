import { Diff } from "./Diff";
import { actorBehaviour } from "./behaviours/actorBehaviour";
import { projectileBehaviour } from "./behaviours/projectileBehaviour";
import { Size, intersects, Point, Radians } from "./geometry";
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
  cooldown: number;
  currentCooldown: number;
}

type ProjectileActivity = {
  type: "ProjectileMove";
  rotation: number;
  velocity: number;
}
& {
  entityId: Projectile["id"];
}

type AddEntity = {
  type: "AddEntity";
  entity: Entity;
}

type AddPlayer = {
  type: "AddPlayer";
  player: Player;
}

export type CreationCommand = AddEntity | AddPlayer;

export type Activity = ActivityBase & (CharacterMove | CharacterShoot | ProjectileActivity)

export type CharacterControlCommand = {
  type: "CharacterControlCommand";
  activity: 
    | ({ type: "CharacterMove"; entityId: Actor["id"]; } & ({ is_on: true; direction: Radians; } | { is_on: false; }))
    | ({ type: "CharacterShoot"; entityId: Actor["id"]; } & ({ is_on: true; } | { is_on: false; }));
}

export type SimCommand = CreationCommand | CharacterControlCommand;

export type Player = {
  id: number;
}

export type ObjectMap<T> = {[key: string]: T}

export type WorldState = {
  size: Size;
  entities: ObjectMap<Entity>;
  activities: ObjectMap<Activity>;
  players: ObjectMap<Player>;
}

export type SimUpdate = { world: WorldState; diffs: Diff[] };

export function updateWorld (world: WorldState, simCommands: SimCommand[]): Diff[] {
  const prevActivities = Object.values(world.activities); // seems like activities are not being processed
  const simUpdate1 = prevActivities.reduce((simUpdate, item) => {
    const upd = performActivity(simUpdate.world, item);
    return { world: upd.world, diffs: [...simUpdate.diffs, ...upd.diffs] };
  }, { world, diffs: [] as Diff[] })
  
  const activityDiffs = simCommands.filter(c => c.type === "CharacterControlCommand").map(c => reduceActivitiesByCommand(simUpdate1.world.activities, c as CharacterControlCommand)).filter(x => x != undefined) as Diff[];
  activityDiffs.forEach(diff => applyDiffToWorld(world, diff));
  
  // TODO in Rust
  const addEntityDiffs = simCommands.filter(c => c.type === "AddEntity").map(c => ({ type: "Upsert", targetType: "Entity", target: (c as AddEntity).entity } as Diff));
  addEntityDiffs.forEach(diff => applyDiffToWorld(world, diff));

  // TODO in Rust
  const addPlayerDiffs = simCommands.filter(c => c.type === "AddPlayer").map(c => ({ type: "Upsert", targetType: "Player", target: (c as AddPlayer).player } as Diff));
  addPlayerDiffs.forEach(diff => applyDiffToWorld(world, diff));

  const allDiffs = [...simUpdate1.diffs, ...activityDiffs, ...addEntityDiffs, ...addPlayerDiffs];
  //const entityDiffs = lobbyCommands.map(x => ({ target: { location: { x: 25, y: 25 }, id: 1 }, type: "Upsert", targetType: "Entity" }) as EntityDiff);
  return allDiffs;
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { activity }: CharacterControlCommand): Diff | undefined {
  let currentActivity = Object.values(activities).find(x => x.type === activity.type && x.entityId === activity.entityId);
  if (activity.is_on) {
    if (!currentActivity) {
      currentActivity = activity.type === "CharacterMove" 
        ? ({ id: getNewId(), ...activity } as (ActivityBase & CharacterMove)) 
        : ({ id: getNewId(), ...activity, cooldown: 5, currentCooldown: 0 } as (ActivityBase & CharacterShoot));
    }
    
    return { type: "Upsert", targetType: "Activity", target: { ...currentActivity, ...activity } } as Diff;
  }
  else if (currentActivity) {
    return { type: "Delete", targetType: "Activity", targetId: currentActivity.id } as Diff;
  }
}

function applyDiffToWorld (world: WorldState, diff: Diff): void {
  switch (diff.type) {
    case "Upsert": {
      if (diff.targetType == 'Entity') {
        world.entities[diff.target.id] = diff.target;
      }
      else if (diff.targetType == 'Activity') {
        world.activities[diff.target.id] = diff.target;
      }
      else if (diff.targetType == 'Player') {
        world.players[diff.target.id] = diff.target;
      }
      break;
    }
    case "Delete": {
      if (diff.targetType === 'Entity') {
        delete world.entities[diff.targetId];
        Object.values(world.activities).filter(x => x.entityId === diff.targetId).forEach(x => delete world.activities[x.id]);
      }
      else if (diff.targetType == 'Activity') {
        delete world.activities[diff.targetId];
      }
      else if (diff.targetType == 'Player') {
        delete world.players[diff.targetId];
      }
      break;
    }
  }
}

function performActivity (world: WorldState, activity: Activity): SimUpdate {
  if (activity.type === "ProjectileMove") { // TODO: review this magic into a rule
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

function affect (world: WorldState, entity: Entity): Diff[] {
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
function findAffectedEntities (world: WorldState, entity: Entity) {
  return Object.values(world.entities).filter(x => intersects(entity, x));
}

function findActivatedEntities (world: WorldState, activities: Activity[]) {
  return activities.map(x => world.entities[x.entityId]);
}