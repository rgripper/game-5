use crate::geometry::intersects;
use crate::sim::Diff;
use crate::world::{ Entity, EntityType, WorldState, Health };

pub fn affect_by_entity(world_state: &WorldState, entity: &Entity) -> Vec<Diff> {
    match entity.entity_type {
        EntityType::Human => affect_by_actor(world_state, entity),
        EntityType::Monster => affect_by_actor(world_state, entity),
        EntityType::Projectile => affect_by_projectile(world_state, entity),
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
        return vec![Diff::DeleteEntity(projectile.id)]
    }

    let affected_non_projectiles = world_state.entities.values().filter(|other| {
        other.entity_type != EntityType::Projectile
            && intersects(&other.boundaries, &projectile.boundaries)
    });
    
    affected_non_projectiles
        .map(|other| affect_non_projectile_by_projectile(projectile, &other))
        .flatten()
        .collect()
}

fn affect_non_projectile_by_projectile(projectile: &Entity, other_entity: &Entity) -> Vec<Diff> {
    vec![
        Diff::DeleteEntity(projectile.id),
        apply_damage(other_entity)
    ]
}

fn apply_damage(entity: &Entity) -> Diff {
    let next_health = entity.health.current - 2;
    if next_health <= 0 {
        Diff::DeleteEntity(entity.id)
    }
    else {
        Diff::UpsertEntity(Entity { 
            health: Health { current: next_health, ..entity.health }, 
            ..*entity 
        })
    }
}