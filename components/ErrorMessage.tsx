
import React from 'react';

interface ErrorMessageProps {
  message: string;
  onReset: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onReset }) => {
  let title = "Ocurrió un Error";
  let suggestion = "Por favor, intenta de nuevo. Si el problema persiste, verifica tu conexión a internet o el contenido del documento.";

  // Heuristics to provide better suggestions based on keywords
  if (message.toLowerCase().includes('pdf') || message.toLowerCase().includes('archivo')) {
    title = "Error al Procesar el Archivo";
    suggestion = "Asegúrate de que el archivo PDF no esté dañado o protegido con contraseña. El documento debe contener texto seleccionable y no solo imágenes escaneadas.";
  } else if (message.toLowerCase().includes('generar') || message.toLowerCase().includes('ia')) {
    title = "Error de Generación";
    suggestion = "Hubo un problema al generar los casos de prueba. Revisa que la historia de usuario en el documento sea clara y esté bien estructurada. A veces, un simple reintento puede solucionar problemas temporales.";
  } else if (message.toLowerCase().includes('mejorar')) {
    title = "Error al Mejorar el Plan";
    suggestion = "No se pudo procesar la solicitud de mejora. Esto puede ser un problema temporal del servicio. Por favor, inténtalo de nuevo en unos momentos.";
  }


  return (
    <div className="w-full max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-6 rounded-lg shadow-md animate-fade-in" role="alert">
      <div className="flex">
        <div className="py-1 flex-shrink-0">
           {/* Fix: Corrected malformed viewBox attribute in SVG. */}
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-grow">
          <p className="font-bold text-lg">{title}</p>
          <p className="text-sm mt-2">{message}</p>
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
            <h4 className="font-semibold text-sm">Sugerencia:</h4>
            <p className="text-xs mt-1">{suggestion}</p>
          </div>
        </div>
      </div>
       <div className="mt-5 text-right">
           <button
                onClick={onReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
                Empezar de Nuevo
            </button>
       </div>
    </div>
  );
};

export default ErrorMessage;
