// Definições de assets e caminhos
export const ASSET_PATHS = {
    // Tiles de chão
    FLOORS: {
        GRAY_1: "/images/tile_gray_1.png",
        GRAY_2: "/images/tile_gray_2.png", 
        GRAY_3: "/images/tile_gray_3.png",
        GRAY_11: "/images/tile_gray_11.png",
        GRAY_12: "/images/tile_gray_12.png",
        GRAY_13: "/images/tile_gray_13.png",
        GRAY_16: "/images/tile_gray_16.png",
        GRAY_17: "/images/tile_gray_17.png",
        GRAY_18: "/images/tile_gray_18.png"
    },

    // Paredes
    WALLS: {
        WOOD_LEFT: "/images/wall-wood-esquerda.png",
        WOOD_RIGHT: "/images/wall-wood-direita.png"
    },

    // Objetos
    OBJECTS: {
        BARREL: "/images/barrel.png",
        CHAIR: "/images/cadeira.png",
        TABLE_SQUARE: "/images/mesa-quadrada.png",
        TABLE_SMALL: "/images/table.png"
    },

    // Diretórios de assets organizados
    DIRECTORIES: {
        ANIMATIONS: "/images/Animations/",
        DOORS: "/images/Doors/",
        FLOORS: "/images/Floors/",
        MISC_PROPS: "/images/Misc Props/",
        OBJECTS: "/images/Objects/",
        TILES: "/images/Tiles/",
        WALLS: "/images/Walls/",
        SCENES: "/images/assets-scenes/"
    }
};

// Configurações do jogo
export const GAME_CONFIG = {
    TILE_WIDTH: 64,
    TILE_HEIGHT: 32,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    ZOOM_MIN: 0.3,
    ZOOM_MAX: 2.0,
    ZOOM_STEP: 0.1
};

// Configurações do fog of war
export const FOG_CONFIG = {
    VISIBILITY_RADIUS: 3,
    EXPLORED_ALPHA: 0.5,
    HIDDEN_ALPHA: 0.9
};

// Tipos de tiles
export const TILE_TYPES = {
    FLOOR: "floor",
    WALL: "wall", 
    DOOR: "door",
    WATER: "water",
    STAIRS: "stairs",
    VOID: "void"
};

// Tipos de objetos
export const OBJECT_TYPES = {
    FURNITURE: "furniture",
    CONTAINER: "container",
    DECORATION: "decoration",
    INTERACTIVE: "interactive",
    COLLECTIBLE: "collectible"
};

// Ações disponíveis
export const ACTIONS = {
    PICK: "pick",
    EXAMINE: "examine", 
    MOVE: "move",
    USE: "use",
    OPEN: "open",
    CLOSE: "close"
};

// Cores do tema
export const THEME_COLORS = {
    BACKGROUND: 0x1a1a1a,
    FLOOR: 0xa3d977,
    WALL: 0x888888,
    WATER: 0x3da9fc,
    DOOR: 0x8B4513,
    HIGHLIGHT: 0xffff00,
    SELECTED: 0xff6b6b
};

// Lista de todos os assets para pré-carregamento
export const ALL_ASSETS = [
    ...Object.values(ASSET_PATHS.FLOORS),
    ...Object.values(ASSET_PATHS.WALLS),
    ...Object.values(ASSET_PATHS.OBJECTS)
];

export default {
    ASSET_PATHS,
    GAME_CONFIG,
    FOG_CONFIG,
    TILE_TYPES,
    OBJECT_TYPES,
    ACTIONS,
    THEME_COLORS,
    ALL_ASSETS
};

