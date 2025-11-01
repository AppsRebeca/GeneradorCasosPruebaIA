import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-6 bg-white dark:bg-gray-800 shadow-md flex justify-center items-center gap-6">
      <div className="h-20 w-20 flex items-center justify-center bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-green-600 dark:text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          role="img"
          aria-label="Ícono de Pruebas de Software"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-left">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
          Generador de Casos de Prueba IA
        </h1>
         <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
          Ministerio de Ambiente y Desarrollo Sostenible
        </p>
        <p className="text-md text-gray-500 dark:text-gray-400 mt-2">
          Una herramienta de la Oficina TIC para optimizar la creación de planes de prueba.
        </p>
      </div>
    </header>
  );
};

export default Header;