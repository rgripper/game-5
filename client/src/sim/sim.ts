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

type ActorMoveStartCommand = {
    type: "ActorMoveStart";
    actor_id: ID;
    payload: ActorMovePayload;
}

type ActorMoveStopCommand = {
    type: "ActorMoveStop";
    actor_id: ID;
}

type ActorShootStartCommand = {
    type: "ActorShootStart";
    actor_id: ID;
}

type ActorShootStopCommand = {
    type: "ActorShootStop";
    actor_id: ID;
}

type AddEntityCommand = {
    type: "AddEntity",
    entity: Entity
}

type AddPlayerCommand = {
    type: "AddPlayer",
    player: Player
}


export type ActorCommand = ActorMoveStartCommand | ActorMoveStopCommand | ActorShootStartCommand | ActorShootStopCommand;
export type CreationCommand = AddEntityCommand | AddPlayerCommand

export type SimCommand = ActorCommand | CreationCommand

let NEW_ID: ID = 0;

// TODO: increment world_state instead, remove from global
export function gen_new_id (): ID {
    NEW_ID = NEW_ID + 1;
    return NEW_ID
}

export function update_world (world_state: WorldState, sim_commands: SimCommand[]): Diff[] {
    const process_result_diffs = Object.values(world_state.processes).map(process => {
        const entity = world_state.entities.get(process.entity_id);
        if (entity === undefined) {
            throw new Error(`Could not find entity by id '${process.entity_id}'`);
        }
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
        case "AddEntity": return { type: "UpsertEntity", entity: sim_command.entity };
        case "AddPlayer": return { type: "UpsertPlayer", player: sim_command.player };
        case "ActorMoveStart": {
            let { payload, actor_id } = sim_command;
            let maybe_found_process: Process | undefined = Object.values(world_state.processes)
                .find(p => p.payload.type === "EntityMove" && p.entity_id === actor_id);
            let new_payload: ProcessPayload = {
                type: "EntityMove",
                direction: payload.direction,
                velocity: 2.0,
            };
            let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
            return { type: "UpsertProcess", process };
        }
        case "ActorMoveStop": {
            let { actor_id } = sim_command;
            return Object.values(world_state.processes)
                .filter(p => p.payload.type === "EntityMove" && p.entity_id === actor_id)
                .map(p => ({ type: "DeleteProcess", id: p.id } as Diff))[0];
        }
        case "ActorShootStart": {
            let { actor_id } = sim_command;
            let maybe_found_process: Process | undefined = Object.values(world_state.processes)
                .find(p => p.payload.type === "EntityShoot" && p.entity_id === actor_id);
            let new_payload: ProcessPayload = { type: "EntityShoot", cooldown: 5, current_cooldown: 0 };
            let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
            return { type: "UpsertProcess", process }
        }
        case "ActorShootStop": {
            let { actor_id } = sim_command;
            return Object.values(world_state.processes)
                .filter(p => p.payload.type === "EntityShoot" && p.entity_id === actor_id)
                .map(p => ({ type: "DeleteProcess", id: p.id } as Diff))[0]
        }
        default: throw new Error('Unknown sim_command type');
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
            Object.values(world.processes).filter(x => x.entity_id === diff.id).forEach(x => world.processes.delete(x.id));
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