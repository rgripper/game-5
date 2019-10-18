import { Point, Radians } from "./geometry";

export type Velocity = number;

export function move_point(location: Point, velocity: Velocity, rotation: Radians): Point {
  return {
    x: location.x + velocity * Math.cos(rotation),
    y: location.y + velocity * Math.sin(rotation)
  }
}