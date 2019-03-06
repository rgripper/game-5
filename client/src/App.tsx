import React, { Component, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSand from './assets/PatternSand.jpg';
function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);
      const sandTexture = PIXI.extras.TilingSprite.from(patternSand, 800, 600);
      
      const monster = PIXI.Sprite.from(mosterImage);
      monster.scale.x = monster.scale.x / 6;
      monster.scale.y = monster.scale.y / 6;

      const player = PIXI.Sprite.from(playerImage);
      player.scale.x = player.scale.x / 6;
      player.scale.y = player.scale.y / 6;

      // move the sprite to the center of the screen
      monster.x = app.screen.width / 2;
      monster.y = app.screen.height / 2;

      app.stage.addChild(sandTexture);

      monster.anchor.set(0.5);
      app.stage.addChild(monster);

      player.anchor.set(0.5);
      app.stage.addChild(player);

      app.ticker.add(function(delta) {
          // just for fun, let's rotate mr rabbit a little
          // delta is 1 if running at 100% performance
          // creates frame-independent transformation
          monster.rotation += 0.1 * delta;
      });
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
