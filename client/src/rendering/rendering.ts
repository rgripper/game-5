import { Diff } from "../sim/Diff";
import humanImage from '../assets/Human.png';
import monsterImage from '../assets/Monster.png';
import projectileImage from '../assets/Projectile.png';
import { World, Entity } from "../sim/worldProcessor";
import * as PIXI from 'pixi.js';

const containers = new Map<number, PIXI.DisplayObject>();

function getImageByEntityType(entity: Entity): string {
  switch (entity.type) {
    case "Actor": switch(entity.unitType) {
      case "Human": return humanImage;
      case "Monster": return monsterImage;
    };
    case "Projectile": return projectileImage;
  }
}

function createDisplayObject (entity: Entity, app: PIXI.Application, image: string): PIXI.DisplayObject {
  const sprite = PIXI.Sprite.from(image);

  sprite.scale.x /= 6;
  sprite.scale.y /= 6;

  const collisionRect = new PIXI.Graphics();
  // set the line style to have a width of 5 and set the color to red
  collisionRect.lineStyle(1, 0x90CAF9, 0.8);
  // draw a rectangle
  collisionRect.drawRect(0, 0, entity.size.width, entity.size.height);
  
  const container = new PIXI.Container();

  container.addChild(sprite);
  container.addChild(collisionRect);

  app.stage.addChild(container);

  containers.set(entity.id, container);
  return container;
}

// TODO: convert to Diffs somehow?
export function renderWorld(world: World, app: PIXI.Application) {
  Object.values(world.entities).forEach(entity => {
    const displayObject = createDisplayObject(entity, app, getImageByEntityType(entity));
    displayObject.rotation = entity.rotation;
    displayObject.x = entity.location.x;
    displayObject.y = entity.location.y;
  })
}

export function renderDiffs(diffs: Diff[], app: PIXI.Application) {
  diffs.forEach(diff => {
    if (diff.targetType !== "Entity") {
      return;
    }
    switch(diff.type) {
      case "Upsert": {
        const displayObject = containers.get(diff.target.id) || createDisplayObject(diff.target, app, getImageByEntityType(diff.target));
        if (diff.target.type === "Actor") {
          displayObject.alpha = diff.target.currentHealth / diff.target.maxHealth;
        }
        displayObject.rotation = diff.target.rotation;
        displayObject.x = diff.target.location.x;
        displayObject.y = diff.target.location.y;
        return;
      }
      case "Delete": {
        const sprite = containers.get(diff.targetId)!;
        app.stage.removeChild(sprite);
        containers.delete(diff.targetId);
        return;
      }
    }
  })
}
