import { WorldState } from "../../../page-server/src/sim/world";
import { Diff } from "../../../page-server/src/sim/sim";

export function apply_diff_to_world (world: WorldState, diff: Diff): void {
  switch (diff.type) {
      case "UpsertEntity": {
          world.entities.set(diff.entity.id, diff.entity);
          break;
      }
      case "UpsertPlayer": {
          world.players.set(diff.player.id, diff.player);
          break;
      }
      case "UpsertProcess": {
          world.processes.set(diff.process.id, diff.process);
          break;
      }
      case "DeleteEntity": {
          world.entities.delete(diff.id);
          Array.from(world.processes.values()).filter(x => x.entity_id === diff.id).forEach(x => world.processes.delete(x.id));
          break;
      }
      case "DeleteProcess": {
          world.processes.delete(diff.id);
          break;
      }
      case "DeletePlayer": {
          world.players.delete(diff.id);
          break;
      }
  }
}