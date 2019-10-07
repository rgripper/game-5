use crate::sim::{ update_world, Diff, SimCommand };
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
        sim_commands: &Vec<SimCommand>
    ) -> Vec<Diff> {
        update_world(&mut self.world_state, &sim_commands)
    }
}