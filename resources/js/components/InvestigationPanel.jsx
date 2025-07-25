import React, { useState, useEffect } from 'react';

const InvestigationPanel = ({ investigationSystem, visible, onClose }) => {
    const [playerKnowledge, setPlayerKnowledge] = useState(null);
    const [selectedTab, setSelectedTab] = useState('clues');

    useEffect(() => {
        if (visible && investigationSystem) {
            setPlayerKnowledge(investigationSystem.getPlayerKnowledge());
        }
    }, [visible, investigationSystem]);

    if (!visible || !playerKnowledge) return null;

    const renderCluesTab = () => (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-yellow-400">Pistas Descobertas</h3>
            {playerKnowledge.discoveredClues.length === 0 ? (
                <p className="text-gray-400">Nenhuma pista descoberta ainda. Investigue os objetos ao redor.</p>
            ) : (
                <div className="space-y-2">
                    {playerKnowledge.discoveredClues.map((clue, index) => {
                        const clueDetails = investigationSystem.getClueDetails(clue);
                        return (
                            <div key={index} className="bg-gray-700 p-3 rounded border-l-4 border-yellow-500">
                                <div className="font-medium text-yellow-300">{clue.replace('_', ' ').toUpperCase()}</div>
                                {clueDetails && (
                                    <div className="text-sm text-gray-300 mt-1">
                                        {clueDetails.description}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderQuestsTab = () => (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-400">Objetivos</h3>
            {playerKnowledge.availableQuests.length === 0 ? (
                <p className="text-gray-400">Continue investigando para descobrir objetivos.</p>
            ) : (
                <div className="space-y-3">
                    {playerKnowledge.availableQuests.map((quest, index) => (
                        <div key={index} className="bg-gray-700 p-3 rounded border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                                <div className="font-medium text-blue-300">{quest.name}</div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    quest.progress === 'completed' 
                                        ? 'bg-green-600 text-green-100' 
                                        : 'bg-yellow-600 text-yellow-100'
                                }`}>
                                    {quest.progress === 'completed' ? 'Completo' : 'Em Progresso'}
                                </span>
                            </div>
                            <div className="text-sm text-gray-300 mt-1">
                                {quest.description}
                            </div>
                            {quest.progress === 'completed' && quest.reward && (
                                <div className="text-sm text-green-300 mt-2 italic">
                                    Recompensa: {quest.reward}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderObjectsTab = () => (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-purple-400">Objetos Investigados</h3>
            {Object.keys(playerKnowledge.investigatedObjects).length === 0 ? (
                <p className="text-gray-400">Nenhum objeto investigado ainda.</p>
            ) : (
                <div className="space-y-2">
                    {Object.entries(playerKnowledge.investigatedObjects).map(([objectId, investigations]) => {
                        const obj = investigationSystem.investigatableObjects[objectId];
                        return (
                            <div key={objectId} className="bg-gray-700 p-3 rounded border-l-4 border-purple-500">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium text-purple-300">
                                        {obj ? obj.name : objectId}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {investigations}/{obj ? obj.maxInvestigations : '?'} investigações
                                    </div>
                                </div>
                                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                                    <div 
                                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${obj ? (investigations / obj.maxInvestigations) * 100 : 0}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderEscapeTab = () => {
        const escapeInfo = investigationSystem.canEscape();
        
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-red-400">Plano de Fuga</h3>
                
                <div className={`p-4 rounded border-l-4 ${
                    escapeInfo.canEscape 
                        ? 'bg-green-900 border-green-500' 
                        : 'bg-red-900 border-red-500'
                }`}>
                    <div className={`font-medium ${
                        escapeInfo.canEscape ? 'text-green-300' : 'text-red-300'
                    }`}>
                        {escapeInfo.canEscape ? 'Fuga Possível!' : 'Fuga Impossível'}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                        {escapeInfo.message}
                    </div>
                </div>

                {escapeInfo.canEscape && escapeInfo.escapeRoutes && (
                    <div className="space-y-2">
                        <h4 className="font-medium text-green-400">Rotas de Fuga Disponíveis:</h4>
                        {escapeInfo.escapeRoutes.map((route, index) => (
                            <div key={index} className="bg-gray-700 p-3 rounded border-l-4 border-green-500">
                                <div className="font-medium text-green-300">{route.name}</div>
                                <div className="text-sm text-gray-300">{route.description}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                    Dificuldade: {route.difficulty}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!escapeInfo.canEscape && escapeInfo.requiredQuests && (
                    <div className="text-sm text-yellow-300">
                        Você precisa completar mais {escapeInfo.requiredQuests} objetivo(s) para escapar.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Diário de Investigação</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-gray-900 px-6 py-2 border-b border-gray-700">
                    <div className="flex space-x-4">
                        {[
                            { id: 'clues', label: 'Pistas', icon: '🔍' },
                            { id: 'quests', label: 'Objetivos', icon: '📋' },
                            { id: 'objects', label: 'Objetos', icon: '📦' },
                            { id: 'escape', label: 'Fuga', icon: '🚪' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id)}
                                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                    selectedTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {selectedTab === 'clues' && renderCluesTab()}
                    {selectedTab === 'quests' && renderQuestsTab()}
                    {selectedTab === 'objects' && renderObjectsTab()}
                    {selectedTab === 'escape' && renderEscapeTab()}
                </div>

                {/* Footer */}
                <div className="bg-gray-900 px-6 py-3 border-t border-gray-700">
                    <div className="text-sm text-gray-400 text-center">
                        Pressione 'I' para abrir/fechar este painel durante o jogo
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestigationPanel;

