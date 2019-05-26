use std::collections::HashMap;
use crate::geometry::{Rect, Radians};
use crate::physics::{Velocity};

pub type ID = i32;

pub type GenNewID = fn () -> ID;

#[derive(Debug, Copy, Clone)]
pub struct Health {
    pub max: u32,
    pub current: u32,
}

#[derive(Debug, Copy, Clone)]
pub enum EntityType {
    Human, 
    Monster,
    Projectile,
}

#[derive(Debug, Copy, Clone)]
pub struct Entity {
    pub id: ID,
    pub health: Health,
    pub boundaries: Rect,
    pub rotation: Radians,
    pub entity_type: EntityType,
    pub player_id: ID,
}

pub struct Player {
    pub id: ID,
    pub name: String,
}

#[derive(Debug, Copy, Clone)]
pub struct Process {
    pub id: ID,
    pub entity_id: ID,
    pub payload: ProcessPayload,
}

#[derive(Debug, Copy, Clone)]
pub enum ProcessPayload {
    EntityMove {
        direction: Radians,
        velocity: Velocity,
    },
    EntityShoot,
}

pub struct WorldState {
  pub new_id: ID,
  pub rect: Rect,
  pub players: HashMap<ID, Player>,
  pub entities: HashMap<ID, Entity>,
  pub processes: HashMap<ID, Process>,
}

// fn generate_new_id (world_state: &WorldState) -> ID {
//     let new_id = world_state.new_id;
//     world_state.new_id = world_state.new_id + 1;
//     return new_id;
// }

