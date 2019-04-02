import { Activity, Entity } from "./process";

export type DiffType = "Upsert" | "Delete"

export type Diff = EntityDiff | ActivityDiff

export type EntityDiff = {
  targetType: 'Entity';
  target: Entity;
  type: DiffType;
}

export type ActivityDiff = {
  targetType: 'Activity';
  target: Activity;
  type: DiffType;
}