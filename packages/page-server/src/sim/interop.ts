import { SimCommand, Diff, update_world } from "./sim";
import { WorldState, ID, Player, Entity, Process } from "./world";
import { WorldParams } from "./sim";

export class JavaScriptSimInterop {
    private world_state: WorldState;

    private constructor({ size }: WorldParams) {
        this.world_state = {
            boundaries: { top_left: { x: 0, y: 0 }, size },
            players: new Map<ID, Player>(),
            processes: new Map<ID, Process>(), 
            entities: new Map<ID, Entity>(), 
        }
    }

    static create(world_params: WorldParams) {
        return new JavaScriptSimInterop(world_params);
    }

    update(sim_commands: SimCommand[]): Diff[] {
        return update_world(this.world_state, sim_commands);
    }
}