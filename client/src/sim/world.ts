import { Radians, Rect } from "./geometry";
import { Velocity } from "./physics";

export type ID = number;

export type GenNewID = () => ID;

export type Health = {
    max: number;
    current: number;
}

export enum BehaviourType {
    Actor = "Actor",
    Projectile = "Projectile",
}

export enum ModelType {
    Human = "Human",
    Monster = "Monster",
    Projectile = "Projectile",
}


export type Entity = {
    id: ID;
    health: Health;
    boundaries: Rect;
    rotation: Radians;
    model_type: ModelType;
    behaviour_type: BehaviourType,
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
    boundaries: Rect;
    players: Map<ID, Player>;
    entities: Map<ID, Entity>;
    processes: Map<ID, Process>;
}

