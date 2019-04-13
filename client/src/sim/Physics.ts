export type Location = {
  x: number; // from left to right
  y: number; // from top to bottom
}

export function move(location: Location, velocity: number, angle: number): Location {
  return {
    x: location.x + velocity * Math.sin(angle),
    y: location.y + velocity * Math.cos(angle)
  }
}