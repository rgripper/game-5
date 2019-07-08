import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { SimUpdate, SimCommand, Actor, WorldState, CreationCommand } from './sim/sim';
import { buffer, tap, map } from 'rxjs/operators';
import { mapEventsToCommands } from './clientCommands/mapEventsToCommands';
import { renderDiffs, renderWorld as renderInitialWorld } from './rendering/rendering';
import { Observable, Subscriber, fromEvent, from, concat } from 'rxjs';
import { Diff } from './sim/Diff';
import { Point, Radians } from './sim/geometry';
import { getNewId } from './sim/Identity';
import { applyDiffToWorld } from './clientSim/world';
import DebugView from './DebugView';
import { createPipeline } from './SimClient';

export function getRadians(angle: number): Radians {
  return (angle * Math.PI)/ 180;
}

function createCommands() {
  const humanPlayerId = 1;
  const monsterPlayerId = 2;

  const humanActor: Actor = { location: { x: 25, y: 25 }, playerId: humanPlayerId, maxHealth: 100, currentHealth: 100, unitType: "Human", size: { width: 28, height: 28 }, rotation: getRadians(270), id: 1000 + getNewId(), type: "Actor" };

  const monsters: Actor[] = [
    { location: { x: 125, y: 125 }, playerId: monsterPlayerId, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 1000 + getNewId(), type: "Actor" },
    { location: { x: 145, y: 145 }, playerId: monsterPlayerId, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 1000 + getNewId(), type: "Actor" },
    { location: { x: 76, y: 125 }, playerId: monsterPlayerId, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 1000 + getNewId(), type: "Actor" }
  ]

  const actors = [humanActor, ...monsters];

  const players = [{ id: humanPlayerId }, { id: monsterPlayerId }];

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
      ...actors.map(entity => ({ type: "AddEntity", entity } as SimCommand)),
      ...players.map(player => ({ type: "AddPlayer", player } as SimCommand))
    ])
  }
}

function App () {
    const initialWorld = {
      size: { width: 300, height: 300 },
      players: {},
      activities: {}, 
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
      const app = new PIXI.Application({backgroundColor : 0xFFAAFF, ...initialWorld.size});
      gameView.appendChild(app.view);

      const initialOutcome: SimUpdate = {
        diffs: [],
        world: initialWorld
      } 

      renderInitialWorld(initialOutcome.world, app);

      const commandSet = createCommands();

      const commands$ = concat(commandSet.initCommands$, commandSet.controlCommands$);

      const frames$: Observable<void> = Observable.create((subscriber: Subscriber<void>) => {
        app.ticker.add(() => subscriber.next())
      });

      const batchDiffBatchesPerFrame = buffer<Diff[]>(frames$);
      const collectDiffs = map((diffs: Diff[][]) => diffs.flat());
      const processDiffs = tap<Diff[]>(diffs => renderDiffs(diffs, app));
      
      const clientWorld: WorldState = {
        activities: { ...initialWorld.activities },
        entities: { ...initialWorld.entities },
        players: { ...initialWorld.players },
        size: { ...initialWorld.size }
      };
    
      const pipelineClient = createPipeline({ worldParams: { size: initialWorld.size } });
      
      const subscription = pipelineClient.output$.pipe(
        batchDiffBatchesPerFrame,
        collectDiffs,
        processDiffs,
        tap<Diff[]>(diffs => {
          diffs.forEach(diff => applyDiffToWorld(clientWorld, diff));
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
