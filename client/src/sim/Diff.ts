import { Activity, Entity, Player } from "./sim";
import { ID } from "./Identity";

export type DiffType = "Upsert" | "Delete";

export type Diff = EntityDiff | ActivityDiff | PlayerDiff;

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

export type PlayerDiff = {
  targetType: 'Player';
} & DiffBase<Player>

