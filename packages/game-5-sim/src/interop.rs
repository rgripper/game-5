use crate::sim::{ update_world, SimCommand };
use crate::geometry::Size;
use crate::geometry::Point;
use crate::geometry::Rect;
use crate::world::WorldState;
use hashbrown::HashMap;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct SimInterop {
    world_state: WorldState,
}

#[derive(Deserialize)]
pub struct WorldParams {
    size: Size,
}

fn create_world (world_params: WorldParams) -> WorldState {
    WorldState {
        new_id: 1,
        boundaries: Rect {
            top_left: Point { x: 0.0, y: 0.0 },
            size: world_params.size,
        },
        players: HashMap::new(),
        entities: HashMap::new(),
        processes: HashMap::new(),
    }
}

#[wasm_bindgen]
impl SimInterop {
    pub fn create (js_world_params: &JsValue) -> SimInterop {
        let world_params: WorldParams = js_world_params.into_serde().unwrap();
        SimInterop {
            world_state: create_world(world_params)
        }
    }

    pub fn update (&mut self, js_sim_commands: &JsValue) -> JsValue {
        let sim_commands: Vec<SimCommand> = js_sim_commands.into_serde().unwrap();
        let diffs = update_world(&mut self.world_state, &sim_commands);
        JsValue::from_serde(&diffs).unwrap()
    }
}