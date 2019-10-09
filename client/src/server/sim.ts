import { Diff, SimCommand } from "../sim/sim";
import { JavaScriptSimInterop } from "../sim/interop";

export type WorldParams = {
    size: { width: number; height: number; };
}

export type CycleSim = (commands: SimCommand[]) => Diff[]

export async function createSimInRust(world_params: WorldParams): Promise<CycleSim> {
    const { SimInterop: RustSimInterop, set_panic } = await import("../../../game-5-sim/pkg/game_5_sim");
    set_panic();
    const simInterop = RustSimInterop.create(world_params);
    return commands => simInterop.update(commands)
}

export async function createSimInJavaScript(world_params: WorldParams): Promise<CycleSim> {
    const simInterop = JavaScriptSimInterop.create(world_params);
    return commands => simInterop.update(commands)
}


