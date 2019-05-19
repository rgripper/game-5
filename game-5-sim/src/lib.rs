mod utils;

mod world;
mod geometry;
mod physics;

use std::collections::HashMap;
use geometry::{ Rect, Point, Size };
use world::WorldState;



use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {

    let world = WorldState { 
        new_id: 1, 
        rect: Rect { 
            top_left: Point { 
                x: 0, 
                y: 0 
            }, 
            size: Size { 
                width: 640, 
                height: 480 
            } 
        },
        players: HashMap::new(),
        actors: HashMap::new(),
        processes: HashMap::new(),
    };

    alert("Hello, game-5-sim!");
}
