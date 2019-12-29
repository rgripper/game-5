import {
  Entity,
  Player,
  BehaviourType,
  ModelType
} from "../../../../page-server/src/sim/world";
import { mapEventsToCommands } from "./mapEventsToCommands";
import { SimCommand, gen_new_id } from "../../../../page-server/src/sim/sim";
import { from } from "rxjs";
import { Radians } from "../../../../page-server/src/sim/geometry";

export function getRadians(angle: number): Radians {
  return (angle * Math.PI) / 180;
}

export default function() {
  const humanPlayerId = 1;
  const monsterPlayerId = 2;

  const humanActor: Entity = {
    boundaries: { size: { width: 28, height: 28 }, top_left: { x: 25, y: 25 } },
    player_id: humanPlayerId,
    health: { max: 100, current: 100 },
    model_type: ModelType.Human,
    behaviour_type: BehaviourType.Actor,
    rotation: getRadians(270),
    id: 1000 + gen_new_id()
  };

  const monsters: Entity[] = [
    {
      boundaries: {
        size: { width: 20, height: 20 },
        top_left: { x: 125, y: 125 }
      },
      player_id: monsterPlayerId,
      health: { max: 10, current: 10 },
      model_type: ModelType.Monster,
      behaviour_type: BehaviourType.Actor,
      rotation: getRadians(270),
      id: 1000 + gen_new_id()
    },
    {
      boundaries: {
        size: { width: 20, height: 20 },
        top_left: { x: 145, y: 145 }
      },
      player_id: monsterPlayerId,
      health: { max: 10, current: 10 },
      model_type: ModelType.Monster,
      behaviour_type: BehaviourType.Actor,
      rotation: getRadians(270),
      id: 1000 + gen_new_id()
    },
    {
      boundaries: {
        size: { width: 20, height: 20 },
        top_left: { x: 76, y: 125 }
      },
      player_id: monsterPlayerId,
      health: { max: 10, current: 10 },
      model_type: ModelType.Monster,
      behaviour_type: BehaviourType.Actor,
      rotation: getRadians(270),
      id: 1000 + gen_new_id()
    }
  ];

  const actors = [humanActor, ...monsters];

  const players: Player[] = [{ id: humanPlayerId }, { id: monsterPlayerId }];

  const movementKeys = {
    forward: "w",
    back: "s",
    left: "a",
    right: "d"
  };

  return {
    controlCommands$: mapEventsToCommands({
      target: document,
      movementKeys,
      entityId: humanActor.id
    }),
    initCommands$: from([
      ...actors.map((entity): SimCommand => ({ type: "AddEntity", entity })),
      ...players.map((player): SimCommand => ({ type: "AddPlayer", player }))
    ])
  };
}
