import { Container, Graphics, Sprite } from "pixi.js";
import TileSpriteFactory from "../utils/TileSpriteFactory";

const tileWidth = 64;
const tileHeight = 32;

function toIsometric(x, y) {
    const screenX = (x - y) * (tileWidth / 2);
    const screenY = (x + y) * (tileHeight / 2);
    return { screenX, screenY };
}

class TileMap {
    constructor(tiles = [], assets = {}) {
        this.container = new Container();
        this.tiles = tiles;
        this.assets = assets;
        this.tileSprites = new Map();
    }

    async render() {
        // Limpar container
        this.container.removeChildren();
        this.tileSprites.clear();

        // Renderizar tiles
        for (const tile of this.tiles) {
            await this.renderTile(tile);
        }

        // Ordenar por profundidade (z-index)
        this.container.sortableChildren = true;
    }

    async renderTile(tile) {
        const { screenX, screenY } = toIsometric(tile.x, tile.y);
        
        try {
            // Tentar criar sprite usando factory
            const sprite = await TileSpriteFactory.createTileSprite(tile, this.assets);
            
            if (sprite) {
                sprite.x = screenX;
                sprite.y = screenY;
                sprite.anchor.set(0.5, 1);
                sprite.zIndex = tile.x + tile.y;
                
                this.container.addChild(sprite);
                this.tileSprites.set(`${tile.x}-${tile.y}`, sprite);
            } else {
                // Fallback para gráfico simples
                this.renderFallbackTile(tile, screenX, screenY);
            }
        } catch (error) {
            console.warn(`Erro ao renderizar tile em (${tile.x}, ${tile.y}):`, error);
            this.renderFallbackTile(tile, screenX, screenY);
        }
    }

    renderFallbackTile(tile, screenX, screenY) {
        const g = new Graphics();
        g.lineStyle(1, 0x444444);
        
        // Cores baseadas no tipo do tile
        let fillColor = 0xcccccc;
        switch (tile.type) {
            case "floor":
                fillColor = 0xa3d977;
                break;
            case "wall":
                fillColor = 0x888888;
                break;
            case "water":
                fillColor = 0x3da9fc;
                break;
            case "door":
                fillColor = 0x8B4513;
                break;
            default:
                fillColor = 0xcccccc;
        }

        g.beginFill(fillColor)
            .moveTo(screenX, screenY)
            .lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2)
            .lineTo(screenX, screenY + tileHeight)
            .lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2)
            .lineTo(screenX, screenY)
            .endFill();

        g.zIndex = tile.x + tile.y;
        this.container.addChild(g);
    }

    getTileAt(x, y) {
        return this.tiles.find(tile => tile.x === x && tile.y === y);
    }

    updateTile(x, y, newTileData) {
        const tileIndex = this.tiles.findIndex(tile => tile.x === x && tile.y === y);
        if (tileIndex !== -1) {
            this.tiles[tileIndex] = { ...this.tiles[tileIndex], ...newTileData };
            this.renderTile(this.tiles[tileIndex]);
        }
    }

    getContainer() {
        return this.container;
    }

    destroy() {
        this.container.destroy({ children: true });
        this.tileSprites.clear();
    }
}

export default TileMap;

