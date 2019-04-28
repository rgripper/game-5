import { Diff } from "./Diff";
import { actorBehaviour } from "./behaviours/actorBehaviour";
import { projectileBehaviour } from "./behaviours/projectileBehaviour";
import { Location } from './Physics';

export type Size = { width: number; height: number; }

export type Actor = {
  id: number;
  type: "Actor"
  location: Location;
  size: Size
}

export type Projectile = {
  id: number;
  type: "Projectile"
  location: Location;
}

export type Entity = Actor | Projectile

type DamageApplication = {
  type: "DamageApplication";
  target: Actor;
}


type ActorCreation = {
  type: "ActorCreation";
  target: Actor;
}

type ActorDestruction = {
  type: "ActorDestruction";
  target: Actor;
}

type ProjectileCreation = {
  type: "ProjectileCreation";
  target: Projectile;
}

type ProjectileMovement = {
  type: "ProjectileMovement";
  target: Projectile;
}

type ProjectileDestruction = {
  type: "ProjectileDestruction";
  target: Projectile;
}

type WorldCreation = {
  type: "WorldCreation";
  target: World;
}

type WorldCompletion = {
  type: "WorldCompletion";
  target: World;
}

type WorldDestruction = {
  type: "WorldDestruction";
  target: World;
}

type CharacterActivity = ({
  type: "Horizontal" | "Vertical";
  isNegative: boolean;
} | {
  type: "Shoot";
})
& {
  playerId: number;
  actorId: Actor["id"];
}

type ProjectileActivity = {
  type: "Projectile";
  angle: number;
  velocity: number;
}
& {
  projectileId: Projectile["id"];
}

export type Activity = { id: number } & (CharacterActivity | ProjectileActivity)

export type CharacterCommand = {
  type: "CharacterCommand";
  activity: CharacterActivity & { isOn: boolean; };
}

  //| ActorCreation | ActorMovement | ActorDestruction
  // | DamageApplication
  // | ProjectileCreation | ProjectileMovement | ProjectileDestruction
  // | WorldCreation | WorldCompletion | WorldDestruction

//type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
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
  
  return Object.values(activities).reduce(({ world, diffs }, activity) => {
    const nextDiffs = performActivity(world, activity);
    return {
      world: nextDiffs.reduce(applyDiff, world),
      diffs: [...diffs, ...nextDiffs]
    }
  }, seed);
}

let id = 100; // TODO: everything should acquire id from here

function getNewActivityId () {
  return id++;
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { activity: { isOn, ...otherProps } }: ClientCommand): ObjectMap<Activity> {
  let currentActivity = Object.values(activities).find(x => x.type === otherProps.type && x.actorId === otherProps.actorId);
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
function applyDiff (world: World, diff: Diff): World {
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
        delete world.entities[diff.target.id];
      }
      else {
        delete world.activities[diff.target.id];
      }
      break;
    }
  }

  return world;
}

function performActivity (world: World, activity: Activity): Diff[] {
  try {
    if (activity.type === "Projectile") {
      const projectile = world.entities[activity.projectileId] as Projectile; // TODO: remove type casting
      return projectileBehaviour.reduce(projectile, activity);
    }
    else {
      const actor = world.entities[activity.actorId] as Actor; // TODO: remove type casting
      return actorBehaviour.reduce(actor, activity);
    }
  }
  finally{
    console.log(activity, world.entities)
  }
}