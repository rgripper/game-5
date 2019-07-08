export type Point = {
    x: number; // from left to right
    y: number; // from top to bottom
}

export type Size = { width: number; height: number; }

export type Rect = {
  top_left: Point,
  size: Size,
}

export type Radians = number;

export function intersects (rect1: Rect, rect2: Rect) {
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
  
export function rotate_point(left_top: Point, center: Point, rotation: Radians): Point {
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);
  const diffX = left_top.x - center.x;
  const diffY = left_top.y - center.y;
  const result = { 
    x: cos * diffX - sin * diffY + center.x, 
    y: sin * diffX + cos * diffY + center.y
  };

  return result;
}