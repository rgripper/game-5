export type Location = {
  x: number; // from left to right
  y: number; // from top to bottom
}

export function getRadians(angle: number): number {
  return (angle * Math.PI)/ 180;
}

export function move(location: Location, velocity: number, rotation: number): Location {
  return {
    x: location.x + velocity * Math.cos(rotation),
    y: location.y + velocity * Math.sin(rotation)
  }
}