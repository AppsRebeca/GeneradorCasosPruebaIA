
import React from 'react';
import type { TestPlan } from '../types';

const metricsConfig = [
  {
    key: 'functionalCoverage',
    name: 'Cobertura Funcional (CF)',
    definition: 'Porcentaje de criterios de aceptación de la HU cubiertos por al menos un caso de prueba.',
    threshold: 95,
  },
  {
    key: 'semanticConsistency',
    name: 'Consistencia Semántica (CS)',
    definition: 'Grado de alineación terminológica entre la HU y los casos de prueba (variables, roles, acciones).',
    threshold: 90,
  },
  {
    key: 'structuralCompleteness',
    name: 'Completitud Estructural (CE)',
    definition: 'Porcentaje de escenarios posibles (positivos/negativos) efectivamente representados.',
    threshold: 85,
  },
  {
    key: 'huTestTraceability',
    name: 'Trazabilidad HU-Prueba (TP)',
    definition: 'Correspondencia unívoca entre HU y casos (sin omisiones ni duplicados).',
    threshold: 100,
  },
  {
    key: 'clarityOfExpectedResults',
    name: 'Claridad de Resultados (CRE)',
    definition: 'Casos que incluyen resultados esperados verificables, medibles y no ambiguos.',
    threshold: 95,
  },
];


interface QualityReportDisplayProps {
  plan: TestPlan;
  onClose: () => void;
  onImprove: (plan: TestPlan) => void;
  isImproving: boolean;
}

const QualityReportDisplay: React.FC<QualityReportDisplayProps> = ({ plan, onClose, onImprove, isImproving }) => {
  const report = plan.qualityReport;

  if (!report) return null;

  const handleExportJSON = () => {
    const dataToExport = {
      identifier: plan.identifier,
      name: plan.name,
      qualityReport: plan.qualityReport,
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-calidad-${plan.identifier}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['Metrica', 'Definicion', 'Puntaje', 'Umbral', 'Estado'];
    const rows = metricsConfig.map(metric => {
        const score = report[metric.key as keyof typeof report];
        const passes = score >= metric.threshold;
        const status = passes ? 'Pasa' : 'No Pasa';
        // Escape potential commas in definition by wrapping in quotes
        const definition = `"${metric.definition}"`;
        return [metric.name, definition, score, metric.threshold, status].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-calidad-${plan.identifier}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Reporte de Calidad</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{plan.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Cerrar modal"
            >
              {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto">
            {metricsConfig.map(({ key, name, definition, threshold }) => {
                const score = report[key as keyof typeof report];
                const passes = score >= threshold;
                return (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-1">
                            <p className="font-semibold text-gray-700 dark:text-gray-200">{name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{definition}</p>
                        </div>
                        <div className="flex items-center space-x-4 ml-4">
                            <div className="text-right">
                                <span className={`text-lg font-bold ${passes ? 'text-green-500' : 'text-red-500'}`}>{score}%</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400"> (Umbral: {threshold}%)</span>
                            </div>
                             <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${passes ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                                {passes ? (
                                    // Fix: Corrected incomplete viewBox attribute in SVG.
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Pasa el umbral">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    // Fix: Corrected incomplete viewBox attribute in SVG.
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="No pasa el umbral">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                    {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">Refinar Plan de Pruebas</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Puedes solicitar a la IA una versión alternativa o mejorada de este plan.
                    </p>
                </div>
                <button
                    onClick={() => onImprove(plan)}
                    disabled={isImproving}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-transform hover:scale-105 text-sm font-medium flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-wait disabled:scale-100"
                >
                    {isImproving ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Mejorando...</span>
                        </>
                    ) : (
                        <>
                            {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                            Mejorar Plan
                        </>
                    )}
                </button>
            </div>
             <div className="flex justify-end items-center gap-3">
                <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-auto">Opciones de Exportación</h5>
                <button
                    onClick={handleExportJSON}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                    aria-label="Exportar reporte a formato JSON"
                >
                    {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    <span>JSON</span>
                </button>
                <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
                    aria-label="Exportar reporte a formato CSV"
                >
                    {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    <span>CSV</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default QualityReportDisplay;
