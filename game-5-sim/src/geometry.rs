use std::f64::consts::PI;

#[derive(Debug, Copy, Clone)]
pub struct Point {
    pub x: f32, // from left to right
    pub y: f32, // from top to bottom
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
      rect1.top_left.x > (rect2.top_left.x + rect2.size.width as f32)
      ||
      (rect1.top_left.x + rect1.size.width as f32) < rect2.top_left.x
      ||
      rect1.top_left.y > (rect2.top_left.y + rect2.size.height as f32)
      ||
      (rect1.top_left.y + rect1.size.height as f32) < rect2.top_left.y
    );
  }

pub fn rotate_point(left_top: &Point, center: Point, direction: &Radians) -> Point {
  let sin = direction.sin();
  let cos = direction.cos();
  let diffX = left_top.x - center.x;
  let diffY = left_top.y - center.y;
  let result = Point { 
    x: cos * diffX - sin * diffY + center.x, 
    y: sin * diffX + cos * diffY + center.y
  };

  return result;
}
  