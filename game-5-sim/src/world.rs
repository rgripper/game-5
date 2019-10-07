use hashbrown::HashMap;
use crate::geometry::{Rect, Radians};
use crate::physics::{Velocity};

pub type ID = i32;

pub type GenNewID = Fn() -> ID;

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Health {
    pub max: u32,
    pub current: u32,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, PartialEq)]
pub enum BehaviourType {
    Actor,
    Projectile,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModelType {
    Human,
    Monster,
    Projectile,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Entity {
    pub id: ID,
    pub health: Health,
    pub boundaries: Rect,
    pub rotation: Radians,
    pub model_type: ModelType,
    pub behaviour_type: BehaviourType,
    pub player_id: ID,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Player {
    pub id: ID,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Process {
    pub id: ID,
    pub entity_id: ID,
    pub payload: ProcessPayload,
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ProcessPayload {
    EntityMove {
        direction: Radians,
        velocity: Velocity,
    },
    EntityShoot {
        cooldown: i32,
        current_cooldown: i32,
    },
}

impl ProcessPayload {
    pub fn is_entity_move (&self) -> bool {
        match self {
            ProcessPayload::EntityMove { .. } => true,
            _ => false,
        }
    }

    pub fn is_entity_shoot (&self) -> bool {
        match self {
            ProcessPayload::EntityShoot { .. } => true,
            _ => false,
        }
    }
}

pub struct WorldState {
    pub new_id: ID,
    pub boundaries: Rect,
    pub players: HashMap<ID, Player>,
    pub entities: HashMap<ID, Entity>,
    pub processes: HashMap<ID, Process>,
}
