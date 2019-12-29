import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Point, intersects } from "../../../page-server/src/sim/geometry";
import {
  Entity,
  WorldState,
  BehaviourType,
  Player,
  Process,
  ID
} from "../../../page-server/src/sim/world";
import { fromEvent } from "rxjs";
import { tap } from "rxjs/operators";
import { Diff } from "../../../page-server/src/sim/sim";
import { apply_diff_to_world } from "./client-sim/world";

export default function({
  worldState,
  children
}: PropsWithChildren<{ worldState: WorldState }>) {
  const childContainerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Point | undefined>(undefined);

  useEffect(() => {
    if (childContainerRef.current) {
      const clickSubscription = fromEvent<MouseEvent>(
        childContainerRef.current,
        "click"
      ).subscribe(e => {
        setPosition({ x: e.offsetX, y: e.offsetY });
      });
      return () => clickSubscription.unsubscribe();
    }
  });

  return (
    <div>
      <div ref={childContainerRef}>{children}</div>
      <InfoAtPosition worldState={worldState} position={position} />
      <WorldStateView worldState={worldState} />

      <ul style={{ listStyleType: "none" }}>
        {Array.from(worldState.entities.values())
          .filter(x => x.behaviour_type === BehaviourType.Actor)
          .map(x => (
            <li key={x.id}>{JSON.stringify(x)}</li>
          ))}
      </ul>
    </div>
  );
}

export function createDebuggingPipe(
  initialWorld: WorldState,
  onChange: (world: WorldState) => void
) {
  const clientWorld: WorldState = {
    players: new Map<ID, Player>(),
    processes: new Map<ID, Process>(),
    entities: new Map<ID, Entity>(),
    boundaries: { ...initialWorld.boundaries }
  };
  return tap<Diff[]>(diffs => {
    // update world state for debugging
    diffs.forEach(diff => apply_diff_to_world(clientWorld, diff));
    onChange(clientWorld);
  });
}

function EntityView({ entity }: { entity: Entity }) {
  return <span>{JSON.stringify(entity)}</span>;
}

function PointView({ point }: { point: Point }) {
  return (
    <span>
      [{point.x}, {point.y}]
    </span>
  );
}

function WorldStateView({ worldState }: { worldState: WorldState }) {
  return (
    <table>
      <tbody>
        <tr>
          <td>Number of entities:</td>
          <td>{worldState.entities.size}</td>
        </tr>
        <tr>
          <td>Number of processes:</td>
          <td>{worldState.processes.size}</td>
        </tr>
        <tr>
          <td>Number of players:</td>
          <td>{worldState.players.size}</td>
        </tr>
      </tbody>
    </table>
  );
}

function InfoAtPosition({
  worldState,
  position
}: {
  worldState: WorldState;
  position?: Point;
}) {
  const entity =
    position &&
    Array.from(worldState.entities.values()).find(e =>
      intersects(e.boundaries, {
        size: { width: 1, height: 2 },
        top_left: position
      })
    );
  const processes =
    entity &&
    Array.from(worldState.processes.values()).filter(
      process => process.entity_id === entity.id
    );

  if (!entity || !processes || !position) {
    return (
      <span>{position && <PointView point={position} />} No selection</span>
    );
  }

  return (
    <div>
      <div>
        <PointView point={position} />
      </div>
      <div>
        <EntityView entity={entity} />
      </div>
      <ul style={{ listStyleType: "none" }}>
        {processes.map(p => (
          <li key={p.id}>{JSON.stringify(p)}</li>
        ))}
      </ul>
      <hr />
    </div>
  );
}
