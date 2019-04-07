import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSandImage from './assets/PatternSand.jpg';
import projectileImage from './assets/Projectile.png';
import {reduceWorldOnTick, TickOutcome, ClientCommand } from './sim/process';
import { bufferTime, scan, buffer, tap, map } from 'rxjs/operators';
import { convertEventsToCommands } from './clientCommands/sourcing';
import { renderDiffs, renderWorld as renderInitialWorld } from './sim/rendering';
import { Observable, Subscriber, interval } from 'rxjs';
import { Diff } from './sim/Diff';

function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);

      const playerId = 1;

      const initialOutcome: TickOutcome = {
        diffs: [],
        world: {
          players: {
            [playerId]: { id: playerId }
          },
          activities: {}, 
          entities: {
            "1": { location: { x: 25, y: 25 }, id: 1, type: "Actor" }
          }, 
        }
      } 

      renderInitialWorld(initialOutcome.world, app);

      const commands$ = convertEventsToCommands(document, playerId);

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
