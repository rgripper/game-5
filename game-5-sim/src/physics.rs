use crate::geometry::{Point, Radians};

pub type Velocity = f32;

pub fn move_point (leftTop: Point, velocity: Velocity, rotation: Radians) -> Point {
  return Point {
    x: leftTop.x + ((velocity * rotation.cos()) as i32),
    y: leftTop.y + ((velocity * rotation.sin()) as i32)
  }
}