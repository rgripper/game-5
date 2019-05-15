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

export type TickOutcome = { world: World; diffs: Diff[] };

export function reduceWorldOnTick ({ world }: TickOutcome, clientCommands: ClientCommand[]): TickOutcome {
  
  const activities = clientCommands.reduce(reduceActivitiesByCommand, world.activities);

  //const entityDiffs = lobbyCommands.map(x => ({ target: { location: { x: 25, y: 25 }, id: 1 }, type: "Upsert", targetType: "Entity" }) as EntityDiff);
  const worldWithUpdatedActivities = { ...world, activities };
  const seed: TickOutcome = { world: worldWithUpdatedActivities, diffs: [] };
  
  const activatedEntities = Object.values(activities).map(x => world.entities[x.entityId]); // TODO: filter out by activities

  const affectsOutcome = activatedEntities.reduce((outcome, entity) => {
    const nextDiffs = affect(outcome.world, entity);
    return applyAllDiffsToWorld(outcome, nextDiffs);
  }, seed);

  return Object.values(activities).reduce((outcome, activity) => {
    const nextDiffs = performActivity(outcome.world, activity);
    return applyAllDiffsToWorld(outcome, nextDiffs);
  }, affectsOutcome);
}

function applyAllDiffsToWorld ({ world, diffs }: TickOutcome, nextDiffs: Diff[]) {
  return {
    world: nextDiffs.reduce(applyDiffToWorld, world),
    diffs: [...diffs, ...nextDiffs]
  }
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
function applyDiffToWorld (world: World, diff: Diff): World {
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

  return world;
}

function performActivity (world: World, activity: Activity): Diff[] {
  if (activity.type === "ProjectileMove") { // TODO: review this magic into a rule
    const projectile = world.entities[activity.entityId] as Projectile; // TODO: remove type casting
    return projectileBehaviour.reduce(projectile, activity);
  }
  else {
    const actor = world.entities[activity.entityId] as Actor; // TODO: remove type casting
    return actorBehaviour.reduce(actor, activity);
  }
}

function findAffectedEntities (world: World, entity: Entity) {
  return Object.values(world.entities).filter(x => intersects(entity, x));
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