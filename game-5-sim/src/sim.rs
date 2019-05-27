use std::collections::HashMap;
use crate::world::{ WorldState, ID, Entity, Process, ProcessPayload, EntityType, GenNewID };
use crate::geometry::{ Radians, intersects };
use crate::diff::{ Diff };
use crate::behaviours::Behaviour;

pub enum SimCommand {
    ActorMove {
        actor_id: ID,
        direction: Radians,
    },
    ActorStop {
        actor_id: ID,
    }
}

fn reduce_activities_by_command (mut processes: HashMap<ID, Process>, command: &SimCommand, gen_new_id: &GenNewID) -> HashMap<ID, Process> {
  match command {
    SimCommand::ActorMove { actor_id, direction } => {
        let maybe_found_process: Option<&Process> = processes.values().find(|p| p.entity_id == *actor_id);
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
                processes.insert(new_process.id, new_process);
                return processes;
            },
            Some (process) => {
                let updated_process = Process { 
                  payload: ProcessPayload::EntityMove { 
                    direction: *direction,
                    velocity: 2.0
                  }, 
                  ..*process
                };
                processes.insert(updated_process.id, updated_process);
                return processes;
            }
        }
    },
    SimCommand::ActorStop { actor_id } => {
        processes.values().find(|p| p.entity_id == *actor_id).map(|p| p.id).map(|id| processes.remove(&id));
        processes
    }
    
  }
}

fn advance_process (world_state: &WorldState, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff> {
  world_state.entities.get(&process.entity_id).unwrap().reduce(process, gen_new_id)
}

// TODO: maybe make immutable
fn apply_diff_to_world (mut world_state: WorldState, diff: &Diff) -> WorldState {
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

  return world_state;
}

fn affect_by_actor (world_state: &WorldState, actor: &Entity) -> Vec<Diff> {
  let affected_entities = world_state.entities.values().filter(|other| intersects(&other.boundaries, &actor.boundaries));
  return affected_entities.map(|other| actor.affect(&other)).flatten().collect();
}

fn affect_by_projectile (world_state: &WorldState, projectile: &Entity) -> Vec<Diff> {
  if !intersects(&projectile.boundaries, &world_state.rect) {
      return vec![Diff::DeleteEntity(projectile.id)]
  }

  let affected_non_projectiles = world_state.entities.values().filter(|other| other.entity_type != EntityType::Projectile && intersects(&other.boundaries, &projectile.boundaries));
  return affected_non_projectiles.map(|other| projectile.affect(&other)).flatten().collect();
}

// pub fn findAffectedActors (actors: impl Iterator<Item=Actor>, actor: &Actor) -> impl Iterator<Item = Actor> {
//     return actors.filter(|x| intersects(&x.boundaries, &actor.boundaries));
//     // return foo;
// }