import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please configure it in Vercel environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: "vercel", time: new Date().toISOString() });
});

// Deep Corporate Research with Google Search Grounding
app.post("/api/research", async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "El nombre de la empresa es obligatorio." });
    }

    const ai = getGeminiClient();
    
    const prompt = `Eres un Consultor Senior de Estrategia de Marca y Análisis de Mercado Corporativo. Realiza una investigación profunda y en tiempo real de la empresa: "${companyName}".
    
    Tu informe debe estructurarse obligatoriamente de la siguiente manera usando títulos claros en Markdown:
    
    # Informe de Investigación: ${companyName}
    
    ## 1. Perfil Corporativo y Modelo de Negocio
    Describe la historia resumida, propuesta de valor fundamental, mercados geográficos clave, y de qué forma generan ingresos (ej: B2B, B2C, suscripciones, etc.).
    
    ## 2. Análisis Crítico de la Identidad Visual y Logotipo
    Describe detalladamente el logotipo actual conocido de la empresa (sus colores, formas, tipografía si es conocida, y el mensaje conceptual que el diseño transmite). Evalúa objetivamente las fortalezas y debilidades de este logotipo de cara a la audiencia actual de 2026.
    
    ## 3. Propuesta de Optimización de UI/UX y Rediseño de Logo
    Propón una estrategia detallada para mejorar la estética visual y experiencia digital (UI/UX) de esta empresa:
    - **Estrategia Core para el Logo**: ¿Qué elementos deben modernizarse, simplificarse o reemplazarse?
    - **Paleta de Colores Recomendada**: Sugiere 3-4 códigos de color hexadecimales específicos acompañados del porqué de su elección corporativa.
    - **Tipografías Recomendadas**: Nombra tipografías modernas sugeridas (como Inter, Space Grotesk, Cabinet Grotesque, o JetBrains Mono para datos técnicos).
    - **Pautas de UI/UX**: Qué mejoras interactivas se recomiendan aplicar en su landing page o e-commerce.
    
    ## 4. Presencia Digital e Innovación de E-commerce
    Analiza cómo es su comercialización en la web actual. ¿Cuenta con una experiencia fluida? ¿Hay margen para digitalizar más servicios (ej. pasarelas de pago, integraciones inteligentes, etc.)?
    
    Utiliza el motor de Google Search para basarte en hechos reales, evitar alucinaciones, y encontrar datos fidedignos y de actualidad.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const reportText = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    const sources = groundingChunks.map((chunk: any) => {
      if (chunk.web) {
        return {
          title: chunk.web.title || "Fuente de Google Search",
          url: chunk.web.uri,
        };
      }
      return null;
    }).filter(Boolean);

    res.json({
      report: reportText,
      sources: sources,
    });
  } catch (error: any) {
    console.error("Error in /api/research:", error);
    res.status(500).json({ error: error.message || "Error interno al procesar la investigación." });
  }
});

// Automatically draft standard fields for a new company via Structured Gemini Call
app.post("/api/generateCompanyDraft", async (req, res) => {
  try {
    const { companyName } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "El nombre de la empresa es obligatorio." });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Investiga a través de la web actual los datos clave reales de la empresa "${companyName}". Completa todos los campos obligatorios del esquema con información exacta. Si la empresa no existe o no tiene presencia conocida, rellena con estimaciones lógicas basadas en su nombre comercial.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre correcto de la empresa" },
            sector: { type: Type.STRING, description: "Sector industrial principal en español (ej: Alimentación y Bebidas, Automoción, Logística, Editorial, Vending, Tecnología, etc.)" },
            ecommerce: { type: Type.STRING, description: "Indica 'Sí' o 'No' basado en si disponen de tienda online o e-commerce directo." },
            model: { type: Type.STRING, description: "El modelo de ingresos y ventas principal: B2B, B2C, o B2B y B2C." },
            website: { type: Type.STRING, description: "Sitio web corporativo oficial sin prefijo de protocolo" },
            phone: { type: Type.STRING, description: "Número de teléfono de contacto de su sede." },
            email: { type: Type.STRING, description: "Dirección de correo electrónico de soporte u oficinas" },
            linkedin: { type: Type.STRING, description: "Enlace representativo de LinkedIn corporativo" },
            inSpain: { type: Type.BOOLEAN, description: "true si opera o tiene sede física en España, de lo contrario false" },
            flagCode: { type: Type.STRING, description: "Código de país de dos letras ISO" },
            brandColor: { type: Type.STRING, description: "Color hexadecimal corporativo principal, incluyendo #" },
            summary: { type: Type.STRING, description: "Breve resumen de 2 oraciones en español que defina la actividad de la empresa." },
            logoIconName: { type: Type.STRING, description: "Nombre de icono representativo de Lucide-React" },
          },
          required: [
            "name",
            "sector",
            "ecommerce",
            "model",
            "website",
            "phone",
            "email",
            "linkedin",
            "inSpain",
            "flagCode",
            "brandColor",
            "summary",
            "logoIconName"
          ],
        },
      },
    });

    try {
      const draftData = JSON.parse(response.text.trim());
      res.json(draftData);
    } catch (parseErr) {
      console.error("Failed to parse JSON response from Gemini:", response.text);
      res.status(500).json({ error: "El modelo no devolvió un formato JSON válido.", rawResponse: response.text });
    }
  } catch (error: any) {
    console.error("Error in /api/generateCompanyDraft:", error);
    res.status(500).json({ error: error.message || "Error interno al generar la ficha técnica." });
  }
});

export default app;
