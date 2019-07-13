import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Point, intersects } from "./sim/geometry";
import { Entity, WorldState, BehaviourType } from "./sim/world";
import { fromEvent } from "rxjs";
import { tap } from "rxjs/operators";
import { Diff } from "./sim/sim";
import { apply_diff_to_world } from "./clientSim/world";

export default function({ worldState, children }: PropsWithChildren<{ worldState: WorldState }>) {
  const childContainerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<Point | undefined>(undefined);

  useEffect(() => {
    if (childContainerRef.current) {
      const clickSubscription = fromEvent<MouseEvent>(childContainerRef.current, "click").subscribe(e => {
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
        {Object.values(worldState.entities)
          .filter(x => x.behaviour_type === BehaviourType.Actor)
          .map(x => (
            <li key={x.id}>{JSON.stringify(x)}</li>
          ))}
      </ul>
    </div>
  );
}

export function createDebuggingPipe(initialWorld: WorldState, onChange: (world: WorldState) => void) {
  const clientWorld: WorldState = {
    processes: { ...initialWorld.processes },
    entities: { ...initialWorld.entities },
    players: { ...initialWorld.players },
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
          <td>{Object.values(worldState.entities).length}</td>
        </tr>
        <tr>
          <td>Number of processes:</td>
          <td>{Object.values(worldState.processes).length}</td>
        </tr>
        <tr>
          <td>Number of players:</td>
          <td>{Object.values(worldState.players).length}</td>
        </tr>
      </tbody>
    </table>
  );
}

function InfoAtPosition({ worldState, position }: { worldState: WorldState; position?: Point }) {
  const entity =
    position &&
    Object.values(worldState.entities).find(e =>
      intersects(e.boundaries, {
        size: { width: 1, height: 2 },
        top_left: position
      })
    );
  const processes = entity && Object.values(worldState.processes).filter(process => process.entity_id === entity.id);

  if (!entity || !processes || !position) {
    return <span>{position && <PointView point={position} />} No selection</span>;
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
