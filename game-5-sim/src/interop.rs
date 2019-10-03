use crate::sim::{ update_world, ActorMovePayload, Diff, SimCommand };
use crate::geometry::Size;
use crate::geometry::Point;
use crate::geometry::Rect;
use crate::world::WorldState;
use crate::geometry::Radians;
use crate::world::ID;
use hashbrown::HashMap;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, Deserialize)]
pub struct JS_ActorMovePayload { 
    pub direction: Radians,
}


#[wasm_bindgen]
#[derive(Debug, Copy, Clone, Deserialize)]
pub struct JS_ActorMove {
    pub actor_id: ID, 
    pub payload: JS_ActorMovePayload,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Deserialize)]
pub struct JS_ActorId {
    pub actor_id: ID
}

#[wasm_bindgen]
#[derive(Copy, Clone, Deserialize)]
pub struct JS_SimCommand {
    pub ActorMoveStart: Option<JS_ActorMove>,
    pub ActorMoveStop: Option<JS_ActorId>,
    pub ActorShootStart: Option<JS_ActorId>,
    pub ActorShootStop: Option<JS_ActorId>,
}

#[wasm_bindgen]
#[derive(Copy, Clone, Serialize)]
pub struct JS_Diff {
    pub delete_entity_id: Option<ID>,
    pub upsert_entity: Option<ID>, // TODO: doesnt work, just to compile

    pub delete_process_id: Option<ID>,
    pub upsert_process: Option<ID>, // TODO: doesnt work, just to compile

    pub delete_player_id: Option<ID>,
    pub upsert_player: Option<ID>, // TODO: doesnt work, just to compile
}

#[wasm_bindgen]
pub struct SimInterop {
    world_state: WorldState,
}

impl SimInterop {
    pub fn new(width: &i32, height: &i32) -> SimInterop {
        SimInterop {
            world_state: WorldState {
                new_id: 1,
                boundaries: Rect {
                    top_left: Point { x: 0.0, y: 0.0 },
                    size: Size {
                        width: *width,
                        height: *height,
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
            .map(|c| 
                match &c.ActorMoveStart {
                Some(actor_move_start) => SimCommand::ActorMoveStart(actor_move_start.actor_id, ActorMovePayload { direction: actor_move_start.payload.direction }),
                    None => 
                match &c.ActorMoveStop {
                Some(actor_move_stop) => SimCommand::ActorMoveStop(actor_move_stop.actor_id),
                    None => 
                match &c.ActorShootStart {
                Some(actor_shoot_start) => SimCommand::ActorShootStart(actor_shoot_start.actor_id),
                    None => 
                match &c.ActorShootStop {
                Some(actor_shoot_stop) => SimCommand::ActorShootStop(actor_shoot_stop.actor_id),
                    None => panic!("Failed to map JS command to rust")  
                }}}
            })
            .collect();

        let diffs: Vec<Diff> = update_world(&mut self.world_state, &sim_commands);
        diffs
            .iter()
            .flat_map(|diff| match diff {
                Diff::DeleteEntity(id) => Some(JS_Diff { delete_entity_id: Some(*id), upsert_entity: None, delete_process_id: None, upsert_process: None, delete_player_id: None, upsert_player: None }),
                Diff::UpsertEntity(entity) => Some(JS_Diff { delete_entity_id: None, upsert_entity: Some(entity.id), delete_process_id: None, upsert_process: None, delete_player_id: None, upsert_player: None }),
                Diff::DeleteProcess(id) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_process_id: Some(*id), upsert_process: None, delete_player_id: None, upsert_player: None }),
                Diff::UpsertProcess(process) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_process_id: None, upsert_process: Some(process.id), delete_player_id: None, upsert_player: None }),
                Diff::DeletePlayer(id) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_process_id: None, upsert_process: None, delete_player_id: Some(*id), upsert_player: None }),
                Diff::UpsertPlayer(player) => Some(JS_Diff { delete_entity_id: None, upsert_entity: None, delete_process_id: None, upsert_process: None, delete_player_id: None, upsert_player: Some(player.id) }),
            })
            .collect()
    }
}