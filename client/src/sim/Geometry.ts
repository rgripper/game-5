
export type Point = {
    x: number; // from left to right
    y: number; // from top to bottom
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
  