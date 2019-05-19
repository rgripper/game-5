use std::collections::HashMap;
use crate::geometry::{Size, Rect, Radians};
use crate::physics::{Velocity};

pub type ID = i32;

pub struct Health {
    pub max: u32,
    pub current: u32,
}

pub enum UnitType {
    Human, 
    Monster
}

pub struct Actor {
    pub health: Health,
    pub boundaries: Rect,
    pub rotation: Radians,
    pub unit_type: UnitType,
    pub player_id: ID,
}

pub struct Player {
    pub id: u32,
    pub name: String,
}

pub struct Projectile {
    pub boundaries: Rect,
    pub rotation: Radians,
    pub size: Size,
}

pub enum WorldProcess {
    ActorMove {
        id: ID,
        actor_id: ID,
        direction: Radians,
        velocity: Velocity,
    },
    ActorShoot {
        id: ID,
        actor_id: ID,
    },
    ProjectileMove {
        id: ID,
        projectile_id: ID,
        direction: Radians,
        velocity: Velocity,
    }
}

pub struct WorldState {
  pub new_id: ID,
  pub rect: Rect,
  pub players: HashMap<ID, Player>,
  pub actors: HashMap<ID, Actor>,
  pub processes: HashMap<ID, WorldProcess>,
}
