import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSandImage from './assets/PatternSand.jpg';
import projectileImage from './assets/Projectile.png';
import {reduceWorldOnTick, TickOutcome } from './sim/process';
import { bufferTime, scan, buffer } from 'rxjs/operators';
import { convertEventsToCommands } from './clientCommands/sourcing';
import { renderDiffs, renderWorld as renderInitialWorld } from './sim/rendering';
import { Observable, Subscriber } from 'rxjs';

function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);
      const sandTexture = PIXI.extras.TilingSprite.from(patternSandImage, 800, 600);
      const projectile = PIXI.Sprite.from(projectileImage);
      const monster = PIXI.Sprite.from(mosterImage);
      monster.scale.x = monster.scale.x / 6;
      monster.scale.y = monster.scale.y / 6;

      const player = PIXI.Sprite.from(playerImage);
      player.scale.x = player.scale.x / 6;
      player.scale.y = player.scale.y / 6;

      // move the sprite to the center of the screen
      monster.x = app.screen.width / 2;
      monster.y = app.screen.height / 2;

      projectile.x = app.screen.width / 3;
      projectile.y = app.screen.height / 3;


      app.stage.addChild(sandTexture);

      monster.anchor.set(0.5);
      app.stage.addChild(monster);


      app.stage.addChild(projectile);

      const renderInApp = (outcomes: TickOutcome[]) => renderDiffs(outcomes.map(x => x.diffs).flat(), app);

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

      const commandBatches = convertEventsToCommands(document, playerId).pipe(bufferTime(10));
      
      const simTickOutcomes$ = commandBatches.pipe(scan(reduceWorldOnTick, initialOutcome));

      const frameStream: Observable<number> = Observable.create((subscriber: Subscriber<number>) => {
        app.ticker.add(x => subscriber.next(x))
      });

      const worldRenders$ = simTickOutcomes$.pipe(buffer(frameStream));

      worldRenders$.subscribe(renderInApp);
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
