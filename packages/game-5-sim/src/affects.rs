use crate::geometry::intersects;
use crate::sim::Diff;
use crate::world::{ Entity, BehaviourType, WorldState, Health };

pub fn affect_by_entity(world_state: &WorldState, entity: &Entity) -> Vec<Diff> {
    match entity.behaviour_type {
        BehaviourType::Actor => affect_by_actor(world_state, entity),
        BehaviourType::Projectile => affect_by_projectile(world_state, entity),
    }
}

fn affect_by_actor(world_state: &WorldState, actor: &Entity) -> Vec<Diff> {
    // let affected_entities = world_state
    //     .entities
    //     .values()
    //     .filter(|other| intersects(&other.boundaries, &actor.boundaries));
    vec![]
}

fn affect_by_projectile(world_state: &WorldState, projectile: &Entity) -> Vec<Diff> {
    if !intersects(&projectile.boundaries, &world_state.boundaries) {
        return vec![Diff::DeleteEntity { id: projectile.id }]
    }

    let affected_non_projectiles = world_state.entities.values().filter(|other| {
        other.behaviour_type != BehaviourType::Projectile
            && intersects(&other.boundaries, &projectile.boundaries)
    });
    
    affected_non_projectiles
        .map(|other| affect_non_projectile_by_projectile(projectile, &other))
        .flatten()
        .collect()
}

fn affect_non_projectile_by_projectile(projectile: &Entity, other_entity: &Entity) -> Vec<Diff> {
    vec![
        Diff::DeleteEntity { id: projectile.id },
        apply_damage(other_entity)
    ]
}

fn apply_damage(entity: &Entity) -> Diff {
    let next_health = entity.health.current - 2;
    if next_health <= 0 {
        Diff::DeleteEntity { id: entity.id }
    }
    else {
        Diff::UpsertEntity { 
            entity: Entity { 
                health: Health { current: next_health, ..entity.health }, 
                ..*entity
            }
        }
    }
}