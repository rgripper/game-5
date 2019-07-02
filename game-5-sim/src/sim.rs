use crate::behaviours::copy_update_entity_by_process_payload;
use crate::geometry::{intersects, Radians};
use crate::world::{Entity, EntityType, GenNewID, Process, ProcessPayload, Player, WorldState, ID};

#[derive(Debug, Copy, Clone)]
pub enum Diff {
    DeleteEntity(ID),
    UpsertEntity(Entity),

    DeletePlayer(ID),
    UpsertPlayer(Player),

    DeleteProcess(ID),
    UpsertProcess(Process),
}

pub struct ActorMovePayload {
    pub direction: Radians
}

pub enum ActorCommand {
    Move(ID, Option<ActorMovePayload>),
    Shoot(ID, Option<()>),
}

static mut NEW_ID: ID = 0;

// TODO: increment world_state instead
fn gen_new_id () -> ID {
    unsafe {
        NEW_ID = NEW_ID + 1;
        NEW_ID
    }
}

type SimCommand = ActorCommand;

pub fn update_world(
    world_state: &mut WorldState,
    sim_commands: &Vec<SimCommand>
) -> Vec<Diff> {
    let mut diffs = vec![];
    let pairs: Vec<_> = world_state
        .processes
        .values()
        .map(|process| (process.id, process.entity_id))
        .collect();

    for (process_id, entity_id) in pairs {
        //
        let process_diffs = world_state
            .entities
            .get(&entity_id)
            .map(|entity| {
                let process = world_state.processes.get(&process_id).unwrap();
                copy_update_entity_by_process_payload(entity, &process, &gen_new_id)
            })
            .unwrap_or_else(|| vec![]);

        for diff in process_diffs {
            apply_diff_to_world(world_state, &diff); // apply diffs output by application of process to its entity
            diffs.push(diff);
        }

        let entity_affect_diffs = world_state
            .entities
            .get(&entity_id)
            .map(|entity| affect_by_entity(world_state, entity))
            .unwrap_or_else(|| vec![]);

        for diff in entity_affect_diffs {
            apply_diff_to_world(world_state, &diff); // apply diffs output by application of entity to other entities in range
            diffs.push(diff);
        }
    }

    for c in sim_commands {
        let diffs_a = produce_diff_from_command(world_state, c, &gen_new_id);
        for diff in diffs_a {
            apply_diff_to_world(world_state, &diff);
            diffs.push(diff);
        }
    }

    diffs
}

fn produce_diff_from_command(
    world_state: &WorldState,
    command: &SimCommand,
    gen_new_id: &GenNewID,
) -> Option<Diff> {
    match command {
        ActorCommand::Move(actor_id, option) => match option {
            Some (payload) => {
                let maybe_found_process: Option<&Process> = world_state
                    .processes
                    .values()
                    .find(|p| p.payload.is_entity_move() && p.entity_id == *actor_id);
                let new_payload = ProcessPayload::EntityMove {
                    direction: payload.direction,
                    velocity: 2.0,
                };
                let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
                Some(Diff::UpsertProcess(process))
            },
            None => world_state
                .processes
                .values()
                .find(|p| p.payload.is_entity_move() && p.entity_id == *actor_id)
                .map(|p| Diff::DeleteProcess(p.id)),
        },
        ActorCommand::Shoot(actor_id, option) => match option {
            Some(_) => {
                let maybe_found_process: Option<&Process> = world_state
                    .processes
                    .values()
                    .find(|p| p.payload.is_entity_shoot() && p.entity_id == *actor_id);
                let new_payload = ProcessPayload::EntityShoot { cooldown: 5, current_cooldown: 0 };
                let process = create_or_derive_process_payload(maybe_found_process, actor_id, new_payload, gen_new_id);
                Some(Diff::UpsertProcess(process))
            },
            None => world_state
                .processes
                .values()
                .find(|p| p.payload.is_entity_shoot() && p.entity_id == *actor_id)
                .map(|p| Diff::DeleteProcess(p.id)),
        }
    }
}

fn create_or_derive_process_payload (maybe_process: Option<&Process>, actor_id: &ID, payload: ProcessPayload, gen_new_id: &GenNewID) -> Process {
    match maybe_process {
        Some(process) => Process {
            payload: payload,
            ..*process
        },
        None => Process {
            payload: payload,
            id: gen_new_id(),
            entity_id: *actor_id,
        }
    }
}

// TODO: maybe make immutable
fn apply_diff_to_world(world_state: &mut WorldState, diff: &Diff) {
    match diff {
        Diff::UpsertEntity(entity) => {
            world_state.entities.insert(entity.id, *entity);
        }
        Diff::UpsertProcess(process) => {
            world_state.processes.insert(process.id, *process);
        }
        Diff::UpsertPlayer(player) => {
            world_state.players.insert(player.id, *player);
        }
        Diff::DeleteEntity(entity_id) => {
            world_state.entities.remove(entity_id);
            let process_ids: Vec<ID> = world_state
                .processes
                .values()
                .filter(|p| p.entity_id == *entity_id)
                .map(|p| p.id)
                .collect();
            for id in process_ids {
                world_state.processes.remove(&id);
            }
        }
        Diff::DeleteProcess(id) => {
            world_state.processes.remove(id);
        }
        Diff::DeletePlayer(id) => {
            world_state.players.remove(id);
        }
    }
}

// TODO: rewrite to return function?
fn affect_by_entity(world_state: &WorldState, entity: &Entity) -> Vec<Diff> {
    match entity.entity_type {
        EntityType::Human => affect_by_actor(world_state, entity),
        EntityType::Monster => affect_by_actor(world_state, entity),
        EntityType::Projectile => affect_by_projectile(world_state, entity),
    }
}

fn affect_by_actor(world_state: &WorldState, actor: &Entity) -> Vec<Diff> {
    let affected_entities = world_state
        .entities
        .values()
        .filter(|other| intersects(&other.boundaries, &actor.boundaries));
    vec![]
    //return affected_entities.map(|other| affect_entity_by_actor(world_state, actor, &other)).flatten().collect();
}

fn affect_by_projectile(world_state: &WorldState, projectile: &Entity) -> Vec<Diff> {
    if !intersects(&projectile.boundaries, &world_state.rect) {
        return vec![Diff::DeleteEntity(projectile.id)];
    }

    let affected_non_projectiles = world_state.entities.values().filter(|other| {
        other.entity_type != EntityType::Projectile
            && intersects(&other.boundaries, &projectile.boundaries)
    });
    vec![]
    //return affected_non_projectiles.map(|other| affect_entity_by_projectile(world_state, projectile, &other)).flatten().collect();
}

// pub fn findAffectedActors (actors: impl Iterator<Item=Actor>, actor: &Actor) -> impl Iterator<Item = Actor> {
//     return actors.filter(|x| intersects(&x.boundaries, &actor.boundaries));
//     // return foo;
// }
