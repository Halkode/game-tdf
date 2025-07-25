import { Filter, Graphics, Container } from "pixi.js";

class FogOfWarFilter {
    constructor(mapWidth, mapHeight, tileSize = 64) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = tileSize;
        this.visibilityRadius = 3; // Raio de visibilidade em tiles
        this.exploredTiles = new Set(); // Tiles já explorados
        this.currentVisibleTiles = new Set(); // Tiles atualmente visíveis
        
        this.fogContainer = new Container();
        this.createFogMask();
    }

    createFogMask() {
        // Criar máscara de neblina
        this.fogMask = new Graphics();
        this.fogContainer.addChild(this.fogMask);
        
        // Preencher toda a área com neblina escura
        this.redrawFog();
    }

    redrawFog() {
        this.fogMask.clear();
        
        // Fundo escuro para áreas não exploradas
        this.fogMask.beginFill(0x000000, 0.9);
        this.fogMask.drawRect(
            -this.mapWidth * this.tileSize,
            -this.mapHeight * this.tileSize,
            this.mapWidth * this.tileSize * 2,
            this.mapHeight * this.tileSize * 2
        );
        this.fogMask.endFill();

        // Remover neblina das áreas exploradas (com transparência)
        this.exploredTiles.forEach(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            const { screenX, screenY } = this.toIsometric(x, y);
            
            // Área explorada mas não visível atualmente (semi-transparente)
            if (!this.currentVisibleTiles.has(tileKey)) {
                this.fogMask.beginHole();
                this.drawTileArea(screenX, screenY, 0.5); // 50% transparente
                this.fogMask.endHole();
            }
        });

        // Áreas completamente visíveis (sem neblina)
        this.currentVisibleTiles.forEach(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            const { screenX, screenY } = this.toIsometric(x, y);
            
            this.fogMask.beginHole();
            this.drawTileArea(screenX, screenY, 0); // Completamente visível
            this.fogMask.endHole();
        });
    }

    drawTileArea(screenX, screenY, alpha = 0) {
        const tileWidth = this.tileSize;
        const tileHeight = this.tileSize / 2;
        
        // Desenhar área do tile em formato losango (isométrico)
        this.fogMask.beginFill(0x000000, alpha);
        this.fogMask.moveTo(screenX, screenY);
        this.fogMask.lineTo(screenX + tileWidth / 2, screenY + tileHeight / 2);
        this.fogMask.lineTo(screenX, screenY + tileHeight);
        this.fogMask.lineTo(screenX - tileWidth / 2, screenY + tileHeight / 2);
        this.fogMask.lineTo(screenX, screenY);
        this.fogMask.endFill();
    }

    updatePlayerPosition(playerX, playerY) {
        // Limpar tiles atualmente visíveis
        this.currentVisibleTiles.clear();
        
        // Calcular tiles visíveis baseado na posição do player
        for (let dx = -this.visibilityRadius; dx <= this.visibilityRadius; dx++) {
            for (let dy = -this.visibilityRadius; dy <= this.visibilityRadius; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.visibilityRadius) {
                    const tileX = playerX + dx;
                    const tileY = playerY + dy;
                    const tileKey = `${tileX},${tileY}`;
                    
                    // Adicionar à lista de tiles visíveis
                    this.currentVisibleTiles.add(tileKey);
                    
                    // Marcar como explorado
                    this.exploredTiles.add(tileKey);
                }
            }
        }
        
        // Redesenhar fog
        this.redrawFog();
    }

    toIsometric(x, y) {
        const screenX = (x - y) * (this.tileSize / 2);
        const screenY = (x + y) * (this.tileSize / 4);
        return { screenX, screenY };
    }

    setVisibilityRadius(radius) {
        this.visibilityRadius = radius;
    }

    isExplored(x, y) {
        return this.exploredTiles.has(`${x},${y}`);
    }

    isVisible(x, y) {
        return this.currentVisibleTiles.has(`${x},${y}`);
    }

    getContainer() {
        return this.fogContainer;
    }

    destroy() {
        this.fogContainer.destroy({ children: true });
        this.exploredTiles.clear();
        this.currentVisibleTiles.clear();
    }
}

export default FogOfWarFilter;

