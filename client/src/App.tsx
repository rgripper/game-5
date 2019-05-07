import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import {reduceWorldOnTick, TickOutcome, ClientCommand } from './sim/process';
import { bufferTime, scan, buffer, tap, map } from 'rxjs/operators';
import { convertEventsToCommands } from './clientCommands/sourcing';
import { renderDiffs, renderWorld as renderInitialWorld } from './sim/rendering';
import { Observable, Subscriber } from 'rxjs';
import { Diff } from './sim/Diff';
import { getRadians } from './sim/Physics';

function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0xD500F9});
      document.getElementById('app')!.appendChild(app.view);

      const humanPlayer = 1;
      const monsterPlayer = 2;

      const initialOutcome: TickOutcome = {
        diffs: [],
        world: {
          size: { width: 500, height: 500 },
          players: {
            [humanPlayer]: { id: humanPlayer },
            [monsterPlayer]: { id: monsterPlayer }
          },
          activities: {}, 
          entities: {
            "1": { location: { x: 25, y: 25 }, playerId: humanPlayer, maxHealth: 100, currentHealth: 100, unitType: "Human", size: { width: 28, height: 28 }, rotation: getRadians(270), id: 1, type: "Actor" },
            "2": { location: { x: 125, y: 125 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 2, type: "Actor" },
            "3": { location: { x: 145, y: 145 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 3, type: "Actor" },
            "4": { location: { x: 76, y: 125 }, playerId: monsterPlayer, maxHealth: 10, currentHealth: 10, unitType: "Monster", size: { width: 20, height: 20 }, rotation: getRadians(270), id: 4, type: "Actor" }
          }, 
        }
      } 

      renderInitialWorld(initialOutcome.world, app);

      const commands$ = convertEventsToCommands(document, humanPlayer);

      const frames$: Observable<number> = Observable.create((subscriber: Subscriber<number>) => {
        app.ticker.add(x => subscriber.next(x))
      });

      const batchCommandsPerTick = bufferTime<ClientCommand>(10);
      const runTickPerCommandBatch = scan(reduceWorldOnTick, initialOutcome);
      const batchTicksPerFrame = buffer<TickOutcome>(frames$);
      const collectDiffsFromTicks = map<TickOutcome[], Diff[]>(outcomes => outcomes.map(x => x.diffs).flat());
      const processDiffs = tap<Diff[]>(diffs => renderDiffs(diffs, app));
      
      const subscription = commands$.pipe(
        batchCommandsPerTick,
        runTickPerCommandBatch,
        batchTicksPerFrame,
        collectDiffsFromTicks,
        processDiffs
      ).subscribe();
      
      return () => subscription.unsubscribe();
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
