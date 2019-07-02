import { WorldParams } from "../server/pipeline";
import { WorldState, SimCommand, updateWorld } from "./sim";
import { Diff } from "./Diff";

export class SimInterop {
    private worldState: WorldState;

    constructor({ size }: WorldParams) {
        this.worldState = {
            size,
            players: {},
            activities: {}, 
            entities: {}, 
        }
    }

    updateWorld(simCommands: SimCommand[]): Diff[] {
        return updateWorld(this.worldState, simCommands);
    }
}