import React, { useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSandImage from './assets/PatternSand.jpg';
import projectileImage from './assets/Projectile.png';
import { World, reduceWorldOnTick } from './sim/process';
import { bufferTime, scan } from 'rxjs/operators';
import { convertEventsToCommands } from './clientCommands/sourcing';
import { loadWorld, renderWorld } from './sim/rendering';
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
      const initialWorld: World = { 
        activities: {}, 
        actors: { 
          "1": { location: { x: 25, y: 25 }, id: 1 }, 
          "2": { location: { x: 125, y: 125 }, id: 2 } 
        }, 
        projectiles: {} 
      } 

      const commandBatches = convertEventsToCommands(document).pipe(bufferTime(10));
      
      const worldStream = commandBatches.pipe(scan(reduceWorldOnTick, initialWorld));
      
      let currentWorld = initialWorld;

      worldStream.subscribe(x => currentWorld = x);

      loadWorld(currentWorld, app); // TEMP until it's totally dynamic

      app.ticker.add(x => renderWorld(currentWorld, app)); // we can convert it to Observable and connect to world stream
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
