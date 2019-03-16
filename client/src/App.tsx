import React, { Component, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import './App.css';
import mosterImage from './assets/Monster.png';
import playerImage from './assets/Player.png';
import patternSandImage from './assets/PatternSand.jpg';
import projectileImage from './assets/Projectile.png';
import { World, ClientCommand, reduceWorldOnTick } from './sim/process';
import { interval, fromEvent, pipe, merge, Observable } from 'rxjs';
import { buffer, map, filter, bufferTime, reduce, scan } from 'rxjs/operators';
import { Key } from 'ts-key-enum';
import { number } from 'prop-types';
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
      let world: World = { activities: [], actors: [{ location: { x: 25, y: 25 }, id: 1 }, { location: { x: 125, y: 125 }, id: 2 }], projectiles: [] } 

      function mapKeyboard (event: KeyboardEvent, isOn: boolean) {
        switch(event.key) {
          case 'w': return { type: "Down", actorId: 1, isOn } as ClientCommand;
          case 's': return { type: "Up", actorId: 1, isOn } as ClientCommand;
          case 'd': return { type: "Right", actorId: 1, isOn } as ClientCommand;
          case 'a': return { type: "Left", actorId: 1, isOn } as ClientCommand;
          default: return null;
        }
      }

      function mapMouse (event: MouseEvent, isOn: boolean) {
        switch(event.button) {
          case 0: return { type: "Up", actorId: 1, isOn } as ClientCommand;
          default: return null;
        }
      }

      const keyCommandsOn = fromEvent(document, 'keydown').pipe(map(event => mapKeyboard(event as KeyboardEvent, true)));
      const keyCommandsOff = fromEvent(document, 'keyup').pipe(map(event => mapKeyboard(event as KeyboardEvent, false)));
      const mouseCommandsOn = fromEvent(document, 'mousedown').pipe(map(event => mapMouse(event as MouseEvent, true)));
      const mouseCommandsOff = fromEvent(document, 'mouseup').pipe(map(event => mapMouse(event as MouseEvent, false)));
      
      const mergedCommands = merge(keyCommandsOn, keyCommandsOff, mouseCommandsOn, mouseCommandsOff).pipe(filter(x => x !== null)) as Observable<ClientCommand>;
      const commandBatches = mergedCommands.pipe(bufferTime(10));
      
      const worldStream = commandBatches.pipe(scan(reduceWorldOnTick, world));
      //worldStream.subscribe(x => console.log(x));
      const actorSprites = new Map<number, PIXI.Sprite>();
      world.actors.forEach(actor => {
        const actorSprite = PIXI.Sprite.from(playerImage);
        actorSprites.set(actor.id, actorSprite);
        actorSprite.anchor.set(0.5);
        app.stage.addChild(actorSprite);
      });

      worldStream.subscribe(function(world) {
        
        // just for fun, let's rotate mr rabbit a little
        // delta is 1 if running at 100% performance
        // creates frame-independent transformation
        world.actors.forEach(actor => {
          console.log('actor', actor.id, actor.location.x, actor.location.y);
          const actorSprite = actorSprites.get(actor.id)!;
          actorSprite.position.x = actor.location.x;
          actorSprite.position.y = actor.location.y; 
          //actorSprite.position.set(actor.location.x, actor.location.y);
        })
        
      })
    })

    return (
      <div className="App" id="app">
      </div>
    );
}

export default App;
