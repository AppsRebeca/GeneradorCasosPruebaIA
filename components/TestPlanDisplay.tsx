
import React, { useState } from 'react';
import type { TestPlan, TestCase } from '../types';
import QualityReportDisplay from './QualityReportDisplay';

interface TestPlanDisplayProps {
  plans: TestPlan[];
  fileName: string | null;
  onReset: () => void;
  onImproveRequest: (plan: TestPlan) => void;
  improvingPlanId: string | null;
  justImprovedPlanId: string | null;
}

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

const NewIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
const ModifiedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const DeletedIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;

const TestPlanDisplay: React.FC<TestPlanDisplayProps> = ({ plans, fileName, onReset, onImproveRequest, improvingPlanId, justImprovedPlanId }) => {
  const [copiedStatus, setCopiedStatus] = useState<Record<string, boolean>>({});
  const [selectedPlanForReport, setSelectedPlanForReport] = useState<TestPlan | null>(null);

  const handleCopy = (plan: TestPlan) => {
    let textToCopy = `
INFORMACIÓN DEL PLAN DE PRUEBA
----------------------------------
Proyecto: ${plan.projectName}
Identificador: ${plan.identifier}
Nombre: ${plan.name}
Historia de Usuario: ${plan.userStory}
Analista QA: ${plan.qaAnalyst}
Entorno y Datos de Prueba: ${plan.testEnvironmentAndData}

CASOS DE PRUEBA
----------------------------------
`;
    plan.testCases.filter(tc => tc.changeStatus !== 'deleted').forEach(tc => {
      textToCopy += `
#${tc.consecutive}
Descripción: ${tc.description}
Resultado Esperado: ${tc.expectedResult}
---
`;
    });
    navigator.clipboard.writeText(textToCopy.trim());
    setCopiedStatus(prev => ({ ...prev, [plan.identifier]: true }));
    setTimeout(() => {
        setCopiedStatus(prev => ({ ...prev, [plan.identifier]: false }));
    }, 2000);
  };

  const handleExportDoc = (plan: TestPlan) => {
    const htmlHeader = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Plan de Pruebas</title><style>body{font-family:Arial,sans-serif;line-height:1.4;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #dddddd;text-align:left;padding:8px;vertical-align:top;}th{background-color:#f2f2f2;}h2,h3{color:#333;}</style></head><body>";
    const htmlFooter = "</body></html>";
    
    let htmlContent = `
        <h2>Plan de Pruebas: ${plan.name}</h2>
        <br/>
        <h3>Información del Plan de Prueba</h3>
        <p><strong>Proyecto:</strong> ${plan.projectName}</p>
        <p><strong>Identificador:</strong> ${plan.identifier}</p>
        <p><strong>Nombre del Plan:</strong> ${plan.name}</p>
        <p><strong>Historia de Usuario:</strong> ${plan.userStory}</p>
        <p><strong>Analista QA:</strong> ${plan.qaAnalyst}</p>
        <p><strong>Entorno y Datos de Prueba:</strong></p><p>${plan.testEnvironmentAndData.replace(/\n/g, '<br />')}</p>
        <br/>
        <h3>Casos de Prueba</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th>Caso de Prueba (Descripción)</th>
              <th>Resultado Esperado</th>
            </tr>
          </thead>
          <tbody>
            ${plan.testCases.filter(tc => tc.changeStatus !== 'deleted').map(tc => `
              <tr>
                <td>${tc.consecutive}</td>
                <td>${tc.description.replace(/\n/g, '<br />')}</td>
                <td>${tc.expectedResult.replace(/\n/g, '<br />')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
    `;

    const fullHtml = htmlHeader + htmlContent + htmlFooter;
    const blob = new Blob(['\ufeff', fullHtml], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-de-pruebas-${plan.identifier || 'export'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleExportMarkdown = (plan: TestPlan) => {
    let markdownContent = `![logominambientenuevo.png](/otic/logominambientenuevo.png)

## INFORMACIÓN DEL CASO DE PRUEBA

> **Identificador del caso de prueba:** ${plan.identifier}
> **Nombre del caso de prueba:** ${plan.name}
{.is-info}
> **Historia de usuario asociado:** ${plan.userStory}
> **Analista de aseguramiento de calidad del software:** ${plan.qaAnalyst}
{.is-info}

## ESPECIFICACIÓN DEL CASO DE PRUEBA
`;

    plan.testCases.filter(tc => tc.changeStatus !== 'deleted').forEach(tc => {
        const description = tc.description.replace(/\n/g, ' ');
        const expectedResult = tc.expectedResult.replace(/\n/g, ' ');
        markdownContent += `
> **Consecutivo caso de prueba:** ${tc.consecutive}
> **Caso de prueba:** ${description}
> **Resultado esperado:** ${expectedResult}

`;
    });

    const blob = new Blob([markdownContent.trim()], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-de-pruebas-${plan.identifier || 'export'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImproveClick = (plan: TestPlan) => {
    setSelectedPlanForReport(null);
    onImproveRequest(plan);
  };


  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-300 dark:border-gray-600">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Resultados para <span className="text-green-600">{fileName}</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{plans.length} plan(es) de prueba generado(s).</p>
            </div>
            <button
                onClick={onReset}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex-shrink-0 mt-4 sm:mt-0"
            >
                Empezar de Nuevo
            </button>
        </div>

        <div className="space-y-12">
        {plans.map((plan, index) => {
          const isImproving = improvingPlanId === plan.identifier;
          const justImproved = justImprovedPlanId === plan.identifier;
          const hasFailingMetrics = plan.qualityReport && metricsConfig.some(
              ({ key, threshold }) => plan.qualityReport[key as keyof typeof plan.qualityReport] < threshold
          );
          const hasDiffInfo = plan.testCases.some(tc => tc.changeStatus && tc.changeStatus !== 'unchanged');
          
          return (
          <div 
            key={plan.identifier || index} 
            className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${isImproving ? 'opacity-50 pointer-events-none' : ''} ${justImproved ? 'ring-2 ring-green-500 shadow-green-500/30' : 'shadow-lg'}`}
          >
            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  {plan.name}
                </h3>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-start">
                  <button
                    onClick={() => handleCopy(plan)}
                    disabled={copiedStatus[plan.identifier]}
                    className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 w-32 disabled:cursor-not-allowed ${
                        copiedStatus[plan.identifier]
                        ? 'bg-green-600'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    {copiedStatus[plan.identifier] ? (
                      <>
                        {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleExportDoc(plan)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    {/* Fix: Corrected incomplete viewBox attribute in SVG. */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Exportar
                  </button>
                   <button
                    onClick={() => handleExportMarkdown(plan)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                    aria-label="Exportar a Markdown"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 14h12V2H2v12z"/>
                        <path d="M5.438 4.312a.559.559 0 0 1 .818.062l1.36 2.252 1.36-2.252a.559.559 0 0 1 .818-.062l1.106.744a.559.559 0 0 1 .062.818l-1.928 3.193a.559.559 0 0 1-.88.084l-.82-1.353-.82 1.353a.559.559 0 0 1-.88-.084L4.27 5.874a.559.559 0 0 1 .062-.818l1.106-.744z"/>
                    </svg>
                    Markdown
                  </button>
                   <button
                    onClick={() => setSelectedPlanForReport(plan)}
                    disabled={isImproving}
                    className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${
                        hasFailingMetrics && !justImproved
                          ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {hasFailingMetrics && !isImproving && !justImproved ? (
                      // Fix: Corrected incomplete viewBox attribute in SVG.
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ) : (
                      // Fix: Corrected incomplete viewBox attribute in SVG.
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span>{isImproving ? 'Mejorando...' : justImproved ? '¡Mejorado!' : (hasFailingMetrics ? 'Revisar Calidad' : 'Ver Calidad')}</span>
                  </button>
                </div>
              </div>

              <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Información del Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><strong className="text-gray-500 dark:text-gray-400">Proyecto:</strong> <span className="text-gray-800 dark:text-gray-200">{plan.projectName}</span></div>
                  <div><strong className="text-gray-500 dark:text-gray-400">Identificador:</strong> <span className="font-mono bg-gray-200 dark:bg-gray-700 py-0.5 px-1.5 rounded text-gray-800 dark:text-gray-200">{plan.identifier}</span></div>
                  <div><strong className="text-gray-500 dark:text-gray-400">Historia de Usuario:</strong> <span className="text-gray-800 dark:text-gray-200">{plan.userStory}</span></div>
                  <div><strong className="text-gray-500 dark:text-gray-400">Analista QA:</strong> <span className="text-gray-800 dark:text-gray-200">{plan.qaAnalyst}</span></div>
                  <div className="md:col-span-2 mt-2">
                    <strong className="text-gray-500 dark:text-gray-400">Entorno y Datos de Prueba:</strong>
                    <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{plan.testEnvironmentAndData}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Casos de Prueba</h4>

                {hasDiffInfo && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400 mb-3 p-2 rounded-md bg-gray-100 dark:bg-gray-700/50">
                      <strong className="text-sm">Leyenda:</strong>
                      <span className="flex items-center gap-1.5"><NewIcon /> Nuevo</span>
                      <span className="flex items-center gap-1.5"><ModifiedIcon /> Modificado</span>
                      <span className="flex items-center gap-1.5"><DeletedIcon /> Eliminado</span>
                  </div>
                )}

                <div className="mt-4 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table className="w-full min-w-[600px] text-left border-collapse">
                    <thead className="bg-gray-100 dark:bg-gray-700/50">
                      <tr>
                        <th className="p-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 w-20 text-center">#</th>
                        <th className="p-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Caso de Prueba (Descripción)</th>
                        <th className="p-3 font-semibold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">Resultado Esperado</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {plan.testCases.map((tc, index) => {
                        const getRowClass = (status?: TestCase['changeStatus']) => {
                            switch (status) {
                                case 'new': return 'bg-green-50 dark:bg-green-900/30';
                                case 'modified': return 'bg-amber-50 dark:bg-amber-900/30';
                                case 'deleted': return 'bg-red-50 dark:bg-red-900/30';
                                default: return '';
                            }
                        };
                        const getRowTextStyle = (status?: TestCase['changeStatus']) => {
                           return status === 'deleted' ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300';
                        }

                        const statusIcon = (status?: TestCase['changeStatus']) => {
                            switch (status) {
                                case 'new': return <span title="Nuevo"><NewIcon /></span>;
                                case 'modified': return <span title="Modificado"><ModifiedIcon /></span>;
                                case 'deleted': return <span title="Eliminado"><DeletedIcon /></span>;
                                default: return <div className="w-4 h-4"></div>; // Placeholder for alignment
                            }
                        };
                        
                        return (
                        <tr key={`${tc.consecutive}-${tc.changeStatus || 'id'}-${index}`} className={`transition-colors duration-300 ${getRowClass(tc.changeStatus)} ${index === plan.testCases.length -1 ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}>
                          <td className={`p-3 text-center font-medium ${getRowTextStyle(tc.changeStatus)}`}>
                             <div className="flex items-center justify-center gap-2">
                                {statusIcon(tc.changeStatus)}
                                <span className="w-4">{tc.consecutive}</span>
                             </div>
                          </td>
                          <td className={`p-3 whitespace-pre-wrap ${getRowTextStyle(tc.changeStatus)}`}>{tc.description}</td>
                          <td className={`p-3 whitespace-pre-wrap ${getRowTextStyle(tc.changeStatus)}`}>{tc.expectedResult}</td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )})}
        </div>

        {selectedPlanForReport && (
            <QualityReportDisplay 
                plan={selectedPlanForReport}
                onClose={() => setSelectedPlanForReport(null)}
                onImprove={handleImproveClick}
                isImproving={improvingPlanId === selectedPlanForReport.identifier}
            />
        )}
    </div>
  );
};

export default TestPlanDisplay;
