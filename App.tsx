
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import TestPlanDisplay from './components/TestPlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { generateTestPlan, improveTestPlan } from './services/geminiService';
import type { TestPlan, AppStatus, TestCase } from './types';

// Extend the Window interface to include pdfjsLib
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

const diffTestPlans = (originalPlan: TestPlan, improvedPlan: TestPlan): TestPlan => {
    let availableOriginals = [...originalPlan.testCases];
    const finalCases: TestCase[] = [];
    const processedImprovedCasesIndices = new Set<number>();

    // --- Pass 1: Find UNCHANGED cases ---
    // An exact match on both trimmed description and trimmed expected result
    improvedPlan.testCases.forEach((iCase, iIndex) => {
        const matchIndex = availableOriginals.findIndex(oCase => 
            oCase.description.trim() === iCase.description.trim() && 
            oCase.expectedResult.trim() === iCase.expectedResult.trim()
        );

        if (matchIndex > -1) {
            finalCases.push({ ...iCase, changeStatus: 'unchanged' });
            processedImprovedCasesIndices.add(iIndex);
            // Remove from available originals so it's not matched again
            availableOriginals.splice(matchIndex, 1);
        }
    });

    // --- Pass 2: Find MODIFIED cases ---
    // A match on trimmed description only
    improvedPlan.testCases.forEach((iCase, iIndex) => {
        // Skip if already processed in pass 1
        if (processedImprovedCasesIndices.has(iIndex)) return;

        const matchIndex = availableOriginals.findIndex(oCase => 
            oCase.description.trim() === iCase.description.trim()
        );

        if (matchIndex > -1) {
            finalCases.push({ ...iCase, changeStatus: 'modified' });
            processedImprovedCasesIndices.add(iIndex);
            availableOriginals.splice(matchIndex, 1);
        }
    });
    
    // --- Pass 3: Find NEW cases ---
    // Any improved case not yet processed is new. This handles cases where the description was also modified.
    improvedPlan.testCases.forEach((iCase, iIndex) => {
        if (!processedImprovedCasesIndices.has(iIndex)) {
            finalCases.push({ ...iCase, changeStatus: 'new' });
        }
    });
    
    // --- Pass 4: Find DELETED cases ---
    // Any remaining original cases are deleted
    availableOriginals.forEach(oCase => {
        finalCases.push({ ...oCase, changeStatus: 'deleted' });
    });
    
    // --- Final Sort ---
    // Sort by consecutive number to maintain a logical order in the display.
    finalCases.sort((a, b) => a.consecutive - b.consecutive);

    return { ...improvedPlan, testCases: finalCases };
};


