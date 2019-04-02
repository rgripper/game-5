import { Diff } from "./Diff";

export type Actor = {
  id: number;
  type: "Actor"
  location: Location;
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

export type Activity = { id: number } & CharacterActivity

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

type Location = {
  x: number;
  y: number;
}

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
    const nextDiffs = produceDiffsByActivity(world, activity);
    return {
      world: applyDiffs(world, nextDiffs),
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

function applyDiffs (world: World, diffs: Diff[]): World {
  // MAYBE: make immutable?
  diffs.forEach(diff => {
    switch (diff.type) {
      case "Upsert": {
        if (diff.targetType == 'Entity') {
          world.entities[diff.target.id] = diff.target;
        }
        else {
          world.activities[diff.target.id] = diff.target;
        }
        return;
      }
      case "Delete": {
        if (diff.targetType == 'Entity') {
          delete world.entities[diff.target.id];
        }
        else {
          delete world.activities[diff.target.id];
        }
        return;
      }
    }
  });
  return world;
}

function produceDiffsByActivity (world: World, activity: Activity): Diff[] {
  try {


  const actor = world.entities[activity.actorId];
  switch(activity.type) {
    case "Horizontal": {
      const updatedActor = { ...actor, location: { ...actor.location, x: actor.location.x + 2 * (activity.isNegative ? 1 : -1) } };
      return [{ target: updatedActor, targetType: "Entity", type: "Upsert" }];
    }
    case "Vertical": {
      const updatedActor = { ...actor, location: { ...actor.location, y: actor.location.y + 2 * (activity.isNegative ? 1 : -1) } };
      return [{ target: updatedActor, targetType: "Entity", type: "Upsert" }];
    }
    default: return [];
  }
}
  finally{
    console.log(activity.actorId, world.entities)
  }
}