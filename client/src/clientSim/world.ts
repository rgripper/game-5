import { WorldState } from "../sim/world";
import { Diff } from "../sim/sim";

export function apply_diff_to_world (world: WorldState, diff: Diff): void {
  switch (diff.type) {
      case "UpsertEntity": {
          world.entities[diff.entity.id] = diff.entity;
          break;
      }
      case "UpsertPlayer": {
          world.players[diff.player.id] = diff.player;
          break;
      }
      case "UpsertProcess": {
          world.processes[diff.process.id] = diff.process;
          break;
      }
      case "DeleteEntity": {
          delete world.entities[diff.id];
          Object.values(world.processes).filter(x => x.entity_id === diff.id).forEach(x => delete world.processes[x.id]);
          break;
      }
      case "DeleteProcess": {
          delete world.processes[diff.id];
          break;
      }
      case "DeletePlayer": {
          delete world.players[diff.id];
          break;
      }
  }
}