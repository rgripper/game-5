use crate::behaviours::{update_entity_by_process_payload};
use crate::world::{ WorldState, ID, Entity, Process, ProcessPayload, EntityType, GenNewID };
use crate::geometry::{ Radians, intersects };
use crate::diff::{ Diff };

pub enum SimCommand {
    ActorMove {
        actor_id: ID,
        direction: Radians,
    },
    ActorStop {
        actor_id: ID,
    }
}

struct SimUpdate { 
  world_state: WorldState,
  diffs: Vec<Diff>,
}

// last_sim_update = { world }
fn reduce_world_on_tick (world_state: &WorldState, sim_commands: &Vec<SimCommand>, gen_new_id: &GenNewID) -> Vec<Diff> {
  let diffs1 = world_state.processes.values().map(|process| advance_process_apple(world_state, process, gen_new_id));
  let diffs2 = world_state.processes.values().map(|process| advance_process_banana(world_state, process, gen_new_id));

  let diffs3 = sim_commands.iter().map(|c| produce_diff_from_command(world_state, c, gen_new_id));
}

fn advance_process_apple (world_state: &WorldState, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff> {
  let entity = world_state.entities.get(&process.entity_id).unwrap();
  update_entity_by_process_payload(entity, &process.payload, gen_new_id)
}

fn advance_process_banana (world_state: &WorldState, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff> {
  let entity = world_state.entities.get(&process.entity_id).unwrap();
  affect_by_entity(world_state, entity)
}

// fn advance_process (world_state: &WorldState, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff> {

//   for diff in diffs {
//     apply_diff_to_world(world_state, &diff)
//   }

  

//   for diff in diffs2 {
//     apply_diff_to_world(world_state, &diff)
//   }

//   diffs.append(&mut diffs2);
//   diffs
// }

fn produce_diff_from_command (world_state: &WorldState, command: &SimCommand, gen_new_id: &GenNewID) -> Option<Diff> {
  match command {
    SimCommand::ActorMove { actor_id, direction } => {
        let maybe_found_process: Option<&Process> = world_state.processes.values().find(|p| p.entity_id == *actor_id);
        match maybe_found_process {
            None => {
                let new_process = Process { 
                  id: gen_new_id(), 
                  entity_id: *actor_id, 
                  payload: ProcessPayload::EntityMove { 
                    direction: *direction, 
                    velocity: 2.0 
                  } 
                };
                Some(Diff::UpsertProcess(new_process))
            },
            Some (process) => {
                let updated_process = Process { 
                  payload: ProcessPayload::EntityMove { 
                    direction: *direction,
                    velocity: 2.0
                  }, 
                  ..*process
                };
                Some(Diff::UpsertProcess(updated_process))
            }
        }
    },
    SimCommand::ActorStop { actor_id } => {
        world_state.processes.values().find(|p| p.entity_id == *actor_id).map(|p| Diff::DeleteProcess(p.id))
    }
  }
}

// TODO: maybe make immutable
fn apply_diff_to_world (mut world_state: WorldState, diff: &Diff) {
  match diff {
    Diff::UpsertEntity (entity) => {
      world_state.entities.insert(entity.id, *entity);
    },
    Diff::UpsertProcess (process) => {
      world_state.processes.insert(process.id, *process);
    },
    Diff::DeleteEntity (entity_id) => {
      world_state.entities.remove(entity_id);
      let process_ids: Vec<ID> = world_state.processes.values().filter(|p| p.entity_id == *entity_id).map(|p| p.id).collect();
      for id in process_ids { world_state.processes.remove(&id); }
    }
    Diff::DeleteProcess (id) => {
      world_state.processes.remove(id);
    } 
  }
}

// TODO: rewrite to return function?
fn affect_by_entity (world_state: &WorldState, entity: &Entity) -> Vec<Diff> {
  match entity.entity_type {
    EntityType::Human => affect_by_actor(world_state, entity),
    EntityType::Monster => affect_by_actor(world_state, entity),
    EntityType::Projectile => affect_by_projectile(world_state, entity),
  }
}

fn affect_by_actor (world_state: &WorldState, actor: &Entity) -> Vec<Diff> {
  let affected_entities = world_state.entities.values().filter(|other| intersects(&other.boundaries, &actor.boundaries));
  vec![]
  //return affected_entities.map(|other| affect_entity_by_actor(world_state, actor, &other)).flatten().collect();
}

fn affect_by_projectile (world_state: &WorldState, projectile: &Entity) -> Vec<Diff> {
  if !intersects(&projectile.boundaries, &world_state.rect) {
      return vec![Diff::DeleteEntity(projectile.id)]
  }

  let affected_non_projectiles = world_state.entities.values().filter(|other| other.entity_type != EntityType::Projectile && intersects(&other.boundaries, &projectile.boundaries));
  vec![]
  //return affected_non_projectiles.map(|other| affect_entity_by_projectile(world_state, projectile, &other)).flatten().collect();
}

// pub fn findAffectedActors (actors: impl Iterator<Item=Actor>, actor: &Actor) -> impl Iterator<Item = Actor> {
//     return actors.filter(|x| intersects(&x.boundaries, &actor.boundaries));
//     // return foo;
// }