import React, { Component, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
function App () {

    useEffect(() => {
      const app = new PIXI.Application(800, 600, {backgroundColor : 0x1099bb});
      document.getElementById('app')!.appendChild(app.view);
      const monster = PIXI.Sprite.from(mosterImage);
      const player = PIXI.Sprite.from(playerImage);
      monster.anchor.set(0.5);

      // move the sprite to the center of the screen
      monster.x = app.screen.width / 2;
      monster.y = app.screen.height / 2;

      app.stage.addChild(monster);

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
