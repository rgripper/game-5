mod utils;

mod world;
mod geometry;
mod physics;
mod sim;
mod behaviours;
mod affects;
mod interop;

use crate::utils::set_panic_hook;
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
pub fn set_panic() {
    set_panic_hook()
}