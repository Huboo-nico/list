import { useState, useEffect } from "react";
import {
  Coffee,
  BookOpen,
  CupSoda,
  Wrench,
  Grape,
  GlassWater,
  GraduationCap,
  Truck,
  CreditCard,
  Heart,
  Languages,
  Gift,
  Building,
  Search,
  Filter,
  Plus,
  Loader2,
  Sparkles,
  Globe,
  Building2,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  FileText,
  X,
  ChevronRight,
  Trash2,
  AlertCircle,
  Check,
  CheckCircle,
  Printer,
  Compass,
  ArrowRight,
  Download,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Company, ResearchReport } from "./types";
import { INITIAL_COMPANIES } from "./data";
import Markdown from "react-markdown";

// Mapping icons for runtime dynamic rendering
const IconMap: { [key: string]: any } = {
  coffee: Coffee,
  "book-open": BookOpen,
  "cup-soda": CupSoda,
  wrench: Wrench,
  grape: Grape,
  "glass-water": GlassWater,
  "graduation-cap": GraduationCap,
  truck: Truck,
  "credit-card": CreditCard,
  heart: Heart,
  languages: Languages,
  gift: Gift,
  building: Building,
};

function getLogoIcon(name: string) {
  return IconMap[name] || Building2;
}

export default function App() {
  // Persistence state in localStorage
  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem("research_companies");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved companies", e);
      }
    }
    return INITIAL_COMPANIES;
  });

  // Selected filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<"ALL" | "ES" | "NL" | "OTHER">("ALL");
  const [selectedModel, setSelectedModel] = useState<"ALL" | "B2B" | "B2C" | "BOTH">("ALL");
  const [selectedEcommerce, setSelectedEcommerce] = useState<"ALL" | "Sí" | "No">("ALL");

  // Active drawer states
  const [activeResearchReport, setActiveResearchReport] = useState<ResearchReport | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchCompanyId, setResearchCompanyId] = useState<string | null>(null);

  // Active side panel details
  const [selectedCompanyDetail, setSelectedCompanyDetail] = useState<Company | null>(null);

  // Modal create/edit company state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isCompletingDraft, setIsCompletingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Company Form fields
  const [formSector, setFormSector] = useState("");
  const [formEcommerce, setFormEcommerce] = useState<"Sí" | "No">("Sí");
  const [formModel, setFormModel] = useState<"B2B" | "B2C" | "B2B y C">("B2B");
  const [formWebsite, setFormWebsite] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formLinkedin, setFormLinkedin] = useState("");
  const [formInSpain, setFormInSpain] = useState(true);
  const [formFlagCode, setFormFlagCode] = useState("ES");
  const [formBrandColor, setFormBrandColor] = useState("#0056b3");
  const [formSummary, setFormSummary] = useState("");
  const [formLogoName, setFormLogoName] = useState("building");
  const [formNote, setFormNote] = useState("");


  
  // Save to persistence
  useEffect(() => {
    localStorage.setItem("research_companies", JSON.stringify(companies));
  }, [companies]);

  // Clean form
  const resetForm = () => {
    setDraftName("");
    setFormSector("");
    setFormEcommerce("Sí");
    setFormModel("B2B");
    setFormWebsite("");
    setFormPhone("");
    setFormEmail("");
    setFormLinkedin("");
    setFormInSpain(true);
    setFormFlagCode("ES");
    setFormBrandColor("#0056b3");
    setFormSummary("");
    setFormLogoName("building");
    setFormNote("");
    setDraftError(null);
  };

  // Generate intelligent mock/seed with AI
  const handleAiAutoFill = async () => {
    if (!draftName.trim()) {
      setDraftError("Por favor, ingresa el nombre de la empresa antes de autocompletar.");
      return;
    }
    setIsCompletingDraft(true);
    setDraftError(null);

    try {
      const response = await fetch("/api/generateCompanyDraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: draftName })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error al conectar con el servidor.");
      }

      const data = await response.json();
      
      // Auto-fill state
      if (data.name) setDraftName(data.name);
      if (data.sector) setFormSector(data.sector);
      if (data.ecommerce) setFormEcommerce(data.ecommerce === "Sí" ? "Sí" : "No");
      
      // Handle model name parsing
      if (data.model) {
        if (data.model.includes("y") || data.model.includes("and") || data.model.includes("BOTH")) {
          setFormModel("B2B y C");
        } else {
          setFormModel(data.model.toUpperCase() === "B2C" ? "B2C" : "B2B");
        }
      }
      
      if (data.website) setFormWebsite(data.website);
      if (data.phone) setFormPhone(data.phone);
      if (data.email) setFormEmail(data.email);
      if (data.linkedin) setFormLinkedin(data.linkedin);
      if (data.inSpain !== undefined) setFormInSpain(data.inSpain);
      if (data.flagCode) setFormFlagCode(data.flagCode.toUpperCase());
      if (data.brandColor) setFormBrandColor(data.brandColor);
      if (data.summary) setFormSummary(data.summary);
      if (data.logoIconName) setFormLogoName(data.logoIconName);
      if (data.note) setFormNote(data.note);

    } catch (err: any) {
      console.error(err);
      setDraftError(`No se pudo autocompletar: ${err.message}. Puedes rellenarlo manualmente.`);
    } finally {
      setIsCompletingDraft(false);
    }
  };

  // Submit Company Creation Form
  const handleSubmitCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim() || !formSector.trim()) {
      setDraftError("El nombre y el sector son campos obligatorios.");
      return;
    }

    const compiledModel = formModel === "B2B y C" ? "B2B y B2C" : formModel;

    const newCompany: Company = {
      id: "company_" + Date.now(),
      name: draftName,
      sector: formSector,
      ecommerce: formEcommerce,
      model: compiledModel as "B2B" | "B2C" | "B2B y B2C",
      website: formWebsite || "web.info",
      phone: formPhone || "No especificado",
      email: formEmail || "contacto@dominio.com",
      linkedin: formLinkedin || "linkedin.com",
      inSpain: formInSpain,
      flagCode: formFlagCode.toUpperCase() || "ES",
      brandColor: formBrandColor || "#374151",
      summary: formSummary || "Ficha técnica agregada recientemente por el analista.",
      logoIconName: formLogoName || "building",
      note: formNote ? formNote : undefined
    };

    setCompanies((prev) => [newCompany, ...prev]);
    setIsCreateModalOpen(false);
    resetForm();
  };

  // Delete a company
  const handleDeleteCompany = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("¿Estás seguro de que deseas eliminar esta empresa de tu lista de análisis?")) {
      setCompanies((prev) => prev.filter((c) => c.id !== id));
      if (selectedCompanyDetail?.id === id) {
        setSelectedCompanyDetail(null);
      }
    }
  };

  // Execute Gemini Search Grounding Research on the server
  const handlePerformResearch = async (company: Company) => {
    setIsResearching(true);
    setResearchError(null);
    setResearchCompanyId(company.id);
    setActiveResearchReport(null);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: company.name }),
      });

      if (!response.ok) {
        const errPayload = await response.json();
        throw new Error(errPayload.error || "Fallo en la comunicación con el servidor Gemini.");
      }

      const data = await response.json();
      
      const report: ResearchReport = {
        companyId: company.id,
        companyName: company.name,
        report: data.report,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })
      };

      setActiveResearchReport(report);
    } catch (err: any) {
      console.error(err);
      setResearchError(`Error al investigar sobre ${company.name}: ${err.message}`);
    } finally {
      setIsResearching(false);
    }
  };

  // Filter actions
  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.website.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry =
      selectedCountry === "ALL" ||
      (selectedCountry === "ES" && company.flagCode === "ES") ||
      (selectedCountry === "NL" && company.flagCode === "NL") ||
      (selectedCountry === "OTHER" && company.flagCode !== "ES" && company.flagCode !== "NL");

    const matchesModel =
      selectedModel === "ALL" ||
      (selectedModel === "B2B" && company.model === "B2B") ||
      (selectedModel === "B2C" && company.model === "B2C") ||
      (selectedModel === "BOTH" && company.model === "B2B y B2C");

    const matchesEcommerce =
      selectedEcommerce === "ALL" || company.ecommerce === selectedEcommerce;

    return matchesSearch && matchesCountry && matchesModel && matchesEcommerce;
  });

  // Calculate stats for widgets
  const statsTotal = companies.length;
  const statsSpain = companies.filter((c) => c.flagCode === "ES").length;
  const statsEcommerce = companies.filter((c) => c.ecommerce === "Sí").length;
  const statsB2B = companies.filter((c) => c.model.includes("B2B")).length;

  return (
    <div id="appRoot" className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      
      {/* Top Professional Banner Bar */}
      <div className="bg-slate-900 py-3 px-6 border-b-2 border-slate-900 text-center text-xs text-slate-300 font-mono flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900"></span>
          <span className="font-bold uppercase tracking-wider">Workspace de Analista: Activo</span>
        </div>
        <div className="hidden sm:block">
          <span className="uppercase tracking-widest text-[10px] bg-slate-800 text-slate-300 px-2 py-1 border border-slate-700 font-bold">Localizador de Objetivos • 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Investigación Grounded</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Main Header */}
        <header className="mb-10 bg-white border-3 border-slate-900 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-indigo-600 font-mono text-xs font-black uppercase tracking-wider mb-2">
              <Compass className="w-4 h-4 animate-spin-slow" />
              <span>Plataforma de Inteligencia Corporativa • Real-Time 2026</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
              Research<span className="text-indigo-600">Lab</span> Base
            </h1>
            <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed">
              Análisis dinámico de mercado e investigación profunda de competidores de marcas. Descubre, clasifica e investiga marcas en tiempo real mediante el motor de búsqueda estructurado con soporte de IA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 self-start md:self-center shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 border-2 border-slate-900 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Agregar Empresa
            </button>
            <button
              onClick={() => {
                if (confirm("¿Deseas restablecer la base de datos a su estado inicial de 13 empresas?")) {
                  setCompanies(INITIAL_COMPANIES);
                  localStorage.removeItem("research_companies");
                }
              }}
              className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 px-5 py-3 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
            >
              Restablecer Base
            </button>
          </div>
        </header>

        {/* Dashboard Analytics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          
          <div className="bg-white border-2 border-slate-900 p-5 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Total Analizadas</span>
            <div className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
              {statsTotal.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-indigo-600 font-bold uppercase mt-1">Empresas en catálogo</div>
          </div>

          <div className="bg-white border-2 border-slate-900 p-5 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Presencia en España</span>
            <div className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
              {statsSpain.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-emerald-600 font-bold uppercase mt-1">Sedes físicas activas</div>
          </div>

          <div className="bg-white border-2 border-slate-900 p-5 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Presencia E-commerce</span>
            <div className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
              {statsTotal > 0 ? `${Math.round((statsEcommerce / statsTotal) * 100)}%` : "0%"}
            </div>
            <div className="text-xs text-amber-600 font-bold uppercase mt-1">{statsEcommerce} con canal online</div>
          </div>

          <div className="bg-white border-2 border-slate-900 p-5 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider block">Modelo de Ventas B2B</span>
            <div className="text-4xl font-black mt-1 text-slate-900 tracking-tighter">
              {statsTotal > 0 ? `${Math.round((statsB2B / statsTotal) * 100)}%` : "0%"}
            </div>
            <div className="text-xs text-purple-600 font-bold uppercase mt-1">{statsB2B} empresas con canal B2B</div>
          </div>

        </div>

        {/* Dynamic Interactive Filter Workspace */}
        <section className="bg-white border-2 border-slate-900 p-6 mb-8 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-2 text-xs text-slate-900 font-black uppercase tracking-wider mb-5 pb-2 border-b-2 border-slate-100">
            <Filter className="w-4 h-4 text-indigo-600 stroke-[3px]" />
            <span>Filtros Estratégicos & Búsqueda</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Search inputs */}
            <div className="lg:col-span-1 relative">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Búsqueda Inteligente</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, sector, web..."
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-4 py-2.5 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-0 transition"
                />
                <Search className="w-4 h-4 text-slate-900 absolute left-3.5 top-3.5 stroke-[2.5px]" />
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Regiones / Países</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "Todos" },
                  { id: "ES", label: "🇪🇸 España" },
                  { id: "NL", label: "🇳🇱 Países Bajos" },
                  { id: "OTHER", label: "Otros" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedCountry(item.id as any)}
                    className={`px-3 py-1.5 border-2 border-slate-900 text-xs font-black uppercase transition cursor-pointer ${
                      selectedCountry === item.id
                        ? "bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-50 text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Model Selector */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Modelo de Negocio</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "Todos" },
                  { id: "B2B", label: "B2B" },
                  { id: "B2C", label: "B2C" },
                  { id: "BOTH", label: "Híbrido" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedModel(item.id as any)}
                    className={`px-3 py-1.5 border-2 border-slate-900 text-xs font-black uppercase transition cursor-pointer ${
                      selectedModel === item.id
                        ? "bg-slate-900 text-white"
                        : "bg-white hover:bg-slate-50 text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* E-commerce support */}
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Canal E-commerce</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "ALL", label: "Todos" },
                  { id: "Sí", label: "Sí vende" },
                  { id: "No", label: "No vende" }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEcommerce(item.id as any)}
                    className={`px-3 py-1.5 border-2 border-slate-900 text-xs font-black uppercase transition cursor-pointer ${
                      selectedEcommerce === item.id
                        ? "bg-amber-400 text-slate-900 animate-none"
                        : "bg-white hover:bg-slate-50 text-slate-900"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Clear indicators */}
          {(searchTerm !== "" || selectedCountry !== "ALL" || selectedModel !== "ALL" || selectedEcommerce !== "ALL") && (
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">
                Filtrado mostrando <strong className="text-slate-900 font-extrabold">{filteredCompanies.length}</strong> de <strong className="text-slate-900 font-extrabold">{companies.length}</strong> empresas.
              </span>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCountry("ALL");
                  setSelectedModel("ALL");
                  setSelectedEcommerce("ALL");
                }}
                className="text-indigo-600 hover:text-indigo-800 underline font-black uppercase tracking-wider cursor-pointer"
              >
                Limpiar todos los filtros
              </button>
            </div>
          )}
        </section>

        {/* Main Workspace Frame */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Grid column covering 3 positions for companies lists */}
          <main className="xl:col-span-3">
            
            {filteredCompanies.length === 0 ? (
              <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-12 text-center">
                <AlertCircle className="w-10 h-10 text-[#4B5563] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Sin Resultados encontrados</h3>
                <p className="text-[#94A3B8] text-sm max-w-md mx-auto">
                  Ninguna empresa en la base de datos coincide con los criterios de búsqueda o filtros seleccionados en este momento.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCountry("ALL");
                    setSelectedModel("ALL");
                    setSelectedEcommerce("ALL");
                  }}
                  className="mt-4 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 font-medium text-xs px-4 py-2 rounded-lg transition"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <AnimatePresence mode="popLayout">
                  {filteredCompanies.map((company, index) => {
                    const CardIcon = getLogoIcon(company.logoIconName);
                    const flagEmoji = company.flagCode === "ES" ? "🇪🇸" : company.flagCode === "NL" ? "🇳🇱" : company.flagCode === "DE" ? "🇩🇪" : "🌐";

                    return (
                      <motion.div
                        key={company.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
                        className="bg-white border-2 border-slate-900 p-5 relative flex flex-col justify-between group shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150"
                        style={{ borderTopColor: company.brandColor, borderTopWidth: '8px' }}
                      >
                        <div>
                          {/* Header of the Card */}
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex items-center gap-3">
                              {/* Custom designed brand visual element representation */}
                              <div 
                                className="w-12 h-12 flex items-center justify-center border-2 border-slate-900 flex-shrink-0"
                                style={{ 
                                  backgroundColor: company.brandColor,
                                }}
                              >
                                <CardIcon className="w-5 h-5 text-white" />
                              </div>
                              
                              <div>
                                <h3 className="font-black text-slate-900 uppercase tracking-tight line-clamp-1 leading-tight text-lg group-hover:text-indigo-650 transition-colors">
                                  {company.name}
                                </h3>
                                <div className="text-xs text-slate-500 font-extrabold uppercase italic tracking-wide mt-0.5">
                                  {company.sector}
                                </div>
                              </div>
                            </div>

                            <span className="bg-slate-100 text-slate-900 border border-slate-900 text-[10px] font-black px-2 py-1 rounded-none flex items-center gap-1 shrink-0">
                              <span>{flagEmoji}</span>
                              <span className="text-[10px] uppercase font-bold">{company.flagCode}</span>
                            </span>
                          </div>

                          {/* Summary text */}
                          <p className="text-xs text-slate-500 font-medium leading-snug mb-4 line-clamp-2">
                            {company.summary}
                          </p>

                          {/* Technical attributes list */}
                          <div className="space-y-2 border-t pt-4 border-slate-100 text-xs mb-4">
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Canal E-commerce:</span>
                              <span className="font-black text-slate-900 uppercase">{company.ecommerce}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Modelo Ventas:</span>
                              <span className="font-black text-slate-900 uppercase">{company.model}</span>
                            </div>
                          </div>

                          {/* Contact quick actions inline layout list */}
                          <div className="flex flex-wrap items-center gap-1.5 py-3 border-t border-slate-100 mb-4 text-xs font-mono">
                            <a 
                              href={`https://${company.website}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-slate-700 bg-slate-50 border border-slate-900 px-2 py-1 flex items-center gap-1 hover:bg-slate-100 transition-all font-semibold"
                            >
                              <Globe className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{company.website}</span>
                            </a>
                            <div className="h-4 w-[1px] bg-slate-250"></div>
                            <span 
                              title={`Llamar al ${company.phone}`}
                              className="text-slate-700 hover:text-slate-950 p-1 border border-transparent hover:border-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </span>
                            <span 
                              title={`Enviar email a ${company.email}`}
                              className="text-slate-700 hover:text-slate-950 p-1 border border-transparent hover:border-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                            <a 
                              href={`https://${company.linkedin}`} 
                              target="_blank" 
                              rel="noreferrer"
                              title="Ver LinkedIn"
                              className="text-slate-700 hover:text-slate-950 p-1 border border-transparent hover:border-slate-900 bg-slate-50 hover:bg-slate-100 transition"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Disclaimers if present */}
                          {company.note && (
                            <div className="text-[10px] uppercase font-black text-red-700 bg-red-50 border border-red-900 p-2.5 mb-4 flex items-start gap-1">
                              <Info className="w-3.5 h-3.5 shrink-0 text-red-700 mt-0.5" />
                              <span>{company.note}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions block footer */}
                        <div className="flex gap-2 pt-3 border-t border-slate-150">
                          <button
                            onClick={() => handlePerformResearch(company)}
                            disabled={isResearching}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white text-xs font-black uppercase tracking-wider py-2.5 px-3 transition cursor-pointer text-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                            <span>Investigar IA</span>
                          </button>
                          
                          <button
                            onClick={() => setSelectedCompanyDetail(company)}
                            className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-black uppercase py-2.5 px-3.5 transition flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            title="Ver Ficha Completa"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteCompany(company.id, e)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-900 p-2.5 transition shrink-0 cursor-pointer"
                            title="Eliminar Empresa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>

              </div>
            )}

          </main>

          {/* Sidebar Area covering 1 position on Desktop for contextual widgets */}
          <aside className="space-y-6">
            
            {/* AI Assistant Insight Banner */}
            <div className="bg-white border-2 border-slate-900 p-5 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-650" />
                <span>¿Cómo funciona el Research?</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                Selecciona cualquier empresa y haz clic en <strong>Investigar IA</strong>. Nuestro backend llamará de forma segura a Gemini en tiempo real realizando búsquedas automáticas vía Google para:
              </p>
              <ul className="text-xs text-slate-600 font-black list-disc list-inside space-y-1 mb-2">
                <li>Analizar su logotipo real conocido.</li>
                <li>Proponer un rediseño moderno (UI/UX).</li>
                <li>Evaluar su viabilidad digital.</li>
              </ul>
              <div className="text-[10px] text-indigo-600 font-mono font-black mt-3 p-2 bg-slate-50 rounded-none border border-slate-900">
                ⚡ Grounding: Google Search 2026
              </div>
            </div>


            {/* Global Actions */}
            <div className="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Sesión de Análisis</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(companies, null, 2));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", "corporate-research-database-2026.json");
                    dlAnchorElem.click();
                  }}
                  className="w-full bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-black uppercase tracking-wider py-2.5 px-3 rounded-none transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Exportar DB a JSON</span>
                </button>
                <div className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider mt-2">
                  Los datos se guardan localmente.
                </div>
              </div>
            </div>

          </aside>

        </div>

      </div>

      {/* RENDER MODAL: Adding Custom Company & Smart AI Draft Generator */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-2 border-slate-900 rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-6"
          >
            <div className="flex justify-between items-center pb-4 border-b-2 border-slate-200 mb-6">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-650 stroke-[2.5px]" />
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Agregar Nueva Empresa</h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-900 p-1 border border-transparent hover:border-slate-900 hover:bg-slate-50 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart drafting panel */}
            <div className="bg-indigo-50 border-2 border-indigo-600 p-4 mb-6">
              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-1.5 mb-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Autocompletado Inteligente (Grounding Activo)</span>
              </h4>
              <p className="text-xs text-slate-600 font-medium mb-3">
                Escribe únicamente el nombre comercial de la empresa en el campo inferior y presiona autocompletar. Buscaremos su información real en Google para rellenar la ficha técnicamente completa de forma instantánea.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la empresa (Ej. Zara, Grefusa, Mercadona, Cabify...)"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="flex-1 bg-white border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAiAutoFill}
                  disabled={isCompletingDraft || !draftName.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase px-4 py-2 border-2 border-slate-900 transition disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0 shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]"
                >
                  {isCompletingDraft ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Investigando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Completar</span>
                    </>
                  )}
                </button>
              </div>
              {draftError && (
                <div className="text-[11px] font-black text-amber-900 uppercase mt-2.5 bg-amber-50 px-2.5 py-1.5 border border-amber-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{draftError}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitCompany} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Sector Industrial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Alimentación, Automoción, Finanzas..."
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Sitio Web Corporativo</label>
                  <input
                    type="text"
                    placeholder="Ej. sgel.es"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Canal E-commerce</label>
                  <select
                    value={formEcommerce}
                    onChange={(e) => setFormEcommerce(e.target.value as "Sí" | "No")}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="Sí">Sí vende online</option>
                    <option value="No">No (Venta física/B2B)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Modelo de Venta</label>
                  <select
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value as any)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="B2B">Únicamente B2B</option>
                    <option value="B2C">Únicamente B2C</option>
                    <option value="B2B y C">B2B y B2C (Híbrido)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Color Corporativo (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formBrandColor}
                      onChange={(e) => setFormBrandColor(e.target.value)}
                      className="w-10 h-10 bg-transparent border-2 border-slate-900 p-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      placeholder="#0056b3"
                      value={formBrandColor}
                      onChange={(e) => setFormBrandColor(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:bg-white font-mono"
                    />
                  </div>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Teléfono Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. +34 91 123 4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Email Oficial</label>
                  <input
                    type="email"
                    placeholder="Ej. info@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">LinkedIn de Empresa</label>
                  <input
                    type="text"
                    placeholder="linkedin.com/company/..."
                    value={formLinkedin}
                    onChange={(e) => setFormLinkedin(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Presencia en España</label>
                  <select
                    value={formInSpain ? "Sí" : "No"}
                    onChange={(e) => setFormInSpain(e.target.value === "Sí")}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="Sí">Sí, opera en España</option>
                    <option value="No">No opera en España</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Cód. País Sede (Dos Letras)</label>
                  <input
                    type="text"
                    placeholder="ES, NL, DE, FR..."
                    maxLength={2}
                    value={formFlagCode}
                    onChange={(e) => setFormFlagCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Icono Representativo (Lucide)</label>
                  <select
                    value={formLogoName}
                    onChange={(e) => setFormLogoName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                  >
                    <option value="building">Sede / Edificio (Default)</option>
                    <option value="coffee">Café / Hostelería</option>
                    <option value="book-open">Editorial / Libros</option>
                    <option value="cup-soda">Bebidas / Vending</option>
                    <option value="wrench">Automoción / Herramientas</option>
                    <option value="grape">Vino / Viticultura</option>
                    <option value="glass-water">Aguas / Refrescos</option>
                    <option value="graduation-cap">Educación / Cursos</option>
                    <option value="truck">Logística y Reparto</option>
                    <option value="credit-card">Finanzas e Intercambios</option>
                    <option value="heart">Saludable / Bienestar</option>
                    <option value="languages">Idiomas / Traducción</option>
                    <option value="gift">Regalos / E-commerce</option>
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5">Resumen / Descripción corta *</label>
                <textarea
                  required
                  rows={2}
                  maxLength={250}
                  placeholder="Escribe un breve resumen de la actividad comercial de la empresa..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-1.5 border-t-2 border-slate-100 pt-3">Observaciones / Notas de Analista (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Datos pendientes de validar con el departamento de compras"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 px-4 py-2 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 px-5 py-2 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  Registrar Ficha
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* RENDER DRAWER: Detailed Static Profile Sheet */}
      {selectedCompanyDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto border-l-4 border-slate-900 p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b-2 border-slate-200 mb-6 font-sans">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-650 stroke-[2.5px]" />
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Ficha Técnica Corporativa</h3>
                </div>
                <button
                  onClick={() => setSelectedCompanyDetail(null)}
                  className="text-slate-400 hover:text-slate-950 p-1 border border-transparent hover:border-slate-900 bg-slate-50 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover card representation with customized branding color */}
              <div 
                className="p-5 border-2 border-slate-900 mb-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                style={{ 
                  backgroundColor: "rgba(248, 250, 252, 1)",
                  borderLeftColor: selectedCompanyDetail.brandColor,
                  borderLeftWidth: '8px'
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 flex items-center justify-center border-2 border-slate-900 bg-slate-900">
                    {(() => {
                      const IconComponent = getLogoIcon(selectedCompanyDetail.logoIconName);
                      return <IconComponent className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none">
                      {selectedCompanyDetail.name}
                    </h4>
                    <span className="text-xs text-indigo-650 font-extrabold uppercase italic tracking-wide block mt-1">{selectedCompanyDetail.sector}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {selectedCompanyDetail.summary}
                </p>
              </div>

              {/* Data Rows */}
              <div className="space-y-5">
                
                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Información Comercial</h5>
                  <div className="bg-slate-50 border-2 border-slate-900 p-4 space-y-3 text-xs text-slate-900">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Canal E-commerce</span>
                      <span className="font-extrabold uppercase">{selectedCompanyDetail.ecommerce}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Modelo de Ventas</span>
                      <span className="font-extrabold uppercase">{selectedCompanyDetail.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Presencia España</span>
                      <span className="font-extrabold uppercase">{selectedCompanyDetail.inSpain ? "Sí (Oficina local)" : "No (Remoto)"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Contactos & Canales</h5>
                  <div className="bg-slate-50 border-2 border-slate-900 p-4 space-y-3 text-xs text-slate-950 font-mono">
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Globe className="w-4 h-4 text-slate-800 shrink-0" />
                      <a href={`https://${selectedCompanyDetail.website}`} target="_blank" rel="noreferrer" className="font-bold underline text-indigo-600 hover:text-indigo-800">
                        {selectedCompanyDetail.website}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Phone className="w-4 h-4 text-slate-800 shrink-0" />
                      <span className="font-bold">{selectedCompanyDetail.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                      <Mail className="w-4 h-4 text-slate-800 shrink-0" />
                      <span className="font-bold">{selectedCompanyDetail.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-slate-800 shrink-0" />
                      <a href={`https://${selectedCompanyDetail.linkedin}`} target="_blank" rel="noreferrer" className="font-bold underline text-indigo-600 hover:text-indigo-800 truncate">
                        {selectedCompanyDetail.linkedin}
                      </a>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="pt-6 border-t-2 border-slate-200 mt-6 gap-3 flex">
              <button
                onClick={() => {
                  setSelectedCompanyDetail(null);
                  handlePerformResearch(selectedCompanyDetail);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white text-xs font-black uppercase tracking-wider py-3 px-4 transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              >
                Auditar con IA Grounding
              </button>
              <button
                onClick={() => setSelectedCompanyDetail(null)}
                className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-black uppercase py-3 px-5 transition shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER DRAWER: AI Search Grounding Research Output Area */}
      {(isResearching || activeResearchReport || researchError) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 flex justify-end">
          <div className="w-full max-w-2xl bg-slate-50 h-full overflow-y-auto border-l-4 border-slate-900 p-6 shadow-2xl flex flex-col justify-between">
            <div>
              {/* Header block with status indicator */}
              <div className="flex justify-between items-center pb-4 border-b-2 border-slate-200 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-650 text-xs font-black uppercase tracking-wider mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Investigación e Identidad Visual</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    {activeResearchReport ? activeResearchReport.companyName : "Analizando..."}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setActiveResearchReport(null);
                    setResearchError(null);
                    setResearchCompanyId(null);
                  }}
                  className="text-slate-400 hover:text-slate-950 p-1 border border-transparent hover:border-slate-900 bg-white hover:bg-slate-50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Researching Loading State */}
              {isResearching && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-indigo-650 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Conectando con Google Search Grounding...</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-sm leading-relaxed">
                    Consultando motores de búsqueda en tiempo real (2026) y ejecutando modelo <strong className="text-indigo-600 uppercase font-black">gemini-2.5-flash</strong> para recabar perfiles, rediseños de logotipo y recomendaciones visuales de diseño.
                  </p>
                  <div className="mt-8 space-y-2.5 w-full max-w-xs text-xs font-mono">
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 min-w-[200px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Invocando buscador</span>
                      <span className="text-emerald-600 font-bold uppercase">OK</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-1.5 min-w-[200px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Extrayendo fuentes</span>
                      <span className="text-indigo-600 font-bold uppercase animate-pulse">PROCESANDO...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Failure State */}
              {researchError && (
                <div className="bg-red-50 border-2 border-red-600 p-6 text-center shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                  <AlertCircle className="w-11 h-11 text-red-600 mx-auto mb-3" />
                  <h4 className="text-lg font-black text-red-950 uppercase tracking-tight mb-1">Fallo de Comunicación Inteligente</h4>
                  <p className="text-xs text-red-900 font-medium mb-4 leading-relaxed">
                    {researchError}
                  </p>
                  <p className="text-xs text-slate-500 italic max-w-md mx-auto mb-4">
                    Comprueba que el secreto GEMINI_API_KEY se encuentre configurado en la consola Settings de AI Studio.
                  </p>
                  <button
                    onClick={() => {
                      const item = companies.find(c => c.id === researchCompanyId);
                      if (item) handlePerformResearch(item);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs px-5 py-2.5 border-2 border-slate-900 transition tracking-wider"
                  >
                    Reintentar Auditoría
                  </button>
                </div>
              )}

              {/* Successful result rendering */}
              {activeResearchReport && (
                <div className="space-y-6">
                  
                  {/* Generated Text Content */}
                  <div className="markdown-body bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] overflow-x-hidden text-sm leading-relaxed text-slate-800 max-w-none">
                    <Markdown>{activeResearchReport.report}</Markdown>
                  </div>

                  {/* Sources List block */}
                  {activeResearchReport.sources && activeResearchReport.sources.length > 0 && (
                    <div className="border-t-2 border-slate-200 pt-5">
                      <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2.5">
                        Fuentes Citadas en la Búsqueda Real
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mb-3">
                        La IA recuperó y contrastó información en tiempo real de los siguientes enlaces web:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {activeResearchReport.sources.map((src, i) => (
                          <a
                            key={i}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 px-3.5 py-2 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0"
                          >
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                            <span className="truncate max-w-[190px]">{src.title}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 stroke-[2px]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-4">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    <span>Realizado el {activeResearchReport.timestamp}. Análisis basado en Grounding de Google Search.</span>
                  </div>

                </div>
              )}

            </div>

            <div className="pt-6 border-t-2 border-slate-200 mt-6 flex gap-3">
              <button
                onClick={() => window.print()}
                className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 text-xs font-black uppercase tracking-wider py-3 px-4 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Reporte</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveResearchReport(null);
                  setResearchError(null);
                  setResearchCompanyId(null);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-2 border-slate-900 text-white text-xs font-black uppercase tracking-wider py-3 px-4 transition text-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
