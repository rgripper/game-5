use crate::world::ID;
use crate::physics::Velocity;
use crate::geometry::Radians;
use crate::world::GenNewID;
use crate::physics::{ move_point };
use crate::geometry::{Point, Size, Rect, rotate_point };
use crate::world::{ Health, Entity, EntityType, Process, ProcessPayload };
use crate::sim::{Diff};

// TODO: rename  'update'
pub fn copy_update_entity_by_process_payload(entity: &Entity, process_payload: &ProcessPayload, gen_new_id: &GenNewID) -> Vec<Diff> {
    match process_payload {
        ProcessPayload::EntityMove { velocity, direction } => move_entity(entity, velocity, direction),
        ProcessPayload::EntityShoot { .. } => shoot_from(entity, gen_new_id(), gen_new_id())
    }
}

fn move_entity (entity: &Entity, velocity: &Velocity, direction: &Radians) -> Vec<Diff> {
    let updated_entity = Entity {
        id: entity.id,
        boundaries: Rect { 
            size: entity.boundaries.size,
            top_left: move_point(&entity.boundaries.top_left, velocity, direction)
        },
        ..*entity // TODO: do a real fix
    };
    vec![Diff::UpsertEntity(updated_entity)]
}

fn shoot_from (owner: &Entity, new_projectile_id: ID, new_activity_id: ID) -> Vec<Diff> {
    let owner_size = owner.boundaries.size;
    // TODO: refactor, make it a custom shooting point related to weapon and entity sizes
    let shooting_point = Point { x: owner_size.width as f32 + 20.0, y: owner_size.height as f32 - 2.0 };

    // TODO: impl on top of Boundaries?
    let center = Point { x: owner_size.width as f32 / 2.0, y: owner_size.height as f32 / 2.0 };

    // TODO: impl on top of Entity?
    let rotated_shooting_point = rotate_point(&shooting_point, center, &owner.rotation);

    let projectile = Entity { 
        id: new_projectile_id, 
        boundaries: Rect {  // TODO: generate shooting point
            size: Size { width: 4, height: 2 },
            top_left: rotated_shooting_point
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
        id: new_activity_id,
        entity_id: projectile.id,
        payload: ProcessPayload::EntityShoot,
    };

    return vec![
        Diff::UpsertEntity(projectile), 
        Diff::UpsertProcess(projectile_activity)
    ];
}