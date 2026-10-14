import { useState } from "react";
import { Search, Building2, ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { COMPANY_KITS, type CompanyKitMeta } from "@/lib/companyKits";
import { getCompanyLogo } from "@/lib/companyLogos";
import { Badge } from "@/components/ui/badge";

interface CompanyKitsCatalogProps {
  onSelectCompany: (companyName: string) => void;
  onBack?: () => void;
  activeTargetCompany?: string;
  targetCompanies?: string[];
  solvedByCompany?: Record<string, number>;
}

export function CompanyKitsCatalog({
  onSelectCompany,
  onBack,
  activeTargetCompany = "Google",
  targetCompanies,
  solvedByCompany = {},
}: CompanyKitsCatalogProps) {
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<"ALL" | "FAANG" | "HIGH_FREQUENCY">("ALL");

  const faangCompanies = ["google", "amazon", "meta", "apple", "netflix", "microsoft"];

  const filtered = COMPANY_KITS.filter((kit) => {
    const matchesSearch =
      kit.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      kit.tagline.toLowerCase().includes(search.toLowerCase().trim());

    if (!matchesSearch) return false;

    if (filterTag === "FAANG") {
      return faangCompanies.includes(kit.slug);
    }
    if (filterTag === "HIGH_FREQUENCY") {
      return kit.totalQuestions >= 200;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#181A20]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1.5">
            {onBack && (
              <>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-[#8B92A0] hover:text-white transition-colors cursor-pointer flex items-center gap-1 mr-1"
                >
                  <span>Prephub</span>
                </button>
                <span className="text-[#525866]">/</span>
              </>
            )}
            <Building2 className="w-3.5 h-3.5" />
            <span>Target Company Practice Kits</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Company-Wise Coding Sheets</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Curated Loop Sets
            </span>
          </h2>
          <p className="text-xs text-[#8B92A0] mt-1 max-w-2xl leading-relaxed">
            Target company-specific DSA interview sheets prioritized by real ask-rate frequency and interview rounds. Select a company to inspect pattern distributions, difficulty splits, and curated questions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#525866]" />
          <input
            type="text"
            placeholder="Search company or style..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#0D0E12] border border-[#181A20] text-xs text-white placeholder-[#525866] focus:border-blue-500/60 outline-none transition-all font-sans"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: "ALL", label: "All Company Sheets" },
          { id: "FAANG", label: "Big Tech / FAANG" },
          { id: "HIGH_FREQUENCY", label: "200+ Question Kits" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTag(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              filterTag === tab.id
                ? "bg-[#181C26] text-white border border-blue-500/40 shadow-sm font-semibold"
                : "bg-[#090B0F] text-[#8B92A0] border border-[#181A20] hover:text-white hover:border-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((kit) => {
          const logo = getCompanyLogo(kit.name) || getCompanyLogo(kit.slug);
          const isTarget = targetCompanies && targetCompanies.length > 0
            ? targetCompanies.some((c) => c.toLowerCase() === kit.name.toLowerCase())
            : activeTargetCompany.toLowerCase() === kit.name.toLowerCase();
          const solvedCount = solvedByCompany[kit.name] || 0;
          const readinessPercent = Math.min(100, Math.round((solvedCount / kit.totalQuestions) * 100));

          return (
            <div
              key={kit.slug}
              onClick={() => onSelectCompany(kit.name)}
              className={`p-5 rounded-2xl bg-[#0D0E12] border transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:shadow-xl hover:-translate-y-0.5 ${
                isTarget
                  ? "border-blue-500/60 shadow-lg shadow-blue-500/5 bg-[#0F121A]"
                  : "border-[#181A20] hover:border-zinc-700"
              }`}
            >
              <div>
                {/* 1. Header: Logo, Title & 1-Line Tagline */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#141720] border border-[#222634] p-2 flex items-center justify-center shrink-0 group-hover:border-blue-500/50 transition-colors shadow-inner">
                      {logo ? (
                        <img src={logo} alt={kit.name} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors truncate">
                          {kit.name}
                        </h3>
                        {isTarget && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0 shrink-0">
                            Target
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {kit.tagline}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#141720] border border-[#1E222D] text-slate-300 shrink-0 whitespace-nowrap self-start">
                    {kit.totalQuestions} Qs
                  </span>
                </div>

                {/* 2. Max 2 Subtle Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  {kit.topPatterns.slice(0, 2).map((pat) => (
                    <span
                      key={pat.topic}
                      className="px-2 py-0.5 rounded-md bg-[#11131A] text-[11px] font-mono text-slate-400 border border-white/[0.04]"
                    >
                      {pat.topic}
                    </span>
                  ))}
                  {kit.topPatterns.length > 2 && (
                    <span className="text-[10px] text-slate-500 font-mono pl-1">
                      +{kit.topPatterns.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Bottom Row: Progress / Difficulty & Action */}
              <div className="pt-3 border-t border-[#181A20] flex items-center justify-between text-xs">
                <span className="text-xs text-slate-400 font-mono">
                  {solvedCount > 0 ? (
                    <span className="text-emerald-400 font-medium">{solvedCount} solved</span>
                  ) : (
                    <span>Easy {kit.difficultySplit.easy} • Med {kit.difficultySplit.medium} • Hard {kit.difficultySplit.hard}</span>
                  )}
                </span>

                <div className="flex items-center gap-1 text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Explore Kit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
