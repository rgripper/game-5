import { Diff } from "./Diff";
import { actorBehaviour } from "./behaviours/actorBehaviour";
import { projectileBehaviour } from "./behaviours/projectileBehaviour";
import { Location } from './Physics';

export type Size = { width: number; height: number; }

export type UnitType = "Human" | "Monster" 

export type Actor = {
  id: number;
  unitType: UnitType;
  type: "Actor";
  playerId: number;
  location: Location;
  rotation: number;
  size: Size;
}

export type Projectile = {
  id: number;
  type: "Projectile";
  location: Location;
  rotation: number;
  size: Size;
}

export type Entity = Actor | Projectile

type CharacterActivity = ({
  type: "Horizontal" | "Vertical";
  isNegative: boolean;
} | {
  type: "Shoot";
})
& {
  playerId: number;
  entityId: Actor["id"];
}

export type ProjectileActivity = {
  type: "Projectile";
  rotation: number;
  velocity: number;
}
& {
  entityId: Projectile["id"];
}

export type Activity = { id: number } & (CharacterActivity | ProjectileActivity)

export type CharacterCommand = {
  type: "CharacterCommand";
  activity: CharacterActivity & { isOn: boolean; };
}

export type ClientCommand = CharacterCommand

type Player = {
  id: number;
}

type ObjectMap<T> = {[key: string]: T}

export type World = {
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

  activatedEntities.map(entity => affect(world, entity));

  return Object.values(activities).reduce(({ world, diffs }, activity) => {
    const nextDiffs = performActivity(world, activity);
    return {
      world: nextDiffs.reduce(applyDiffToWorld, world),
      diffs: [...diffs, ...nextDiffs]
    }
  }, seed);
}

let id = 100; // TODO: everything should acquire id from here

function getNewActivityId () {
  return id++;
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { activity: { isOn, ...otherProps } }: ClientCommand): ObjectMap<Activity> {
  let currentActivity = Object.values(activities).find(x => x.type === otherProps.type && x.entityId === otherProps.entityId);
  if (isOn) {
    if (!currentActivity) {
      currentActivity = { id: getNewActivityId(), ...otherProps };
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
      if (diff.targetType == 'Entity') {
        delete world.entities[diff.targetId];
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
  if (activity.type === "Projectile") {
    const projectile = world.entities[activity.entityId] as Projectile; // TODO: remove type casting
    return projectileBehaviour.reduce(projectile, activity);
  }
  else {
    const actor = world.entities[activity.entityId] as Actor; // TODO: remove type casting
    return actorBehaviour.reduce(actor, activity);
  }
}

function intersects (rect1: { size: Size, location: Location }, rect2: { size: Size, location: Location }) {
  return (
    rect1.location.x > (rect2.location.x + rect2.size.width)
    ||
    (rect1.location.x + rect1.size.width) < rect2.location.x
    ||
    rect1.location.y > (rect2.location.y + rect2.size.height)
    ||
    (rect1.location.y + rect1.size.height) < rect2.location.y
  );
}

function findAffectedEntities (world: World, entity: Entity) {
  return Object.values(world.entities).filter(x => intersects(entity, x));
}

function affect (world: World, entity: Entity): Diff[] {
  return findAffectedEntities(world, entity).map(otherEntity => {
    if (entity.type === "Projectile") {
      return projectileBehaviour.affect(entity, otherEntity);
    }
    else {
      return actorBehaviour.affect(entity, otherEntity);
    }
  }).flat();
}