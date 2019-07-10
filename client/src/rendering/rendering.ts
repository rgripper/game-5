import humanImage from '../assets/Human.png';
import monsterImage from '../assets/Monster.png';
import projectileImage from '../assets/Projectile.png';
import * as PIXI from 'pixi.js';
import { Entity, WorldState, EntityType } from "../sim/world";
import { Diff } from '../sim/sim';

const renderedEntities = new Map<number, RenderedEntity>();

function getImageByEntityType(entity: Entity): string {
  switch (entity.entity_type) {
    case EntityType.Human: return humanImage;
    case EntityType.Monster: return monsterImage;
    case EntityType.Projectile: return projectileImage;
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
  sprite.x = entity.boundaries.size.width / 2;
  sprite.y = entity.boundaries.size.height / 2;

  const collisionRect = new PIXI.Graphics();
  collisionRect.lineStyle(1, 0x90CAF9, 0.8);
  collisionRect.drawRect(0, 0, entity.boundaries.size.width, entity.boundaries.size.height);

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
export function renderWorld(world: WorldState, app: PIXI.Application) {
  const initialDiffs: Diff[] = Object.values(world.entities).map(entity => ({ type: 'UpsertEntity', entity }));
  renderDiffs(initialDiffs, app);
}

export function renderDiffs(diffs: Diff[], app: PIXI.Application) {
  diffs.forEach(diff => {
    if (diff.type !== "UpsertEntity" && diff.type !== "DeleteEntity") {
      return;
    }
    switch(diff.type) {
      case "UpsertEntity": {
        const re = renderedEntities.get(diff.entity.id) || createRenderedEntity(diff.entity, app, getImageByEntityType(diff.entity));
        re.container.alpha = diff.entity.health.current / diff.entity.health.max;
        re.main.rotation = diff.entity.rotation;
        re.container.x = diff.entity.boundaries.top_left.x;
        re.container.y = diff.entity.boundaries.top_left.y;
        return;
      }
      case "DeleteEntity": {
        const re = renderedEntities.get(diff.id)!;
        app.stage.removeChild(re.container);
        renderedEntities.delete(diff.id);
        return;
      }
    }
  })
}
