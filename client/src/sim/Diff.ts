import { Activity, Entity } from "./worldProcessor";

export type DiffType = "Upsert" | "Delete"

export type Diff = EntityDiff | ActivityDiff

export type EntityDiff = {
  targetType: 'Entity';
} & ({
  target: Entity;
  type: "Upsert";
} | {
  targetId: Entity["id"];
  type: "Delete";
})

export type ActivityDiff = {
  targetType: 'Activity';
} & ({
  target: Activity;
  type: "Upsert";
} | {
  targetId: Activity["id"];
  type: "Delete";
})
