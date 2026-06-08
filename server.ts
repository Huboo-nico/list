import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent startup failures if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please configure it in Settings > Secrets.");
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

// Ensure the dev server binds correctly and exposes API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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

    // Map chunks to simple source interface for the client
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
            name: { type: Type.STRING, description: "Nombre correcto de la empresa (ej: Campo Mundo Healthy -> Campo Mundo Healthy)" },
            sector: { type: Type.STRING, description: "Sector industrial principal en español (ej: Alimentación y Bebidas, Automoción, Logística, Editorial, Vending, Tecnología, etc.)" },
            ecommerce: { type: Type.STRING, description: "Indica 'Sí' o 'No' basado en si disponen de tienda online o e-commerce directo." },
            model: { type: Type.STRING, description: "El modelo de ingresos y ventas principal: debe ser uno de 'B2B', 'B2C' o 'B2B y B2C'." },
            website: { type: Type.STRING, description: "Sitio web corporativo oficial (ej. sgel.es, sin prefijo https)" },
            phone: { type: Type.STRING, description: "Número de teléfono de contacto o atención al cliente oficial / estimado de su sede en España." },
            email: { type: Type.STRING, description: "Dirección de correo electrónico de soporte u oficinas (ej. info@nombre.com o similar)" },
            linkedin: { type: Type.STRING, description: "Enlace real o representativo de LinkedIn de la empresa (ej: linkedin.com/company/mercadona)" },
            inSpain: { type: Type.BOOLEAN, description: "true si la empresa opera o tiene sede física en España, de lo contrario false" },
            flagCode: { type: Type.STRING, description: "Código de país de dos letras ISO donde tiene su sede principal (ej. ES, NL, DE, GB, US)" },
            brandColor: { type: Type.STRING, description: "El color hexadecimal corporativo principal real o más adecuado para su branding, incluyendo # (ej. #E3000F)" },
            summary: { type: Type.STRING, description: "Breve resumen de 2 oraciones en español que defina la actividad e importancia comercial de la empresa." },
            logoIconName: { type: Type.STRING, description: "Un nombre de icono representativo de Lucide-React en inglés (ejemplo: 'coffee' para JDE, 'book-open' para una editorial, 'wine' para vino, 'wrench' para reparación, 'truck' para entregas, 'credit-card' para finanzas, 'shopping-bag' para compras, etc.)" },
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

// Configure Vite as middleware in development or serve built files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server listening at http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
