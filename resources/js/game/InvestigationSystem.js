class InvestigationSystem {
    constructor() {
        this.discoveredClues = new Set();
        this.investigatedObjects = new Map();
        this.playerKnowledge = new Map();
        this.questProgress = new Map();
        
        // Definir pistas e objetos investigáveis do cenário do porão
        this.setupBasementScenario();
    }

    setupBasementScenario() {
        // Definir objetos investigáveis no porão
        this.investigatableObjects = {
            barrel: {
                name: "Barril de Madeira",
                clues: ["barrel_contents", "barrel_age", "barrel_origin"],
                descriptions: {
                    initial: "Um barril de madeira antigo. Parece ter sido usado recentemente.",
                    detailed: "O barril tem marcas de uso recente. Há resíduos de algum líquido no fundo.",
                    expert: "Analisando melhor, o líquido parece ser água, mas há um cheiro estranho..."
                },
                requiredInvestigations: 0,
                maxInvestigations: 3
            },
            
            chair: {
                name: "Cadeira Velha",
                clues: ["chair_wear", "chair_position", "chair_material"],
                descriptions: {
                    initial: "Uma cadeira de madeira desgastada pelo tempo.",
                    detailed: "A cadeira tem marcas de uso frequente. Uma das pernas está ligeiramente solta.",
                    expert: "Há arranhões no chão ao redor da cadeira, como se fosse movida frequentemente."
                },
                requiredInvestigations: 0,
                maxInvestigations: 3
            },

            table: {
                name: "Mesa Quadrada",
                clues: ["table_scratches", "table_stains", "table_drawer"],
                descriptions: {
                    initial: "Uma mesa de madeira robusta com algumas marcas de uso.",
                    detailed: "A mesa tem várias manchas e arranhões. Parece ter uma gaveta secreta.",
                    expert: "Examinando a gaveta secreta, você encontra alguns papéis antigos..."
                },
                requiredInvestigations: 0,
                maxInvestigations: 3
            },

            walls: {
                name: "Paredes do Porão",
                clues: ["wall_moisture", "wall_cracks", "wall_markings"],
                descriptions: {
                    initial: "Paredes de pedra úmidas e antigas.",
                    detailed: "Há rachaduras nas paredes e sinais de umidade. Algumas pedras parecem soltas.",
                    expert: "Uma das pedras soltas revela uma passagem secreta atrás da parede!"
                },
                requiredInvestigations: 0,
                maxInvestigations: 3
            }
        };

        // Definir pistas e suas conexões
        this.clueConnections = {
            barrel_contents: {
                description: "O barril continha água, mas há um cheiro químico estranho.",
                connectsTo: ["water_source", "chemical_traces"],
                revealsQuest: "find_water_source"
            },
            
            chair_position: {
                description: "A cadeira foi movida recentemente, há marcas no chão.",
                connectsTo: ["recent_activity", "escape_attempt"],
                revealsQuest: "investigate_recent_activity"
            },

            table_drawer: {
                description: "Papéis antigos com um mapa rudimentar do porão.",
                connectsTo: ["basement_map", "previous_prisoner"],
                revealsQuest: "find_exit_route"
            },

            wall_markings: {
                description: "Marcas nas paredes indicam tentativas de escape anteriores.",
                connectsTo: ["previous_attempts", "weak_points"],
                revealsQuest: "find_weak_wall"
            }
        };

        // Definir quests de investigação
        this.quests = {
            find_water_source: {
                name: "Encontrar a Fonte de Água",
                description: "Descobrir de onde vem a água no barril",
                requiredClues: ["barrel_contents", "wall_moisture"],
                reward: "Descoberta de um cano quebrado que pode ser uma rota de escape"
            },

            investigate_recent_activity: {
                name: "Investigar Atividade Recente",
                description: "Descobrir quem esteve aqui recentemente",
                requiredClues: ["chair_position", "table_scratches"],
                reward: "Pista sobre outro prisioneiro que escapou"
            },

            find_exit_route: {
                name: "Encontrar Rota de Fuga",
                description: "Usar o mapa para encontrar uma saída",
                requiredClues: ["table_drawer", "wall_markings"],
                reward: "Localização de uma passagem secreta"
            }
        };
    }

    investigateObject(objectId, investigationLevel = 1) {
        const obj = this.investigatableObjects[objectId];
        if (!obj) {
            return {
                success: false,
                message: "Este objeto não pode ser investigado."
            };
        }

        // Verificar se já foi investigado o máximo de vezes
        const currentInvestigations = this.investigatedObjects.get(objectId) || 0;
        if (currentInvestigations >= obj.maxInvestigations) {
            return {
                success: false,
                message: "Você já investigou este objeto completamente."
            };
        }

        // Incrementar contador de investigações
        const newInvestigationCount = currentInvestigations + 1;
        this.investigatedObjects.set(objectId, newInvestigationCount);

        // Determinar nível de descrição baseado no número de investigações
        let descriptionLevel = "initial";
        if (newInvestigationCount >= 2) descriptionLevel = "detailed";
        if (newInvestigationCount >= 3) descriptionLevel = "expert";

        const description = obj.descriptions[descriptionLevel];

        // Adicionar pistas descobertas
        const discoveredClues = [];
        if (newInvestigationCount <= obj.clues.length) {
            const clueIndex = newInvestigationCount - 1;
            const clue = obj.clues[clueIndex];
            this.discoveredClues.add(clue);
            discoveredClues.push(clue);
        }

        // Verificar se alguma quest foi desbloqueada
        const unlockedQuests = this.checkUnlockedQuests();

        return {
            success: true,
            message: description,
            discoveredClues,
            investigationLevel: newInvestigationCount,
            maxInvestigations: obj.maxInvestigations,
            unlockedQuests
        };
    }

    checkUnlockedQuests() {
        const unlockedQuests = [];

        for (const [questId, quest] of Object.entries(this.quests)) {
            // Verificar se a quest já foi desbloqueada
            if (this.questProgress.has(questId)) continue;

            // Verificar se todas as pistas necessárias foram descobertas
            const hasAllClues = quest.requiredClues.every(clue => 
                this.discoveredClues.has(clue)
            );

            if (hasAllClues) {
                this.questProgress.set(questId, 'unlocked');
                unlockedQuests.push({
                    id: questId,
                    ...quest
                });
            }
        }

        return unlockedQuests;
    }

    getClueDetails(clueId) {
        const clue = this.clueConnections[clueId];
        if (!clue) return null;

        return {
            description: clue.description,
            connections: clue.connectsTo,
            revealsQuest: clue.revealsQuest
        };
    }

    getPlayerKnowledge() {
        return {
            discoveredClues: Array.from(this.discoveredClues),
            investigatedObjects: Object.fromEntries(this.investigatedObjects),
            questProgress: Object.fromEntries(this.questProgress),
            availableQuests: this.getAvailableQuests()
        };
    }

    getAvailableQuests() {
        return Object.entries(this.quests)
            .filter(([questId, quest]) => {
                const progress = this.questProgress.get(questId);
                return progress === 'unlocked' || progress === 'in_progress';
            })
            .map(([questId, quest]) => ({
                id: questId,
                ...quest,
                progress: this.questProgress.get(questId)
            }));
    }

    completeQuest(questId) {
        const quest = this.quests[questId];
        if (!quest) return false;

        this.questProgress.set(questId, 'completed');
        
        // Adicionar recompensa ao conhecimento do player
        this.playerKnowledge.set(`quest_reward_${questId}`, quest.reward);

        return {
            success: true,
            message: `Quest completada: ${quest.name}`,
            reward: quest.reward
        };
    }

    // Método para verificar se o player pode escapar
    canEscape() {
        const completedQuests = Array.from(this.questProgress.entries())
            .filter(([questId, status]) => status === 'completed')
            .map(([questId]) => questId);

        // Player precisa completar pelo menos 2 quests para escapar
        if (completedQuests.length >= 2) {
            return {
                canEscape: true,
                message: "Você descobriu informações suficientes para tentar escapar!",
                escapeRoutes: this.getEscapeRoutes(completedQuests)
            };
        }

        return {
            canEscape: false,
            message: "Você precisa investigar mais antes de tentar escapar.",
            requiredQuests: 2 - completedQuests.length
        };
    }

    getEscapeRoutes(completedQuests) {
        const routes = [];

        if (completedQuests.includes('find_water_source')) {
            routes.push({
                name: "Cano de Água",
                description: "Seguir o cano quebrado até a superfície",
                difficulty: "médio"
            });
        }

        if (completedQuests.includes('find_exit_route')) {
            routes.push({
                name: "Passagem Secreta",
                description: "Usar a passagem secreta descoberta no mapa",
                difficulty: "fácil"
            });
        }

        return routes;
    }

    // Salvar/carregar estado do sistema
    saveState() {
        return {
            discoveredClues: Array.from(this.discoveredClues),
            investigatedObjects: Object.fromEntries(this.investigatedObjects),
            playerKnowledge: Object.fromEntries(this.playerKnowledge),
            questProgress: Object.fromEntries(this.questProgress)
        };
    }

    loadState(state) {
        this.discoveredClues = new Set(state.discoveredClues || []);
        this.investigatedObjects = new Map(Object.entries(state.investigatedObjects || {}));
        this.playerKnowledge = new Map(Object.entries(state.playerKnowledge || {}));
        this.questProgress = new Map(Object.entries(state.questProgress || {}));
    }
}

export default InvestigationSystem;

