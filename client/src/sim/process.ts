type Actor = Entity & {
  id: number;
  location: Location;
}

type Projectile = Entity & {
  id: number;
  location: Location;
}

type ActorCreation = {
  type: "ActorCreation";
  target: Actor;
}

type ActorMovement = {
  type: "ActorMovement";
  target: Actor;
}

type DamageApplication = {
  type: "DamageApplication";
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

type Entity = { id: number }

type ActivityBase = ({
  type: "Horizontal" | "Vertical";
  isNegative: boolean;
} | {
  type: "Shoot";
})
& {
  actorId: Actor["id"];
}

type Activity = Entity & ActivityBase

  //| ActorCreation | ActorMovement | ActorDestruction
  // | DamageApplication
  // | ProjectileCreation | ProjectileMovement | ProjectileDestruction
  // | WorldCreation | WorldCompletion | WorldDestruction

export type ClientCommand = ActivityBase & { isOn: boolean; }

type Location = {
  x: number;
  y: number;
}

type ObjectMap<T extends { id: number }> = {[key: string]: T}

export type World = {
  activities: ObjectMap<Activity>;
  actors: ObjectMap<Actor>;
  projectiles: ObjectMap<Projectile>;
}

export function reduceWorldOnTick (world: World, clientCommands: ClientCommand[]): World {
  const activities = clientCommands.reduce(reduceActivitiesByCommand, world.activities);
  
  return Object.values(activities).reduce(reduceWorldByActivity, { ...world, activities });
}

let id = 100; // TODO: everything should acquire id from here

function getNewActivityId () {
  return id++;
}

function reduceActivitiesByCommand (activities: ObjectMap<Activity>, { isOn, ...otherProps }: ClientCommand): ObjectMap<Activity> {
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

function reduceWorldByActivity (world: World, activity: Activity): World {
  
  // TODO: make World immutable
    const actor = world.actors[activity.actorId];
    switch(activity.type) {
      case "Horizontal": {
        actor.location.x += 2 * (activity.isNegative ? 1 : -1);
        return world;
      }
      case "Vertical": {
        actor.location.y += 2 * (activity.isNegative ? 1 : -1);
        return world;
      }
      default: return world;
    }
    
}