import { GoogleGenAI, Type } from "@google/genai";
import type { TestPlan } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const testPlanSchema = {
  type: Type.OBJECT,
  properties: {
    identifier: {
      type: Type.STRING,
      description: "El identificador único para el plan de prueba, siguiendo el formato 'cp-hu-...' como se describe en el documento. Por ejemplo: cp-hu-nombrebreve-001.",
    },
    name: {
      type: Type.STRING,
      description: "El nombre completo del plan de prueba, que generalmente refleja el nombre de la historia de usuario.",
    },
    projectName: {
        type: Type.STRING,
        description: "El nombre del proyecto al que pertenece la historia de usuario. Por ejemplo: 'Plataforma de E-commerce'.",
    },
    userStory: {
      type: Type.STRING,
      description: "Un nombre o enlace simbólico para la historia de usuario asociada, por ejemplo, 'HU-01: Autenticación de Usuario'.",
    },
    qaAnalyst: {
      type: Type.STRING,
      description: "El nombre del analista de QA responsable.",
    },
    testEnvironmentAndData: {
      type: Type.STRING,
      description: "Descripción del entorno de prueba, precondiciones y datos necesarios. Por ejemplo: 'Entorno: UAT. Datos: Usuario 'test_admin@example.com' con rol 'Administrador'. Precondición: El proyecto 'X' debe existir.'",
    },
    testCases: {
      type: Type.ARRAY,
      description: "Una lista de los escenarios de prueba individuales.",
      items: {
        type: Type.OBJECT,
        properties: {
          consecutive: {
            type: Type.INTEGER,
            description: "Un número consecutivo para el caso de prueba, que indica el orden.",
          },
          description: {
            type: Type.STRING,
            description: "La descripción detallada del caso de prueba o escenario.",
          },
          expectedResult: {
            type: Type.STRING,
            description: "El resultado que se espera obtener después de ejecutar el caso de prueba.",
          },
        },
        required: ["consecutive", "description", "expectedResult"],
      },
    },
  },
  required: ["identifier", "name", "projectName", "userStory", "qaAnalyst", "testEnvironmentAndData", "testCases"],
};

const qualityReportSchema = {
    type: Type.OBJECT,
    properties: {
        functionalCoverage: { type: Type.NUMBER, description: "Puntaje de 0 a 100 para Cobertura Funcional." },
        semanticConsistency: { type: Type.NUMBER, description: "Puntaje de 0 a 100 para Consistencia Semántica." },
        structuralCompleteness: { type: Type.NUMBER, description: "Puntaje de 0 a 100 para Completitud Estructural." },
        huTestTraceability: { type: Type.NUMBER, description: "Puntaje de 0 a 100 para Trazabilidad HU-Prueba." },
        clarityOfExpectedResults: { type: Type.NUMBER, description: "Puntaje de 0 a 100 para Claridad de Resultados Esperados." },
    },
    required: ["functionalCoverage", "semanticConsistency", "structuralCompleteness", "huTestTraceability", "clarityOfExpectedResults"],
};

const generatedPlanWithReportSchema = {
    type: Type.OBJECT,
    properties: {
        plan: testPlanSchema,
        report: qualityReportSchema,
    },
    required: ["plan", "report"],
};

const multiTestPlanSchema = {
    type: Type.ARRAY,
    items: generatedPlanWithReportSchema,
};


