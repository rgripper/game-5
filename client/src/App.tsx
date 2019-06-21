import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';
import { reduceWorldOnTick, SimUpdate, ClientCommand, Actor, World } from './sim/worldProcessor';
import { bufferTime, scan, buffer, tap, map } from 'rxjs/operators';
import { mapEventsToCommands } from './clientCommands/mapEventsToCommands';
import { renderDiffs, renderWorld as renderInitialWorld } from './rendering/rendering';
import { Observable, Subscriber, fromEvent } from 'rxjs';
import { Diff } from './sim/Diff';
import { getRadians, Point, intersects } from './sim/Geometry';
import { getNewId } from './sim/Identity';
import { applyDiffToWorld } from './clientSim/world';
import DebugView from './DebugView';

function App () {

    const humanPlayer = 1;
    const monsterPlayer = 2;

    const humanActor: Actor = { location: { x: 25, y: 25 }, playerId: humanPlayer, maxHealth: 100, currentHealth: 100, unitType: "Human", size: { width: 28, height: 28 }, rotation: getRadians(270), id: getNewId(), type: "Actor" };

    const monsters: Actor[] = [
      { location: { x: 125, y: 125 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: getNewId(), type: "Actor" },
      { location: { x: 145, y: 145 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: getNewId(), type: "Actor" },
      { location: { x: 76, y: 125 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: getNewId(), type: "Actor" }
    ]

    const actors = monsters.reduce((acc, current) => ({ ...acc, [current.id.toString()]: current }), {
      [humanActor.id.toString()]: humanActor
    })

    const initialWorld = {
      size: { width: 300, height: 300 },
      players: {
        [humanPlayer]: { id: humanPlayer },
        [monsterPlayer]: { id: monsterPlayer }
      },
      activities: {}, 
      entities: actors, 
    };

    

    const [debuggedWorld, setDebuggedWorld] = useState<World>(initialWorld);
    const [debuggedPosition, setDebuggedPosition] = useState<Point | undefined>(undefined);

    useEffect(() => {
      // import("../../game-5-sim/pkg").then(({ create_sim }) => {
      //   const sim = create_sim();
      //   sim.free();
      // });
      
      const gameView = document.getElementById('gameView')!;
      const app = new PIXI.Application({backgroundColor : 0xD500F9, width: 300, height: 300});
      gameView.appendChild(app.view);

      const initialOutcome: SimUpdate = {
        diffs: [],
        world: initialWorld
      } 

      renderInitialWorld(initialOutcome.world, app);

      const movementKeys = {
        forward: 'w',
        back: 's',
        left: 'a',
        right: 'd'
      }

      const commands$ = mapEventsToCommands(document, movementKeys, humanActor.playerId, humanActor.id);

      const frames$: Observable<void> = Observable.create((subscriber: Subscriber<void>) => {
        app.ticker.add(() => subscriber.next())
      });

      const batchCommandsPerTick = bufferTime<ClientCommand>(10);
      // todo: something about it needs changing
      const runTickPerCommandBatch = scan(reduceWorldOnTick, initialOutcome);
      const batchTicksPerFrame = buffer<SimUpdate>(frames$);
      const collectDiffsFromTicks = map<SimUpdate[], Diff[]>(outcomes => outcomes.map(x => x.diffs).flat());
      const processDiffs = tap<Diff[]>(diffs => renderDiffs(diffs, app));
      
      const clientWorld: World = {
        activities: { ...initialWorld.activities },
        entities: { ...initialWorld.entities },
        players: { ...initialWorld.players },
        size: { ...initialWorld.size }
      };
    
      const subscription = commands$.pipe(
        batchCommandsPerTick,
        runTickPerCommandBatch,
        batchTicksPerFrame,
        collectDiffsFromTicks,
        tap<Diff[]>(diffs => {
          diffs.forEach(diff => applyDiffToWorld(clientWorld, diff));
          setDebuggedWorld({ ...clientWorld });
        }),
        processDiffs
      ).subscribe();
      
      const clickSubscription = fromEvent<MouseEvent>(app.view, 'click').subscribe(e => {
        setDebuggedPosition({ x: e.offsetX, y: e.offsetY });
      })

      return () => {
        subscription.unsubscribe();
        clickSubscription.unsubscribe();
        // TODO: clean up the app
      }
    }, [1]);

    return (
      <div className="App" id="app">
        <div id="gameView"></div>
        <DebugView world={debuggedWorld} position={debuggedPosition}  />
      </div>
    );
}

export default App;
