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

type Activity = {
  actorId: Actor['id'];
  type: ClientCommand['type'];
}
  //| ActorCreation | ActorMovement | ActorDestruction
  // | DamageApplication
  // | ProjectileCreation | ProjectileMovement | ProjectileDestruction
  // | WorldCreation | WorldCompletion | WorldDestruction

export type ClientCommand = {
  type: "Left" | "Right" | "Up" | "Down" | "Shoot";
  isOn: boolean;
  actorId: Actor["id"];
}

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
  return activities.reduce(reduceWorldByActivity, world);
}

function reduceActivitiesByCommand (activities: Activity[], clientCommand: ClientCommand): Activity[] {
  if (clientCommand.isOn) {
    return [{ type: clientCommand.type, actorId: clientCommand.actorId }, ...activities]
  }
  else {
    return activities.filter(x => x.type === clientCommand.type && x.actorId === clientCommand.actorId);
  }
}

function reduceWorldByActivity (world: World, activity: Activity): World {
  // TODO: make World immutable
    const actor = world.actors.find(x => x.id === activity.actorId)!; // TODO: remove !
    switch(activity.type) {
      case "Up": {
        actor.location.y += 5;
        return world;
      }
      case "Down": {
        actor.location.y -= 5;
        return world;
      }
      case "Right": {
        actor.location.x += 5;
        return world;
      }
      case "Left": {
        actor.location.x -= 5;
        return world;
      }
    }
    return world;
}