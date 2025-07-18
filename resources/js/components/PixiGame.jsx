import React, { useEffect, useRef } from "react";
import { Application, Texture, Sprite, Graphics, Container, Assets } from "pixi.js";

const tileWidth = 64;
const tileHeight = 32;

// Função para converter coordenadas de grade para isométrico
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
    let dragging = false;
    let lastPos = { x: 0, y: 0 };
    let zoom = 1;

    let onMouseDown, onMouseUp, onMouseMove, onWheel;

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

      app.stage.removeChildren();

      const mapContainer = new Container();
      app.stage.addChild(mapContainer);
      mapContainer.x = width / 2;
      mapContainer.y = 100;
      mapContainer.scale.set(zoom, zoom);

      tiles.forEach(tile => {
        const { screenX, screenY } = toIsometric(tile.x, tile.y);
        const g = new Graphics();
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

      for (const item of items) {
        const { screenX, screenY } = toIsometric(item.position_x, item.position_y);
        if (item.icon) {
          await Assets.load(item.icon);
          const texture = Assets.get(item.icon) || Texture.from(item.icon);
          const sprite = new Sprite(texture);
          sprite.x = screenX;
          sprite.y = screenY;

          const scaleX = tileWidth / sprite.texture.width;
          const scaleY = tileHeight / sprite.texture.height;
          const scale = Math.max(scaleX, scaleY);
          sprite.scale.set(scale, scale);
          sprite.anchor.set(0.5, 1);
          sprite.zIndex = item.position_x + item.position_y;

          mapContainer.addChild(sprite);
        } else {
          const g = new Graphics();
          g.beginFill(0xff0000).drawCircle(screenX, screenY, 12).endFill();
          mapContainer.addChild(g);
        }
      }

      mapContainer.sortableChildren = true;

      function setZoom(newZoom) {
        zoom = Math.max(0.3, Math.min(2, newZoom)); // Limite de zoom
        mapContainer.scale.set(zoom, zoom);
      }

      onMouseDown = (e) => { dragging = true; lastPos = { x: e.clientX, y: e.clientY }; };
      onMouseUp = () => { dragging = false; };
      onMouseMove = (e) => {
        if (dragging) {
          const dx = e.clientX - lastPos.x;
          const dy = e.clientY - lastPos.y;
          mapContainer.x += dx;
          mapContainer.y += dy;
          lastPos = { x: e.clientX, y: e.clientY };
        }
      };
      onWheel = (e) => {
        e.preventDefault();
        setZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1));
      };

      app.canvas.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      app.canvas.addEventListener('mousemove', onMouseMove);
      app.canvas.addEventListener('wheel', onWheel);
    }

    initPixi();

    return () => {
      destroyed = true;
      if (app) {
        if (app.canvas) {
          app.canvas.removeEventListener('mousedown', onMouseDown);
          app.canvas.removeEventListener('mousemove', onMouseMove);
          app.canvas.removeEventListener('wheel', onWheel);
        }
        window.removeEventListener('mouseup', onMouseUp);
        if (app.destroy && typeof app.destroy === "function") {
          app.destroy(true, { children: true });
        }
      }
    };
  }, [width, height, tiles, items]);

  return <div ref={pixiRef} />;
};

export default PixiGame;