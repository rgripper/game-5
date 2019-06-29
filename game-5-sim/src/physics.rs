use crate::geometry::{Point, Radians};

pub type Velocity = f32;

pub fn move_point (left_top: &Point, velocity: &Velocity, direction: &Radians) -> Point {
  return Point {
    x: left_top.x + velocity * direction.cos(),
    y: left_top.y + velocity * direction.sin()
  }
}