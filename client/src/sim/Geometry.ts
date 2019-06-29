export type Radians = number;

export type Point = {
    x: number; // from left to right
    y: number; // from top to bottom
}

export function getRadians(angle: number): Radians {
  return (angle * Math.PI)/ 180;
}

export type Size = { width: number; height: number; }

export function intersects (rect1: { size: Size, location: Point }, rect2: { size: Size, location: Point }) {
    return !(
      rect1.location.x > (rect2.location.x + rect2.size.width)
      ||
      (rect1.location.x + rect1.size.width) < rect2.location.x
      ||
      rect1.location.y > (rect2.location.y + rect2.size.height)
      ||
      (rect1.location.y + rect1.size.height) < rect2.location.y
    );
  }
  
export function rotatePoint(point: Point, center: Point, rotation: Radians): Point {
  const sin = Math.sin(rotation);
  const cos = Math.cos(rotation);
  const diffX = point.x - center.x;
  const diffY = point.y - center.y;
  const result = { 
    x: cos * diffX - sin * diffY + center.x, 
    y: sin * diffX + cos * diffY + center.y
  };

  return result;
}