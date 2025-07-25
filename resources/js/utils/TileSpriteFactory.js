import { Sprite, AnimatedSprite, Assets, Texture } from "pixi.js";

class TileSpriteFactory {
    static async createTileSprite(tile, assets = {}) {
        try {
            // Mapear tipos de tile para sprites
            const spriteMapping = {
                floor: this.getFloorSprite(tile),
                wall: this.getWallSprite(tile),
                door: this.getDoorSprite(tile),
                water: this.getWaterSprite(tile),
                stairs: this.getStairsSprite(tile)
            };

            const spritePath = spriteMapping[tile.type];
            if (!spritePath) {
                return null;
            }

            // Carregar texture se necessário
            if (!Assets.cache.has(spritePath)) {
                await Assets.load(spritePath);
            }

            const texture = Assets.get(spritePath);
            if (!texture) {
                console.warn(`Texture não encontrada: ${spritePath}`);
                return null;
            }

            // Criar sprite
            const sprite = new Sprite(texture);
            
            // Configurar escala para se ajustar ao tile
            const tileWidth = 64;
            const tileHeight = 32;
            const scaleX = tileWidth / texture.width;
            const scaleY = tileHeight / texture.height;
            const scale = Math.min(scaleX, scaleY);
            
            sprite.scale.set(scale, scale);
            
            return sprite;

        } catch (error) {
            console.error("Erro ao criar sprite do tile:", error);
            return null;
        }
    }

    static getFloorSprite(tile) {
        // Mapear diferentes tipos de chão
        const floorVariants = [
            "/images/tile_gray_1.png",
            "/images/tile_gray_2.png",
            "/images/tile_gray_3.png"
        ];
        
        // Usar hash da posição para escolher variante consistente
        const hash = (tile.x * 31 + tile.y * 17) % floorVariants.length;
        return floorVariants[hash];
    }

    static getWallSprite(tile) {
        // Determinar orientação da parede baseada na posição ou propriedades
        if (tile.orientation === "left" || tile.x % 2 === 0) {
            return "/images/wall-wood-esquerda.png";
        } else {
            return "/images/wall-wood-direita.png";
        }
    }

    static getDoorSprite(tile) {
        // Verificar se há sprites específicos para portas
        const doorSprites = [
            "/images/Doors/door_1.png",
            "/images/Doors/door_2.png"
        ];
        
        // Por enquanto, usar o primeiro disponível
        return doorSprites[0];
    }

    static getWaterSprite(tile) {
        // Para água, podemos usar tiles azuis ou sprites específicos
        return "/images/tile_gray_16.png"; // Placeholder
    }

    static getStairsSprite(tile) {
        // Sprites para escadas
        return "/images/Objects/stairs.png"; // Placeholder
    }

    static async createAnimatedSprite(spritePaths, animationSpeed = 0.1) {
        try {
            const textures = [];
            
            for (const path of spritePaths) {
                if (!Assets.cache.has(path)) {
                    await Assets.load(path);
                }
                const texture = Assets.get(path);
                if (texture) {
                    textures.push(texture);
                }
            }

            if (textures.length === 0) {
                return null;
            }

            const animatedSprite = new AnimatedSprite(textures);
            animatedSprite.animationSpeed = animationSpeed;
            animatedSprite.play();
            
            return animatedSprite;

        } catch (error) {
            console.error("Erro ao criar sprite animado:", error);
            return null;
        }
    }

    static async createObjectSprite(item, assets = {}) {
        try {
            let spritePath = item.icon;
            
            // Mapear objetos específicos para sprites
            const objectMapping = {
                barrel: "/images/barrel.png",
                chair: "/images/cadeira.png",
                table: "/images/mesa-quadrada.png",
                "small-table": "/images/table.png"
            };

            if (objectMapping[item.name] || objectMapping[item.type]) {
                spritePath = objectMapping[item.name] || objectMapping[item.type];
            }

            if (!spritePath) {
                return null;
            }

            // Carregar texture
            if (!Assets.cache.has(spritePath)) {
                await Assets.load(spritePath);
            }

            const texture = Assets.get(spritePath);
            if (!texture) {
                console.warn(`Texture não encontrada para objeto: ${spritePath}`);
                return null;
            }

            const sprite = new Sprite(texture);
            
            // Configurar escala baseada no tamanho do objeto
            const maxSize = 48; // Tamanho máximo do objeto
            const scale = Math.min(maxSize / texture.width, maxSize / texture.height);
            sprite.scale.set(scale, scale);
            
            return sprite;

        } catch (error) {
            console.error("Erro ao criar sprite do objeto:", error);
            return null;
        }
    }
}

export default TileSpriteFactory;