const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>('idle');
    const [testPlans, setTestPlans] = useState<TestPlan[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [pdfText, setPdfText] = useState<string | null>(null);
    const [projectName, setProjectName] = useState<string>('');
    const [qaAnalystName, setQaAnalystName] = useState<string>('');
    const [improvingPlanId, setImprovingPlanId] = useState<string | null>(null);
    const [justImprovedPlanId, setJustImprovedPlanId] = useState<string | null>(null);
    const mainRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (status === 'improving') {
            mainRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [status]);


    const resetState = () => {
        setStatus('idle');
        setTestPlans(null);
        setError(null);
        setFileName(null);
        setPdfText(null);
        setProjectName('');
        setQaAnalystName('');
        setImprovingPlanId(null);
        setJustImprovedPlanId(null);
    };

    const handleFileSelect = useCallback(async (files: FileList) => {
        if (!files || files.length === 0) return;

        resetState();
        setStatus('parsing');
        setFileName(Array.from(files).map(f => f.name).join(', '));

        try {
            const parsePromises = Array.from(files).map(file => {
                return new Promise<string>((resolve, reject) => {
                    const fileReader = new FileReader();
                    fileReader.onload = async (event) => {
                        if (!event.target?.result) {
                            return reject(new Error(`No se pudo leer el archivo: ${file.name}`));
                        }
                        try {
                            const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
                            const pdf = await window.pdfjsLib.getDocument(typedarray).promise;
                            let fileText = '';
                            for (let i = 1; i <= pdf.numPages; i++) {
                                const page = await pdf.getPage(i);
                                const textContent = await page.getTextContent();
                                fileText += textContent.items.map((item: any) => item.str).join(' ');
                                fileText += '\n'; // Add newline between pages
                            }
                            resolve(fileText);
                        } catch (err) {
                             reject(new Error(`Error al procesar ${file.name}: ${(err as Error).message}`));
                        }
                    };
                     fileReader.onerror = () => {
                        reject(new Error(`Error al leer el archivo: ${file.name}`));
                    };
                    fileReader.readAsArrayBuffer(file);
                });
            });
            
            const allTexts = await Promise.all(parsePromises);
            const combinedText = allTexts.join('\n\n--- SEPARADOR DE DOCUMENTO ---\n\n');

            setPdfText(combinedText); // Save combined PDF text for potential improvements

            if (combinedText.trim().length === 0) {
                setError('Los PDFs parecen estar vacíos o no contienen texto extraíble.');
                setStatus('error');
                return;
            }

            setStatus('generating');
            const generatedPlans = await generateTestPlan(combinedText, qaAnalystName, projectName);
            setTestPlans(generatedPlans);
            setStatus('success');

        } catch (err: any) {
            console.error("File Processing Error:", err);
            setError(err.message || 'Ocurrió un error al procesar los archivos. Inténtalo de nuevo.');
            setStatus('error');
        }
    }, [qaAnalystName, projectName]);

    const handleImprovePlan = useCallback(async (planToImprove: TestPlan) => {
        if (!pdfText || !testPlans) return;

        const planBeforeImprovement = testPlans.find(p => p.identifier === planToImprove.identifier);
        if (!planBeforeImprovement) {
            console.error("Could not find the plan to improve in the current state.");
            return;
        }

        setStatus('improving');
        setError(null);
        setImprovingPlanId(planToImprove.identifier);

        try {
            const improvedPlanRaw = await improveTestPlan(planBeforeImprovement, pdfText);
            
            const diffedPlan = diffTestPlans(planBeforeImprovement, improvedPlanRaw);
            
            setTestPlans(prevPlans => {
                if (!prevPlans) return [diffedPlan]; // Should not happen
                return prevPlans.map(plan => 
                    plan.identifier === planToImprove.identifier ? diffedPlan : plan
                );
            });

            setStatus('success');
            setJustImprovedPlanId(improvedPlanRaw.identifier);
            setTimeout(() => {
                setJustImprovedPlanId(null);
            }, 3000); // Highlight for 3 seconds

        } catch (err: any) {
            console.error("Improvement Error:", err);
            setError(err.message || 'Ocurrió un error al mejorar el plan.');
            setStatus('success'); // Revert to success to allow user to see results and retry
        } finally {
            setImprovingPlanId(null);
        }
    }, [pdfText, testPlans]);


    const renderContent = () => {
        switch (status) {
            case 'parsing':
                return <LoadingSpinner message="Extrayendo texto de los PDFs..." />;
            case 'generating':
                return <LoadingSpinner message="Generando planes de prueba con IA..." />;
            case 'improving':
                return <LoadingSpinner message="Mejorando el plan de pruebas con IA..." />;
            case 'error':
                return <ErrorMessage message={error || 'Ocurrió un error desconocido.'} onReset={resetState} />;
            case 'success':
                return testPlans ? (
                    <TestPlanDisplay 
                        plans={testPlans} 
                        fileName={fileName} 
                        onReset={resetState}
                        onImproveRequest={handleImprovePlan}
                        improvingPlanId={improvingPlanId}
                        justImprovedPlanId={justImprovedPlanId}
                    />
                ) : null;
            case 'idle':
            default:
                return (
                    <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">¡Bienvenido!</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Para comenzar, ingresa los detalles del proyecto y luego sube uno o más PDFs con historias de usuario.
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-gray-900 dark:text-gray-100">
            <Header />
            <main ref={mainRef} className="flex-grow container mx-auto px-4 py-8 flex flex-col justify-center">
                {status === 'idle' || status === 'error' ? (
                    <div className="mb-8 space-y-6">
                         <div className="w-full max-w-2xl mx-auto">
                            <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre del Proyecto (Opcional)
                            </label>
                            <input
                                type="text"
                                id="project-name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="Escribe el nombre del proyecto..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                disabled={status !== 'idle' && status !== 'error'}
                                aria-describedby="project-name-description"
                            />
                             <p id="project-name-description" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Este nombre se usará para contextualizar el plan de pruebas.
                            </p>
                        </div>
                        <div className="w-full max-w-2xl mx-auto">
                            <label htmlFor="qa-analyst-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre del Analista de QA (Opcional)
                            </label>
                            <input
                                type="text"
                                id="qa-analyst-name"
                                value={qaAnalystName}
                                onChange={(e) => setQaAnalystName(e.target.value)}
                                placeholder="Escribe tu nombre..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                disabled={status !== 'idle' && status !== 'error'}
                                aria-describedby="analyst-name-description"
                            />
                            <p id="analyst-name-description" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Si se deja en blanco, se usará "Analista QA Manual".
                            </p>
                        </div>
                        <FileUpload onFileSelect={handleFileSelect} disabled={status !== 'idle' && status !== 'error'} />
                    </div>
                ) : null}
                 {/* Show loading spinner on top of results when improving */}
                {status === 'improving' && testPlans && (
                    <div className="mb-8">
                        <LoadingSpinner message="Mejorando el plan de pruebas con IA..." />
                    </div>
                )}
                {/* Render main content, but hide TestPlanDisplay if improving */}
                {status !== 'improving' && renderContent()}
                {status === 'improving' && testPlans && (
                     <TestPlanDisplay 
                        plans={testPlans} 
                        fileName={fileName} 
                        onReset={resetState}
                        onImproveRequest={handleImprovePlan}
                        improvingPlanId={improvingPlanId}
                        justImprovedPlanId={justImprovedPlanId}
                    />
                )}
            </main>
            <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
              Ministerio de Ambiente y Desarrollo Sostenible - Oficina TIC © 2025
            </footer>
        </div>
    );
};

export default App;
