import { ID, Process, Player, Entity, WorldState, GenNewID, ProcessPayload } from "./world";
import { Radians } from "./geometry";

export type Diff =
| {
    type: "DeleteEntity" | "DeletePlayer" | "DeleteProcess";
    id: ID;
}
| {
    type: "UpsertEntity";
    entity: Entity;
}
| {
    type: "UpsertPlayer";
    player: Player
}
| {
    type: "UpsertProcess";
    process: Process;
}

type ActorMovePayload = {
    direction: Radians;
}

type ActorMoveCommand = ({
    type: "ActorMoveCommand";
    actor_id: ID;
} & ({ isOn: true; payload: ActorMovePayload } | { isOn: false }))

type ActorShootCommand = {
    type: "ActorShootCommand";
    actor_id: ID;
    isOn: boolean;
}

export type ActorCommand = ActorMoveCommand | ActorShootCommand;

type CreationCommand = 
| {
    type: "AddEntity",
    entity: Entity
}
| {
    type: "AddPlayer",
    player: Player
}

export type SimCommand = 
| {
    type: "Actor",
    command: ActorCommand
}
| {
    type: "Creation",
    command: CreationCommand
}

let NEW_ID: ID = 0;

// TODO: increment world_state instead, remove from global
export function gen_new_id (): ID {
    NEW_ID = NEW_ID + 1;
    return NEW_ID
}

export function update_world (world_state: WorldState, sim_commands: SimCommand[]): Diff[] {
    //const prevProcesses = Object.values(world_state.processes);
    // const diffs1 = prevProcesses.reduce((diffs, item) => {
    //     const upd = performProcess(world_state, item);
    //     return { world: upd.world, diffs: [...simUpdate.diffs, ...upd.diffs] };
    // }, [] as Diff[])

    const processDiffs = sim_commands.map(c => produce_diff_from_command(world_state, c, gen_new_id)) as Diff[];
    processDiffs.forEach(diff => apply_diff_to_world(world_state, diff));

    // // TODO in Rust
    // const addEntityDiffs = sim_commands.filter(c => c.type === "AddEntity").map(c => ({ type: "Upsert", targetType: "Entity", target: (c as AddEntity).entity } as Diff));
    // addEntityDiffs.forEach(diff => apply_diff_to_world(world_state, diff));

    // // TODO in Rust
    // const addPlayerDiffs = sim_commands.filter(c => c.type === "AddPlayer").map(c => ({ type: "Upsert", targetType: "Player", target: (c as AddPlayer).player } as Diff));
    // addPlayerDiffs.forEach(diff => apply_diff_to_world(world_state, diff));

    //const allDiffs = [...simUpdate1.diffs, ...activityDiffs, ...addEntityDiffs, ...addPlayerDiffs];
    //return allDiffs;
    return [...processDiffs];
}
  
function produce_diff_from_command(
    world_state: WorldState,
    sim_command: SimCommand,
    gen_new_id: GenNewID
): Diff | undefined {
    console.log("sc", sim_command)
    switch (sim_command.type) {
        case "Creation": {
            let { command } = sim_command;
            switch (command.type) {
                case "AddEntity": return { type: "UpsertEntity", entity: command.entity };
                case "AddPlayer": return { type: "UpsertPlayer", player: command.player };
            }
            throw new Error('Invalid command');
        }
        case "Actor": {
            let { command } = sim_command;
            let { actor_id } = command;
            switch(command.type) {
                case "ActorMoveCommand": {
                    if (command.isOn) {
                        let payload = command.payload;
                        let maybe_found_process: Process | undefined = Object.values(world_state.processes)
                            .find(p => p.payload.type === "EntityMove" && p.entity_id === actor_id);
                        let new_payload: ProcessPayload = {
                            type: "EntityMove",
                            direction: payload.direction,
                            velocity: 2.0,
                        };
                        let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
                        return { type: "UpsertProcess", process }
                    }
                    else {
                        return Object.values(world_state.processes)
                            .filter(p => p.payload.type === "EntityMove" && p.entity_id === actor_id)
                            .map(p => ({ type: "DeleteProcess", id: p.id } as Diff))[0]
                    }
                }
                case "ActorShootCommand": {
                    if (command.isOn) {
                        let maybe_found_process: Process | undefined = Object.values(world_state.processes)
                            .find(p => p.payload.type === "EntityShoot" && p.entity_id === actor_id);
                        let new_payload: ProcessPayload = { type: "EntityShoot", cooldown: 5, current_cooldown: 0 };
                        let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
                        return { type: "UpsertProcess", process }
                    }
                    else {
                        return Object.values(world_state.processes)
                            .filter(p => p.payload.type === "EntityShoot" && p.entity_id === actor_id)
                            .map(p => ({ type: "DeleteProcess", id: p.id } as Diff))[0]
                    } 
                }
            }

        }
    }
}

function create_or_derive_process_payload (maybe_process: Process | undefined, actor_id: ID, payload: ProcessPayload, gen_new_id: GenNewID): Process {
    if (maybe_process !== undefined) {
        return {
            ...maybe_process,
            payload,
        };
    }
    else {
        return {
            payload,
            id: gen_new_id(),
            entity_id: actor_id,
        };
    }
}

function apply_diff_to_world (world: WorldState, diff: Diff): void {
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