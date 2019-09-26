mod utils;

mod world;
mod geometry;
mod physics;
mod sim;
mod behaviours;
mod interop;
mod affects;

use crate::utils::set_panic_hook;
use crate::interop::JS_Diff;
use crate::interop::JS_SimCommand;
use crate::interop::{ SimInterop };
use wasm_bindgen::prelude::*;

#[macro_use]
extern crate serde_derive;

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
pub fn create_sim(width: i32, height: i32) -> SimInterop {
    SimInterop::new(&width, &height)
}

#[wasm_bindgen]
pub fn update_sim(sim_interop: &mut SimInterop, js_sim_commands: &JsValue) -> JsValue {
    let sim_commands: Vec<JS_SimCommand> = js_sim_commands.into_serde().unwrap();
    JsValue::from_serde(&sim_interop.update_world(&sim_commands)).unwrap()
}

#[wasm_bindgen]
pub fn set_panic() {
    set_panic_hook()
}