export const generateTestPlan = async (userStoryText: string, qaAnalystName: string, projectName: string): Promise<TestPlan[]> => {
  try {
    const analyst = qaAnalystName.trim() || 'Analista QA Manual';
    const project = projectName.trim() || 'No especificado';
    
    const prompt = `
      Actúa como un Ingeniero de Garantía de Calidad (QA) senior. Tu tarea es analizar el siguiente texto, que puede contener una o varias historias de usuario (hasta un máximo de 25).

      --- TEXTO CON HISTORIAS DE USUARIO ---
      ${userStoryText}
      ---------------------------------------
      
      El proyecto para estas pruebas es: "${project}".
      El nombre del analista de QA para este plan de pruebas es: "${analyst}".

      Tu trabajo consiste en dos fases para CADA historia de usuario que identifiques:

      FASE 1: GENERACIÓN DEL PLAN DE PRUEBAS
      Genera un plan de pruebas completo y robusto para cada HU, siguiendo estos criterios:
      1.  Coherencia narrativa: Las pruebas deben responder directamente a los criterios de aceptación y descripciones funcionales de la HU.
      2.  Completitud estructural: Cubre flujos positivos, negativos, alternos y de error. Considera explícitamente los códigos de estado HTTP mencionados en la HU, como 502 (Bad Gateway), en los casos de error.
      3.  Trazabilidad: Correspondencia clara entre HU y pruebas.
      4.  Consistencia técnica: Uso correcto de parámetros, campos, etc., definidos en la HU.
      5.  Rendimiento: Si la HU implica operaciones que puedan verse afectadas por la carga (ej. listados, procesamientos masivos), incluye un caso de prueba de rendimiento básico que valide el comportamiento con una carga simulada (p. ej., >100 proyectos/elementos).
      
      El plan de pruebas debe contener:
      - **projectName** (debe ser "${project}"), **identifier**, **name**, **userStory**, **qaAnalyst** (debe ser "${analyst}"), **testEnvironmentAndData** (un campo que describa el entorno, los datos y las precondiciones necesarias), y un array de **testCases**.

      FASE 2: ANÁLISIS DE CALIDAD DEL PLAN GENERADO
      Después de generar cada plan, evalúa tu propio trabajo contra las siguientes métricas y asigna un puntaje numérico de 0 a 100 para cada una. Sé objetivo en tu evaluación.

      MÉTRICAS DE CALIDAD:
      1.  **functionalCoverage**: ¿Qué porcentaje de los criterios de aceptación explícitos e implícitos de la HU están cubiertos por los casos de prueba? (Umbral: ≥ 95%)
      2.  **semanticConsistency**: ¿Qué tan alineada está la terminología (variables, roles, acciones) en los casos de prueba con la usada en la HU? (Umbral: ≥ 90%)
      3.  **structuralCompleteness**: ¿Qué porcentaje de los flujos obvios (éxito, fallo, alternativos) se han cubierto? (Umbral: ≥ 85%)
      4.  **huTestTraceability**: ¿Cada caso de prueba se vincula claramente a una parte de la HU, sin casos redundantes o faltantes? (Umbral: 100%)
      5.  **clarityOfExpectedResults**: ¿Qué porcentaje de los resultados esperados son claros, específicos y verificables, sin ambigüedades? (Umbral: ≥ 95%)

      El resultado final debe ser únicamente un array de objetos JSON. Cada objeto en el array debe tener dos claves principales: "plan" (que contiene el plan de pruebas) y "report" (que contiene el objeto con los 5 puntajes de calidad). No incluyas explicaciones adicionales fuera del JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: multiTestPlanSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (!Array.isArray(parsedJson)) {
        throw new Error("La respuesta de la IA no es un array de planes de prueba válido.");
    }
    
    // Map the response to the TestPlan type
    const testPlans: TestPlan[] = parsedJson.map((item: any) => {
      if (!item.plan || !item.report) {
          throw new Error("Elemento de respuesta inválido: falta 'plan' o 'report'.");
      }
      return {
          ...item.plan,
          qualityReport: item.report,
      };
    });

    return testPlans;

  } catch (error) {
    console.error("Error generating test plan:", error);
    throw new Error("No se pudieron generar los casos de prueba. Por favor, revisa el documento o inténtalo de nuevo.");
  }
};

export const improveTestPlan = async (originalPlan: TestPlan, userStoryText: string): Promise<TestPlan> => {
    try {
        // Create a clean version of the plan to send to the API, without our internal 'changeStatus'
        const cleanOriginalPlan = {
            ...originalPlan,
            testCases: originalPlan.testCases.map(({ changeStatus, ...rest }) => rest)
        };

        const prompt = `
            Actúa como un Ingeniero de Garantía de Calidad (QA) senior experto en mejora continua.
            Se ha generado un plan de pruebas para una historia de usuario, pero su reporte de calidad indica que no cumple con todos los umbrales deseados.

            --- HISTORIA DE USUARIO ORIGINAL ---
            ${userStoryText}
            ------------------------------------

            --- PLAN DE PRUEBAS A MEJORAR (INCLUYE REPORTE DE CALIDAD DEFICIENTE) ---
            ${JSON.stringify(cleanOriginalPlan, null, 2)}
            --------------------------------------------------------------------------

            Tu tarea es analizar el plan de pruebas existente, identificar sus debilidades basándote en su propio reporte de calidad y en la historia de usuario, y generar una NUEVA Y MEJORADA versión del plan de pruebas. El nombre del analista QA y el nombre del proyecto deben permanecer sin cambios.

            OBJETIVOS DE MEJORA:
            1.  **Cerrar Brechas**: Añade, elimina o modifica casos de prueba para asegurar que todas las métricas de calidad (Cobertura Funcional, Consistencia Semántica, Completitud Estructural, Trazabilidad y Claridad) superen sus umbrales.
            2.  **Preservar lo Bueno**: Mantén los casos de prueba que ya son robustos y efectivos.
            3.  **Refinar Detalles**: Mejora la redacción de las descripciones y los resultados esperados. Asegúrate de incluir pruebas para códigos de error HTTP específicos como 502 (Bad Gateway) si es relevante, y un caso de rendimiento para cargas múltiples (>100 elementos) si la HU lo sugiere.
            4.  **Completar Información**: Asegúrate de que el campo "testEnvironmentAndData" esté completo, sea claro y útil para un QA.
            5.  **Re-evaluar Calidad**: Después de mejorar el plan, genera un NUEVO reporte de calidad que refleje los puntajes de la versión mejorada.

            El resultado final debe ser únicamente un objeto JSON con dos claves principales: "plan" (que contiene el plan de pruebas MEJORADO) y "report" (que contiene el NUEVO objeto con los 5 puntajes de calidad). No incluyas explicaciones adicionales fuera del JSON.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // Using a more powerful model for refinement
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: generatedPlanWithReportSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        if (!parsedJson.plan || !parsedJson.report) {
            throw new Error("Respuesta de mejora inválida: falta 'plan' o 'report'.");
        }

        const improvedPlan: TestPlan = {
            ...parsedJson.plan,
            qualityReport: parsedJson.report,
        };

        return improvedPlan;

    } catch (error) {
        console.error("Error improving test plan:", error);
        throw new Error("No se pudo mejorar el plan de pruebas. Por favor, inténtalo de nuevo.");
    }
};