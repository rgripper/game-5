import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SimCommand, gen_new_id, Diff } from './sim/sim';
import { buffer, tap, map } from 'rxjs/operators';
import { mapEventsToCommands } from './clientCommands/mapEventsToCommands';
import { renderDiffs, renderWorld as renderInitialWorld } from './rendering/rendering';
import { Observable, Subscriber, fromEvent, from, concat } from 'rxjs';
import { Point, Radians } from './sim/geometry';
import DebugView from './DebugView';
import { createPipeline } from './SimClient';
import { Entity, EntityType, WorldState, Player } from './sim/world';
import { apply_diff_to_world } from './clientSim/world';

export function getRadians(angle: number): Radians {
  return (angle * Math.PI)/ 180;
}

function createCommands() {
  const humanPlayerId = 1;
  const monsterPlayerId = 2;

  const humanActor: Entity = { boundaries: { size: { width: 28, height: 28 }, top_left: { x: 25, y: 25 } }, player_id: humanPlayerId, health: { max: 100, current: 100 } , entity_type: EntityType.Human, rotation: getRadians(270), id: 1000 + gen_new_id() };

  const monsters: Entity[] = [
    { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 125, y: 125 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() },
    { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 145, y: 145 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() },
    { boundaries: { size: { width: 20, height: 20 }, top_left: { x: 76, y: 125 } }, player_id: monsterPlayerId, health: { max: 10, current: 10 }, entity_type: EntityType.Monster, rotation: getRadians(270), id: 1000 + gen_new_id() }
  ]

  const actors = [humanActor, ...monsters];

  const players: Player[] = [{ id: humanPlayerId }, { id: monsterPlayerId }];

  const movementKeys = {
    forward: 'w',
    back: 's',
    left: 'a',
    right: 'd'
  }

  console.log('humanActor.id', humanActor.id);

  return {
    controlCommands$: mapEventsToCommands({ target: document, movementKeys, entityId: humanActor.id }),
    initCommands$: from([
      ...actors.map(entity => ({ type: "Creation", command: { type: "AddEntity", entity } } as SimCommand)),
      ...players.map(player => ({ type: "Creation", command: { type: "AddPlayer", player } } as SimCommand))
    ])
  }
}

function App () {
    const initialWorld: WorldState = {
      boundaries: { top_left: { x: 0, y: 0 }, size: { width: 300, height: 300 } },
      players: {},
      processes: {}, 
      entities: {}, 
    };

    const [debuggedWorld, setDebuggedWorld] = useState<WorldState>(initialWorld);
    const [debuggedPosition, setDebuggedPosition] = useState<Point | undefined>(undefined);

    useEffect(() => {
      // import("../../game-5-sim/pkg").then(({ create_sim }) => {
      //   const sim = create_sim();
      //   sim.free();
      // });
      
      const gameView = document.getElementById('gameView')!;
      const app = new PIXI.Application({backgroundColor : 0xFFAAFF, ...initialWorld.boundaries.size});
      gameView.appendChild(app.view);

      renderInitialWorld(initialWorld, app);

      const commandSet = createCommands();

      const commands$ = concat(commandSet.initCommands$, commandSet.controlCommands$);

      const frames$: Observable<void> = Observable.create((subscriber: Subscriber<void>) => {
        app.ticker.add(() => subscriber.next())
      });

      const batchDiffBatchesPerFrame = buffer<Diff[]>(frames$);
      const collectDiffs = map((diffs: Diff[][]) => diffs.flat());
      const processDiffs = tap<Diff[]>(diffs => renderDiffs(diffs, app));
      
      const clientWorld: WorldState = {
        processes: { ...initialWorld.processes },
        entities: { ...initialWorld.entities },
        players: { ...initialWorld.players },
        boundaries: { ...initialWorld.boundaries }
      };
    
      const pipelineClient = createPipeline({ worldParams: { size: initialWorld.boundaries.size } });
      
      const subscription = pipelineClient.output$.pipe(
        batchDiffBatchesPerFrame,
        collectDiffs,
        processDiffs,
        tap<Diff[]>(diffs => {
          diffs.forEach(diff => apply_diff_to_world(clientWorld, diff));
          setDebuggedWorld({ ...clientWorld });
        })
      ).subscribe();
      
      pipelineClient.subscribeInput(commands$);

      const clickSubscription = fromEvent<MouseEvent>(app.view, 'click').subscribe(e => {
        setDebuggedPosition({ x: e.offsetX, y: e.offsetY });
      });

      return () => {
        subscription.unsubscribe();
        clickSubscription.unsubscribe();
        // TODO: clean up the app
      }
    }, [1]);

    return (
      <div className="App" id="app">
        <div id="gameView"></div>
        <DebugView worldState={debuggedWorld} position={debuggedPosition}  />
      </div>
    );
}

export default App;
