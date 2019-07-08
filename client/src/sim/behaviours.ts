import { Entity, ID, Process, GenNewID, EntityType } from "./world";
import { Diff } from "./sim";
import { Velocity, move_point } from "./physics";
import { Radians, Point, rotate_point } from "./geometry";

// TODO: change word 'update' to something more appropriate?
export function copy_update_entity_by_process_payload(entity: Entity, process: Process, gen_new_id: GenNewID): Diff[] {
    switch (process.payload.type) {
        case "EntityMove": return [move_entity(entity, process.payload.velocity, process.payload.direction)];
        case "EntityShoot": {
            if (process.payload.current_cooldown == 0) {
                let shot_diffs = shoot_from(entity, gen_new_id(), gen_new_id());
                let updated_process: Process = {
                    ...process,
                    payload: { ...process.payload, current_cooldown: process.payload.cooldown },
                };

                let updated_process_diff: Diff = { type: "UpsertProcess", process: updated_process };

                return [
                    updated_process_diff,
                    ...shot_diffs
                ];
            }
            else {
                let updated_process: Process = {
                    ...process,
                    payload: { ...process.payload, current_cooldown: process.payload.current_cooldown - 1 },
                };

                let updated_process_diff: Diff = { type: "UpsertProcess", process: updated_process };

                return [
                    updated_process_diff
                ]
            }
            
        }
    }
}

function move_entity (entity: Entity, velocity: Velocity, direction: Radians): Diff {
    const updated_entity: Entity = {
        ...entity,
        boundaries: { 
            size: entity.boundaries.size,
            top_left: move_point(entity.boundaries.top_left, velocity, direction)
        },
    };

    return { type: "UpsertEntity", entity: updated_entity }
}

function shoot_from (owner: Entity, new_projectile_id: ID, new_activity_id: ID): [Diff, Diff] {
    let owner_size = owner.boundaries.size;
    let shooting_point: Point = { x: owner_size.width + 20.0, y: owner_size.height - 2.0 };
    let center: Point = { x: owner_size.width / 2.0, y: owner_size.height / 2.0 };
    let rotated_shooting_point = rotate_point(shooting_point, center, owner.rotation);

    let projectile: Entity = { 
        id: new_projectile_id, 
        boundaries: {  // TODO: generate shooting point
            size: { width: 4, height: 2 },
            top_left: rotated_shooting_point
        },
        health: {
            current: 1,
            max: 1
        },
        entity_type: EntityType.Projectile,
        player_id: owner.player_id,
        rotation: owner.rotation, 
    };

    let projectile_activity: Process = { 
        id: new_activity_id,
        entity_id: projectile.id,
        payload: { type: "EntityShoot", cooldown: 5, current_cooldown: 0 },
    };

    return [
        { type: "UpsertEntity", entity: projectile }, 
        { type: "UpsertProcess", process: projectile_activity }
    ];
}