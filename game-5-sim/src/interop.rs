use crate::sim::{ update_world, ActorCommand, ActorMovePayload, Diff };
use crate::geometry::Size;
use crate::geometry::Point;
use crate::geometry::Rect;
use crate::world::WorldState;
use crate::geometry::Radians;
use crate::world::ID;
use std::collections::HashMap;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct ActorMove {
    pub actor_id: ID, 
    pub direction: Radians,
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct ActorId {
    pub actor_id: ID
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct JS_SimCommand {
    pub ActorMove: Option<ActorMove>,
    pub ActorMoveStop: Option<ActorId>,
    pub ActorShoot: Option<ActorId>,
    pub ActorShootStop: Option<ActorId>,
}

#[wasm_bindgen]
pub struct SimInterop {
    world_state: WorldState,
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct JS_Diff {
    pub delete_entity_id: Option<ID>,
    pub upsert_entity: Option<ID>, // TODO: doesnt work, just to compile
}

impl SimInterop {
    pub fn new() -> SimInterop {
        SimInterop {
            world_state: WorldState {
                new_id: 1,
                rect: Rect {
                    top_left: Point { x: 0, y: 0 },
                    size: Size {
                        width: 640,
                        height: 480,
                    },
                },
                players: HashMap::new(),
                entities: HashMap::new(),
                processes: HashMap::new(),
            },
        }
    }

    pub fn update_world(
        &mut self,
        js_sim_commands: &Vec<JS_SimCommand>
    ) -> Vec<JS_Diff> {
        let sim_commands: Vec<_> = js_sim_commands
            .iter()
            .map(|c| match &c.ActorMove {
                Some(actor_move) => ActorCommand::Move(actor_move.actor_id, Some(ActorMovePayload { direction: actor_move.direction })),
                None => match &c.ActorMoveStop {
                    Some(actor_move_stop) => ActorCommand::Move(actor_move_stop.actor_id, None),
                    None => match &c.ActorShoot {
                        Some(actor_shoot) => ActorCommand::Shoot(actor_shoot.actor_id, None),
                        None => match &c.ActorShootStop {
                            Some(actor_shoot_stop) => ActorCommand::Shoot(actor_shoot_stop.actor_id, None),
                            None => panic!("Missing command data")  
                        }
                    }
                }
            })
            .collect();

        let diffs: Vec<Diff> = update_world(&mut self.world_state, &sim_commands);
        diffs
            .iter()
            .map(|diff| match diff {
                Diff::DeleteEntity(id) => Some(JS_Diff { delete_entity_id: Some(*id), upsert_entity: None }),
                Diff::UpsertEntity(entity) => Some(JS_Diff { delete_entity_id: None, upsert_entity: Some(entity.id) }),
                _ => None,
            })
            .flatten()
            .collect()
    }
}