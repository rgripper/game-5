import { Entity, Player, EntityType } from "../sim/world";
import { mapEventsToCommands } from "./mapEventsToCommands";
import { SimCommand, gen_new_id } from "../sim/sim";
import { from } from "rxjs";
import { Radians } from "../sim/geometry";

export function getRadians(angle: number): Radians {
    return (angle * Math.PI)/ 180;
}

export default function() {
    const humanPlayerId = 1;
    const monsterPlayerId = 2;
  
    const humanActor: Entity = { boundaries: { size: { width: 28, height: 28 }, top_left: { x: 25, y: 25 } }, player_id: humanPlayerId, health: { max: 100, current: 100 } , entity_type: EntityType.Human, rotation: getRadians(270), id: 1000 + gen_new_id() };
  
    const monsters: Entity[] = [
      { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 125, y: 125 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() },
      { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 145, y: 145 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() },
      { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 76, y: 125 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() }
    ]
  
    const actors = [humanActor, ...monsters];
  
    const players: Player[] = [{ id: humanPlayerId }, { id: monsterPlayerId }];
  
    const movementKeys = {
      forward: 'w',
      back: 's',
      left: 'a',
      right: 'd'
    }
  
    return {
      controlCommands$: mapEventsToCommands({ target: document, movementKeys, entityId: humanActor.id }),
      initCommands$: from([
        ...actors.map(entity => ({ type: "Creation", command: { type: "AddEntity", entity } } as SimCommand)),
        ...players.map(player => ({ type: "Creation", command: { type: "AddPlayer", player } } as SimCommand))
      ])
    }
  }