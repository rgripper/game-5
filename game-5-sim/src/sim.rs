use std::collections::HashMap;
use crate::world::GenNewID;
use crate::world::{ WorldState, ID, Entity, Process, ProcessPayload };
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
      ()
    },
    Diff::UpsertProcess (process) => {
      world_state.processes.insert(process.id, *process);
      ()
    },
    Diff::DeleteEntity (id) => {
      world_state.entities.remove(id);
      ()
      // TODO: Object.values(world.activities).filter(x => x.entityId === diff.targetId).forEach(x => delete world.activities[x.id]);
    }
    Diff::DeleteProcess (id) => {
      world_state.processes.remove(id);
      ()
    } 
  }

  return world_state;
}

fn affect_by_actor (world_state: &WorldState, actor: &Entity) -> Vec<Diff> {

  let affected_actors = world_state.entities.values().filter(|other| intersects(&other.boundaries, &actor.boundaries));
  //TODO
  return vec![];
  // TODO: let affectedProjectiles = world_state.projectiles.values().filter(|x| intersects(&x.boundaries, &actor.boundaries));

  //return affectedActors.map(|&affectedActor| actorBehaviour.affect(actor, affectedActor))
}

fn affect_by_projectile (world_state: &WorldState, projectile: &Entity) -> Vec<Diff> {
  if !intersects(&projectile.boundaries, &world_state.rect) {
      return vec![Diff::DeleteEntity(projectile.id)]
  }

  let affected_actors = world_state.entities.values().filter(|other| intersects(&other.boundaries, &projectile.boundaries));

  return vec![];
}

// fn affect (world: &World, entity: Entity): Diff[] {
//   if (entity.type === "Projectile") {
//     if (!intersects(entity, { size: world.size, location: { x: 0, y: 0 } })) {
//       return [{ type: "Delete", targetType: "Entity", targetId: entity.id }]
//     }
//   }

//   return findAffectedEntities(world, entity).map(otherEntity => {
//     if (entity.type === "Projectile") {
//       if (otherEntity.type === "Projectile") return [];// TODO: its a hack
//       return projectileBehaviour.affect(entity, otherEntity);
//     }
//     else {
//       return actorBehaviour.affect(entity, otherEntity);
//     }
//   }).flat();
// }

// pub fn findAffectedActors (actors: impl Iterator<Item=Actor>, actor: &Actor) -> impl Iterator<Item = Actor> {
//     return actors.filter(|x| intersects(&x.boundaries, &actor.boundaries));
//     // return foo;
// }