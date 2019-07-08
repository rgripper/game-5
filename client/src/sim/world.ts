import { Radians, Rect } from "./geometry";
import { Velocity } from "./physics";

export type ID = number;

export type GenNewID = () => ID;

export type Health = {
    max: number;
    current: number;
}

export enum EntityType {
    Human, 
    Monster,
    Projectile,
}

export type Entity = {
    id: ID;
    health: Health;
    boundaries: Rect;
    rotation: Radians;
    entity_type: EntityType,
    player_id: ID,
}

export type Player = {
    id: ID;
}

export type Process = {
    id: ID,
    entity_id: ID,
    payload: ProcessPayload,
}

export type ProcessPayload =
    | {
        type: "EntityMove";
        direction: Radians;
        velocity: Velocity;
    }
    | {
        type: "EntityShoot";
        cooldown: number;
        current_cooldown: number;
    }

export type WorldState = {
    boundaries: Rect,
    players: { [id: number]: Player },
    entities: { [id: number]: Entity },
    processes: { [id: number]: Process },
}

