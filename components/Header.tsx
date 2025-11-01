import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center p-6 bg-white dark:bg-gray-800 shadow-md flex justify-center items-center gap-4">
       <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-20 w-20 text-green-600"
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth="1"
        role="img"
        aria-labelledby="appLogoTitle"
       >
         <title id="appLogoTitle">Logo de la aplicación - Icono de documento</title>
         <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
       </svg>
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500 mb-2">
          Generador de Casos de Prueba con IA
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Sube una historia de usuario en PDF y deja que Gemini cree los casos de prueba por ti.
        </p>
      </div>
    </header>
  );
};

export default Header;