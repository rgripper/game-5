import { WorldState, Entity, EntityType } from "./world";
import { Diff } from "./sim";
import { intersects } from "./geometry";

export function affect_by_entity(world_state: WorldState, entity: Entity): Diff[] {
    switch (entity.entity_type) {
        case EntityType.Human: return affect_by_actor(world_state, entity);
        case EntityType.Monster: return affect_by_actor(world_state, entity);
        case EntityType.Projectile: return affect_by_projectile(world_state, entity);
    }
}

function affect_by_actor(world_state: WorldState, actor: Entity): Diff[] {
    // let affected_entities = world_state
    //     .entities
    //     .values()
    //     .filter(|other| intersects(&other.boundaries, &actor.boundaries));
    return [];
}

function affect_by_projectile(world_state: WorldState, projectile: Entity): Diff[] {
    if (!intersects(projectile.boundaries, world_state.boundaries)) {
        return [{ type: "DeleteEntity", id: projectile.id }]
    }

    let affected_non_projectiles = Object.values(world_state.entities).filter(other => {
        other.entity_type != EntityType.Projectile
            && intersects(other.boundaries, projectile.boundaries)
    });
    
    return affected_non_projectiles
        .map(other => affect_non_projectile_by_projectile(projectile, other))
        .flat();
}

function affect_non_projectile_by_projectile(projectile: &Entity, other_entity: &Entity): Diff[] {
    return [
        { type: "DeleteEntity", id: projectile.id },
        apply_damage(other_entity)
    ];
}

function apply_damage(entity: Entity): Diff {
    let next_health = entity.health.current - 2;
    if (next_health <= 0) {
        return { type: "DeleteEntity", id: entity.id };
    }
    else {
        return { 
            type: "UpsertEntity", 
            entity: {
                ...entity,
                health: { ...entity.health, current: next_health }
            }
        }
    }
}