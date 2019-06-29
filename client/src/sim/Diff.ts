import { Activity, Entity } from "./worldProcessor";
import { Identifiable, ID } from "./Identity";

export type DiffType = "Upsert" | "Delete"

export type Diff = EntityDiff | ActivityDiff

type DiffBase<T> = 
| {
  target: T;
  type: "Upsert";
}
| {
  targetId: ID;
  type: "Delete";
}

export type EntityDiff = {
  targetType: 'Entity';
} & DiffBase<Entity>

export type ActivityDiff = {
  targetType: 'Activity';
} & DiffBase<Activity>
