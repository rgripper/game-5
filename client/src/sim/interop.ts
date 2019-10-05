import { WorldParams } from "../server/pipeline.worker";
import { SimCommand, Diff, update_world } from "./sim";
import { WorldState } from "./world";

export class SimInterop {
    private world_state: WorldState;

    constructor({ size }: WorldParams) {
        this.world_state = {
            boundaries: { top_left: { x: 0, y: 0 }, size },
            players: {},
            processes: {}, 
            entities: {}, 
        }
    }

    update_sim(sim_commands: SimCommand[]): Diff[] {
        return update_world(this.world_state, sim_commands);
    }
}