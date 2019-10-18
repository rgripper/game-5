#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Point {
    pub x: f32, // from left to right
    pub y: f32, // from top to bottom
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Size { 
    pub width: i32, 
    pub height: i32, 
}

#[derive(Debug, Copy, Clone, Serialize, Deserialize)]
pub struct Rect {
    pub top_left: Point,
    pub size: Size,
}

pub type Radians = f32;

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
  let diff_x = left_top.x - center.x;
  let diff_y = left_top.y - center.y;
  let result = Point { 
    x: cos * diff_x - sin * diff_y + center.x, 
    y: sin * diff_x + cos * diff_y + center.y
  };

  return result;
}
  