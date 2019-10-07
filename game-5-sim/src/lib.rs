mod utils;

mod world;
mod geometry;
mod physics;
mod sim;
mod behaviours;
mod interop;
mod affects;

use crate::utils::set_panic_hook;
use crate::interop::JS_SimCommand;
use crate::interop::{ SimInterop };
use wasm_bindgen::prelude::*;
use web_sys::console;

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
    let diffs = sim_interop.update_world(&sim_commands);
    
    if diffs.len() > 0 {
        console::log_2(&"Logging arbitrary values looks like".into(), &diffs.len().to_string().into());
    }
    
    JsValue::from_serde(&diffs).unwrap()
}

#[wasm_bindgen]
pub fn set_panic() {
    set_panic_hook()
}