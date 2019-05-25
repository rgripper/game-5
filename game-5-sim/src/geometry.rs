use std::f64::consts::PI;

#[derive(Debug, Copy, Clone)]
pub struct Point {
    pub x: i32, // from left to right
    pub y: i32, // from top to bottom
}

#[derive(Debug, Copy, Clone)]
pub struct Size { 
    pub width: i32, 
    pub height: i32, 
}

#[derive(Debug, Copy, Clone)]
pub struct Rect {
    pub top_left: Point,
    pub size: Size,
}

pub type Radians = f32;

pub fn get_radians(angle: f32) -> Radians {
    return (angle * (PI as f32))/ 180f32;
}

pub fn intersects (rect1: &Rect, rect2: &Rect) -> bool {
    return !(
      rect1.top_left.x > (rect2.top_left.x + rect2.size.width)
      ||
      (rect1.top_left.x + rect1.size.width) < rect2.top_left.x
      ||
      rect1.top_left.y > (rect2.top_left.y + rect2.size.height)
      ||
      (rect1.top_left.y + rect1.size.height) < rect2.top_left.y
    );
  }
  