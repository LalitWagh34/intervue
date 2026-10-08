/**
 * Centralized mapping for company logos and brand icons stored in /public
 */
export const COMPANY_LOGOS: Record<string, string> = {
  adobe: "/adobe.png",
  amazon: "/amazon.png",
  apple: "/apple_dark.png",
  atlassian: "/atlassian.png",
  bloomberg: "/bloomberg.png",
  flipkart: "/flipkart.png",
  goldmansachs: "/goldmansachs.png",
  "goldman-sachs": "/goldmansachs.png",
  google: "/google.png",
  ibm: "/ibm_light.svg",
  infosys: "/infosys_light.svg",
  jpmorgan: "/jpmorgan.jpeg",
  "jp-morgan": "/jpmorgan.jpeg",
  linkedin: "/linkedin.png",
  meta: "/meta.png",
  facebook: "/meta.png",
  microsoft: "/microsoft.png",
  netflix: "/netflix-1-logo-svgrepo-com.svg",
  nvidia: "/nvidia.png",
  oracle: "/oracle.png",
  paypal: "/paypal.png",
  salesforce: "/salesforce.png",
  tcs: "/tcs_light.svg",
  uber: "/uber.png",
  visa: "/visa.png",
  walmart: "/walmart.png",
  "walmart-labs": "/walmart.png",
};

export function getCompanyLogo(company?: string | null): string | null {
  if (!company) return null;
  const normalized = company
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (COMPANY_LOGOS[normalized]) return COMPANY_LOGOS[normalized];

  const compact = company.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, path] of Object.entries(COMPANY_LOGOS)) {
    if (key.replace(/[^a-z0-9]/g, "") === compact) {
      return path;
    }
  }

  // Keyword / Substring match fallback
  if (compact.includes("google")) return "/google.png";
  if (compact.includes("amazon")) return "/amazon.png";
  if (compact.includes("meta") || compact.includes("facebook")) return "/meta.png";
  if (compact.includes("microsoft")) return "/microsoft.png";
  if (compact.includes("apple")) return "/apple_dark.png";
  if (compact.includes("netflix")) return "/netflix-1-logo-svgrepo-com.svg";
  if (compact.includes("uber")) return "/uber.png";
  if (compact.includes("adobe")) return "/adobe.png";
  if (compact.includes("bloomberg")) return "/bloomberg.png";
  if (compact.includes("flipkart")) return "/flipkart.png";
  if (compact.includes("goldman")) return "/goldmansachs.png";
  if (compact.includes("jpmorgan") || compact.includes("morgan")) return "/jpmorgan.jpeg";
  if (compact.includes("walmart")) return "/walmart.png";
  if (compact.includes("salesforce")) return "/salesforce.png";
  if (compact.includes("nvidia")) return "/nvidia.png";
  if (compact.includes("oracle")) return "/oracle.png";
  if (compact.includes("paypal")) return "/paypal.png";
  if (compact.includes("linkedin")) return "/linkedin.png";
  if (compact.includes("atlassian")) return "/atlassian.png";
  if (compact.includes("visa")) return "/visa.png";
  if (compact.includes("infosys")) return "/infosys_light.svg";
  if (compact.includes("tcs") || compact.includes("tata")) return "/tcs_light.svg";
  if (compact.includes("ibm")) return "/ibm_light.svg";

  return null;
}
