import { Diff } from "../sim/Diff";
import humanImage from '../assets/Human.png';
import monsterImage from '../assets/Monster.png';
import projectileImage from '../assets/Projectile.png';
import { World, Entity } from "../sim/worldProcessor";
import * as PIXI from 'pixi.js';

const renderedEntities = new Map<number, RenderedEntity>();

function getImageByEntityType(entity: Entity): string {
  switch (entity.type) {
    case "Actor": switch(entity.unitType) {
      case "Human": return humanImage;
      case "Monster": return monsterImage;
    };
    case "Projectile": return projectileImage;
  }
}

type RenderedEntity = { 
  container: PIXI.DisplayObject; 
  main: PIXI.Sprite;
}

function createRenderedEntity (entity: Entity, app: PIXI.Application, image: string): RenderedEntity {
  const sprite = PIXI.Sprite.from(image);
  sprite.anchor.x = 0.5;
  sprite.anchor.y = 0.5;
  sprite.scale.x /= 6;
  sprite.scale.y /= 6;
  sprite.x = entity.size.width / 2;
  sprite.y = entity.size.height / 2;

  const collisionRect = new PIXI.Graphics();
  collisionRect.lineStyle(1, 0x90CAF9, 0.8);
  collisionRect.drawRect(0, 0, entity.size.width, entity.size.height);

  const container = new PIXI.Container();
  container.addChild(sprite);
  container.addChild(collisionRect);

  const renderedEntity = {
    container,
    main: sprite
  };

  app.stage.addChild(container);

  renderedEntities.set(entity.id, renderedEntity);

  return renderedEntity;
}

// TODO: convert to Diffs streaming somehow?
export function renderWorld(world: World, app: PIXI.Application) {
  const initialDiffs: Diff[] = Object.values(world.entities).map(entity => ({ target: entity, targetType: 'Entity', type: 'Upsert' }));
  renderDiffs(initialDiffs, app);
}

export function renderDiffs(diffs: Diff[], app: PIXI.Application) {
  diffs.forEach(diff => {
    if (diff.targetType !== "Entity") {
      return;
    }
    switch(diff.type) {
      case "Upsert": {
        const re = renderedEntities.get(diff.target.id) || createRenderedEntity(diff.target, app, getImageByEntityType(diff.target));
        if (diff.target.type === "Actor") {
          re.container.alpha = diff.target.currentHealth / diff.target.maxHealth;
        }
        re.main.rotation = diff.target.rotation;
        re.container.x = diff.target.location.x;
        re.container.y = diff.target.location.y;
        return;
      }
      case "Delete": {
        const re = renderedEntities.get(diff.targetId)!;
        app.stage.removeChild(re.container);
        renderedEntities.delete(diff.targetId);
        return;
      }
    }
  })
}
