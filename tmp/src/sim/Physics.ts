import { Point } from "./Geometry";

export function getRadians(angle: number): number {
  return (angle * Math.PI)/ 180;
}

export function move(location: Point, velocity: number, rotation: number): Point {
  return {
    x: location.x + velocity * Math.cos(rotation),
    y: location.y + velocity * Math.sin(rotation)
  }
}