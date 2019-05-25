use crate::world::GenNewID;
use crate::physics::move_point;
use crate::geometry::{Point, Size, Rect};
use crate::world::{ Health, Entity, EntityType, Process, ProcessPayload };
use crate::diff::{Diff};



pub trait Behaviour {
    fn reduce(&self, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff>;
    fn affect(&self, other: &Entity) -> Vec<Diff>;
}

impl Behaviour for Entity {
    fn reduce(&self, process: &Process, gen_new_id: &GenNewID) -> Vec<Diff> {
        match process.payload {
            ProcessPayload::EntityMove { velocity, direction } => {
                let updatedEntity = Entity {
                    id: self.id,
                    boundaries: Rect { 
                        size: self.boundaries.size,
                        top_left: move_point(&self.boundaries.top_left, &velocity, &direction)
                    },
                    ..*self // TODO: do a real fix
                };

                vec![Diff::UpsertEntity(updatedEntity)]
            },
            ProcessPayload::EntityShoot { .. } => shootFrom(self, gen_new_id),
            _ => panic!("Unexpected process")
        }
    }
    
    fn affect(&self, other: &Entity) -> Vec<Diff> {
        vec![] // nothing for now
    }
}

fn shootFrom (owner: &Entity, gen_new_id: &GenNewID) -> Vec<Diff> {
    let projectile = Entity { 
        id: gen_new_id(), 
        boundaries: Rect {  // TODO: generate shooting point
            size: Size { width: 4, height: 2 },
            top_left: Point { 
                x: owner.boundaries.top_left.x + owner.boundaries.size.width, 
                y: owner.boundaries.top_left.y - owner.boundaries.size.height - 15 
            }
        },
        health: Health {
            current: 1,
            max: 1
        },
        entity_type: EntityType::Projectile,
        player_id: owner.player_id,
        rotation: owner.rotation, 
    };

    let projectile_activity = Process { 
        id: gen_new_id(),
        entity_id: projectile.id,
        payload: ProcessPayload::EntityShoot,
    };

    return vec![
        Diff::UpsertEntity(projectile), 
        Diff::UpsertProcess(projectile_activity)
    ];
}