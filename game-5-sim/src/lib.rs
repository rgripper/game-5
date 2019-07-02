mod utils;

mod world;
mod geometry;
mod physics;
mod sim;
mod behaviours;
mod interop;

use crate::interop::{ SimInterop, JS_WorldParams };
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
pub fn create_sim(params: JS_WorldParams) -> SimInterop {
    SimInterop::new(&params)
}
