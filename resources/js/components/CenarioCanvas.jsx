import React, { useEffect, useRef } from "react";
import { Application, Texture, Sprite, Graphics, Container } from "pixi.js";

const tileWidth = 64;
const tileHeight = 32;

function toIsometric(x, y) {
  const screenX = (x - y) * (tileWidth / 2);
  const screenY = (x + y) * (tileHeight / 2);
  return { screenX, screenY };
}

const PixiGame = ({ width = 800, height = 600, tiles = [], items = [] }) => {
  const pixiRef = useRef(null);

  useEffect(() => {
    let app;
    let destroyed = false;

    async function initPixi() {
      app = new Application();
      await app.init({
        width,
        height,
        backgroundColor: 0x1099bb,
        webgl: { antialias: true },
        webgpu: { antialias: false },
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      pixiRef.current.appendChild(app.canvas);

      const mapContainer = new Container();
      app.stage.addChild(mapContainer);

      mapContainer.x = width / 2;
      mapContainer.y = 100;

      tiles.forEach(tile => {
        const { screenX, screenY } = toIsometric(tile.x, tile.y);
        const g = new Graphics();
        // Desenha losango
        g.lineStyle(1, 0x444444)
          .beginFill(
            tile.type === "floor"
              ? 0xa3d977
              : tile.type === "wall"
              ? 0x888888
              : tile.type === "water"
              ? 0x3da9fc
              : 0xcccccc
          )
          .moveTo(screenX, screenY)
          .lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2)
          .lineTo(screenX, screenY + tileHeight)
          .lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2)
          .lineTo(screenX, screenY)
          .endFill();
        mapContainer.addChild(g);
      });

      // Renderizar itens
      items.forEach(item => {
        const { screenX, screenY } = toIsometric(item.position_x, item.position_y);
        if (item.icon) {
          const texture = Texture.from(item.icon);
          const sprite = new Sprite(texture);
          sprite.x = screenX;
          sprite.y = screenY - 32; 
          sprite.anchor.set(0.5, 1);
          mapContainer.addChild(sprite);
        } else {
          const g = new Graphics();
          g.beginFill(0xff0000).drawCircle(screenX, screenY, 12).endFill();
          mapContainer.addChild(g);
        }
      });
    }

    initPixi();

    return () => {
      destroyed = true;
      if (app) app.destroy(true, { children: true });
    };
  }, [width, height, tiles, items]);

  return <div ref={pixiRef} />;
};

export default PixiGame;
