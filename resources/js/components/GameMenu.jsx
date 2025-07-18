import React from 'react';

export default function GameMenu({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center h-[300px]">
      <h2 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Menu do Jogo</h2>
      <button
        className="mb-4 px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => onSelect('novo')}
      >
        Novo Jogo
      </button>
      <button
        className="mb-4 px-8 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        onClick={() => onSelect('carregar')}
      >
        Carregar
      </button>
      <button
        className="px-8 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        onClick={() => onSelect('config')}
      >
        Configurações
      </button>
    </div>
  );
}
