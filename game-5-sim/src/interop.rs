use crate::sim::{ update_world, ActorCommand, ActorMovePayload, Diff, SimCommand };
use crate::geometry::Size;
use crate::geometry::Point;
use crate::geometry::Rect;
use crate::world::WorldState;
use crate::geometry::Radians;
use crate::world::ID;
use hashbrown::HashMap;

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
    pub actor_move: Option<ActorMove>,
    pub actor_move_stop: Option<ActorId>,
    pub actor_shoot: Option<ActorId>,
    pub actor_shoot_stop: Option<ActorId>,
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct JS_Diff {
    pub delete_entity_id: Option<ID>,
    pub upsert_entity: Option<ID>, // TODO: doesnt work, just to compile

    pub delete_player_id: Option<ID>,
    pub upsert_player: Option<ID>, // TODO: doesnt work, just to compile
}

#[wasm_bindgen]
#[derive(Copy, Clone)]
pub struct JS_WorldParams {
    pub width: i32,
    pub height: i32,
}

#[wasm_bindgen]
pub struct SimInterop {
    world_state: WorldState,
}

impl SimInterop {
    pub fn new(params: &JS_WorldParams) -> SimInterop {
        SimInterop {
            world_state: WorldState {
                new_id: 1,
                boundaries: Rect {
                    top_left: Point { x: 0.0, y: 0.0 },
                    size: Size {
                        width: params.width,
                        height: params.height,
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
            .map(|c| match &c.actor_move {
                Some(actor_move) => ActorCommand::Move(actor_move.actor_id, Some(ActorMovePayload { direction: actor_move.direction })),
                None => match &c.actor_move_stop {
                    Some(actor_move_stop) => ActorCommand::Move(actor_move_stop.actor_id, None),
                    None => match &c.actor_shoot {
                        Some(actor_shoot) => ActorCommand::Shoot(actor_shoot.actor_id, None),
                        None => match &c.actor_shoot_stop {
                            Some(actor_shoot_stop) => ActorCommand::Shoot(actor_shoot_stop.actor_id, None),
                            None => panic!("Missing command data")  
                        }
                    }
                }
            })
            .map(SimCommand::Actor)
            .collect();

        let diffs: Vec<Diff> = update_world(&mut self.world_state, &sim_commands);
        diffs
            .iter()
            .flat_map(|diff| match diff {
                Diff::DeleteEntity(id) => Some(JS_Diff { delete_entity_id: Some(*id), upsert_entity: None, delete_player_id: None, upsert_player: None }),
                Diff::UpsertEntity(entity) => Some(JS_Diff { delete_entity_id: None, upsert_entity: Some(entity.id), delete_player_id: None, upsert_player: None }),
                Diff::DeletePlayer(id) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_player_id: Some(*id), upsert_player: None }),
                Diff::UpsertPlayer(player) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_player_id: None, upsert_player: Some(player.id) }),
                _ => None,
            })
            .collect()
    }
}