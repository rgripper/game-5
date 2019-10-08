import { WorldParams } from "../server/pipeline.worker";
import { SimCommand, Diff, update_world } from "./sim";
import { WorldState, ID, Player, Entity, Process } from "./world";

export class SimInterop {
    private world_state: WorldState;

    constructor({ size }: WorldParams) {
        this.world_state = {
            boundaries: { top_left: { x: 0, y: 0 }, size },
            players: new Map<ID, Player>(),
            processes: new Map<ID, Process>(), 
            entities: new Map<ID, Entity>(), 
        }
    }

    update_sim(sim_commands: SimCommand[]): Diff[] {
        return update_world(this.world_state, sim_commands);
    }
}