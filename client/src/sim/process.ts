type Actor = {
  id: number;
  location: Location;
}

type Projectile = {
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

type Activity = ({
  type: "Horizontal" | "Vertical";
  isNegative: boolean;
} | {
  type: "Shoot";
})
& {
  actorId: Actor["id"];
}
  //| ActorCreation | ActorMovement | ActorDestruction
  // | DamageApplication
  // | ProjectileCreation | ProjectileMovement | ProjectileDestruction
  // | WorldCreation | WorldCompletion | WorldDestruction

export type ClientCommand = Activity & { isOn: boolean; }

type Location = {
  x: number;
  y: number;
}

export type World = {
  activities: Activity[];

  actors: Actor[];

  projectiles: Projectile[];
}

export function reduceWorldOnTick (world: World, clientCommands: ClientCommand[]): World {
  const activities = clientCommands.reduce(reduceActivitiesByCommand, world.activities);
  
  return activities.reduce(reduceWorldByActivity, { ...world, activities });
}

function reduceActivitiesByCommand (activities: Activity[], { isOn, ...otherProps }: ClientCommand): Activity[] {
  const filteredActivities = activities.filter(x => x.type !== otherProps.type || x.actorId !== otherProps.actorId);
  if (isOn) {
    return [otherProps, ...filteredActivities];
  }
  else {
    return filteredActivities;
  }
}

function reduceWorldByActivity (world: World, activity: Activity): World {
  
  // TODO: make World immutable
    const actor = world.actors.find(x => x.id === activity.actorId)!; // TODO: remove !
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