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
    const { companyName, lang } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "El nombre de la empresa es obligatorio." });
    }

    const ai = getGeminiClient();
    const isEn = lang === "EN";
    
    const prompt = isEn
      ? `You are a Senior Brand Strategy & Corporate Market Analysis Consultant. Perform deep, real-time research with web-grounding on the following company: "${companyName}".
    
    You must structure your report exactly as follows using clear Markdown headings:
    
    # Research Report: ${companyName}
    
    ## 1. Corporate Profile & Business Model
    Describe the company history brief, core value proposition, key geographical markets, and how they generate revenue (e.g., B2B, B2C, subscriptions, etc.).
    
    ## 2. Critical Analysis of Visual Identity & Logo
    Describe in detail the current known logo of this company (its colors, shapes, typography if known, and the conceptual message behind the design). Objectively evaluate the strengths and weaknesses of this branding for the modern 2026 audience.
    
    ## 3. UI/UX Optimization and Logo Redesign Proposal
    Propose a concrete strategy to improve the visual aesthetics & digital experience (UI/UX) of this enterprise:
    - **Logo Core Strategy**: Which components should be modernized, simplified, or replaced?
    - **Recommended Color Palette**: Suggest 3-4 specific hex codes accompanied by reasons for their selection.
    - **Recommended Typography**: Name modern typography choices (such as Inter, Space Grotesk, Cabinet Grotesque, or JetBrains Mono for tech stats).
    - **UI/UX Guidelines**: Which interactive enhancements should be applied to their landing page or e-commerce shop.
    
    ## 4. Digital Presence & E-commerce Innovation
    Analyze their web commercialization. Is it a modern, seamless digital experience? Is there room to digitize more services (e.g. payment gateway integrations, smart modules, etc.)?
    
    Utilize Google Search grounding to base the analysis on current 2026 facts, avoid hallucinations, and gather real credentials.`
      : `Eres un Consultor Senior de Estrategia de Marca y Análisis de Mercado Corporativo. Realiza una investigación profunda y en tiempo real de la empresa: "${companyName}".
    
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
          title: chunk.web.title || (isEn ? "Google Search Source" : "Fuente de Google Search"),
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
    const { companyName, lang } = req.body;
    if (!companyName) {
      return res.status(400).json({ error: "El nombre de la empresa es obligatorio." });
    }

    const ai = getGeminiClient();
    const isEn = lang === "EN";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: isEn
        ? `Research the actual key details of "${companyName}" from the live web. Fill each required field of the schema accurately with EN language representation. If the company is not famous, provide logical estimations based on its name and branding style.`
        : `Investiga a través de la web actual los datos clave reales de la empresa "${companyName}". Completa todos los campos obligatorios del esquema con información exacta. Si la empresa no existe o no tiene presencia conocida, rellena con estimaciones lógicas basadas en su nombre comercial.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: isEn ? "Correct spelling of company name" : "Nombre correcto de la empresa" },
            sector: { type: Type.STRING, description: isEn ? "Primary industry sector in English (e.g. Food & Beverages, Automotive, Logistics, Publishing, Healthcare, SaaS, Technology, Retail)" : "Sector industrial principal en español (ej: Alimentación y Bebidas, Automoción, Logística, Editorial, Vending, Tecnología, etc.)" },
            ecommerce: { type: Type.STRING, description: isEn ? "Indicate 'Yes' or 'No' based on whether they have a live direct online shop or client e-commerce portal" : "Indica 'Sí' o 'No' basado en si disponen de tienda online o e-commerce directo." },
            model: { type: Type.STRING, description: isEn ? "The primary sales model: B2B, B2C, or B2B & B2C" : "El modelo de ingresos y ventas principal: B2B, B2C, o B2B y B2C." },
            website: { type: Type.STRING, description: "Official corporate website domain without protocol prefix" },
            phone: { type: Type.STRING, description: "Contact phone number of headquarters" },
            email: { type: Type.STRING, description: "General/support business email address" },
            linkedin: { type: Type.STRING, description: "Representative company LinkedIn handle/URL" },
            inSpain: { type: Type.BOOLEAN, description: isEn ? "true if they operate or have branches/assets in Spain, otherwise false" : "true si opera o tiene sede física en España, de lo contrario false" },
            flagCode: { type: Type.STRING, description: "Two-letter ISO country code of headquarters" },
            brandColor: { type: Type.STRING, description: "Primary hex color code, including #" },
            summary: { type: Type.STRING, description: isEn ? "Quick 2-sentence summary in English defining their business activity." : "Breve resumen de 2 oraciones en español que defina la actividad de la empresa." },
            logoIconName: { type: Type.STRING, description: "Name of representative icon from Lucide-React (e.g., coffee, book-open, cup-soda, wrench, grape, glass-water, graduation-cap, truck, credit-card, heart, gift, building)" },
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
