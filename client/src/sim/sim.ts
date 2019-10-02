import { ID, Process, Player, Entity, WorldState, GenNewID, ProcessPayload } from "./world";
import { Radians } from "./geometry";
import { affect_by_entity } from "./affects";
import { copy_update_entity_by_process_payload } from "./behaviours";

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
} & ({ is_on: true; payload: ActorMovePayload } | { is_on: false }))

type ActorShootCommand = {
    type: "ActorShootCommand";
    actor_id: ID;
    is_on: boolean;
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

export const SimCommand = {
    Actor: (command: ActorCommand): SimCommand => ({ type: "Actor", command }),
    Creation: (command: CreationCommand): SimCommand => ({ type: "Creation", command }),
}

let NEW_ID: ID = 0;

// TODO: increment world_state instead, remove from global
export function gen_new_id (): ID {
    NEW_ID = NEW_ID + 1;
    return NEW_ID
}

export function update_world (world_state: WorldState, sim_commands: SimCommand[]): Diff[] {
    const process_result_diffs = Object.values(world_state.processes).map(process => {
        const entity = world_state.entities[process.entity_id];
        const entity_update_diffs = copy_update_entity_by_process_payload(entity, process, gen_new_id);
        entity_update_diffs.map(diff => apply_diff_to_world(world_state, diff));
        const entity_affect_diffs = affect_by_entity(world_state, entity);
        entity_affect_diffs.map(diff => apply_diff_to_world(world_state, diff));
        return [...entity_update_diffs, ...entity_affect_diffs];
    }).flat();

    const process_diffs: Diff[] = sim_commands.map(c => produce_diff_from_command(world_state, c, gen_new_id)).filter(d => d !== undefined) as Diff[];
    process_diffs.forEach(diff => apply_diff_to_world(world_state, diff));

    return [...process_result_diffs, ...process_diffs];
}
  
function produce_diff_from_command(
    world_state: WorldState,
    sim_command: SimCommand,
    gen_new_id: GenNewID
): Diff | undefined {
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
                    if (command.is_on) {
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
                    if (command.is_on) {
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

function create_or_derive_process_payload (maybe_process: Process | undefined, entity_id: ID, payload: ProcessPayload, gen_new_id: GenNewID): Process {
    if (maybe_process !== undefined) {
        return {
            ...maybe_process,
            payload,
        };
    }
    else {
        return {
            id: gen_new_id(),
            payload,
            entity_id,
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