export type City = "Hyderabad" | "Bangalore" | "Mumbai";

export interface ApprovalItem {
  category: string;
  subcategory: string;
  hyderabad: string;
  bangalore: string;
  mumbai: string;
}

export const APPROVALS: ApprovalItem[] = [
  // 1. Land & Title Clearances
  { category: "Land & Title Clearances", subcategory: "Primary Land Records", hyderabad: "Pattadar Passbook, Dharani Web Search", bangalore: "E-Khata (A-Khata) & Extract", mumbai: "Property Card (PR Card) & 7/12 Extract" },
  { category: "Land & Title Clearances", subcategory: "Land Use Conversion", hyderabad: "NALA Assessment / CLU", bangalore: "DC Conversion (Deputy Commissioner)", mumbai: "NA Order (District Collector)" },
  { category: "Land & Title Clearances", subcategory: "Zoning & Master Plan", hyderabad: "HMDA Land Use Certificate", bangalore: "BDA Land Use / Master Plan Remarks", mumbai: "DP (Development Plan) Remarks" },
  { category: "Land & Title Clearances", subcategory: "Title History Verification", hyderabad: "30-Year Encumbrance Certificate", bangalore: "30-Year Encumbrance Certificate", mumbai: "30-Year Search Report & Title Certificate" },
  { category: "Land & Title Clearances", subcategory: "Social / Special Land Clears", hyderabad: "ULC (Urban Land Ceiling) Clearance", bangalore: "PTCL NOC (SC/ST Land Protection)", mumbai: "SRA / MHADA NOCs (Redevelopment/Slums)" },
  // 2. Pre-Construction NOCs
  { category: "Pre-Construction NOCs", subcategory: "Height Clearance", hyderabad: "AAI NOC (Airport Authority)", bangalore: "AAI NOC & BSNL Clearance", mumbai: "AAI NOC & Defence NOC (if near base)" },
  { category: "Pre-Construction NOCs", subcategory: "Environment", hyderabad: "SEIAA Telangana Clearance", bangalore: "SEIAA Karnataka Clearance", mumbai: "SEIAA Maharashtra Clearance" },
  { category: "Pre-Construction NOCs", subcategory: "Pollution Control", hyderabad: "TSPCB Consent for Establishment", bangalore: "KSPCB Consent for Establishment", mumbai: "MPCB Consent for Establishment" },
  { category: "Pre-Construction NOCs", subcategory: "Fire Safety", hyderabad: "Provisional Fire NOC", bangalore: "Fire Department Advice / NOC", mumbai: "CFO (Chief Fire Officer) Provisional NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Water & Feasibility", hyderabad: "HMWSSB Feasibility Report", bangalore: "BWSSB Feasibility NOC", mumbai: "BMC Hydraulic Engineer (HE) NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Sewerage & Drainage", hyderabad: "HMWSSB Drainage Plan Approval", bangalore: "BWSSB Sewerage Clearance", mumbai: "BMC Sewerage Operations (SO) NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Storm Water / Water Bodies", hyderabad: "Irrigation Dept FTL & Nala NOC", bangalore: "Lake & Rajakaluve Buffer NOC", mumbai: "BMC Storm Water Drain (SWD) NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Traffic & Logistics", hyderabad: "Police / Traffic Police NOC", bangalore: "Bangalore Traffic Police NOC", mumbai: "Mumbai Traffic Police NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Tree & Forest Ecology", hyderabad: "WALTA Permission", bangalore: "Tree Officer / Forest Dept NOC", mumbai: "BMC Tree Authority NOC" },
  { category: "Pre-Construction NOCs", subcategory: "Site Logistics & Safety", hyderabad: "Ground Water Dept (Borewells)", bangalore: "BESCOM & KPTCL (High-Tension)", mumbai: "BMC Pest Control & SWM Debris NOC" },
  // 3. Main Building Sanction & Construction
  { category: "Building Sanction & Construction", subcategory: "Zoning / Framework Approval", hyderabad: "TS-bPASS Building Permission", bangalore: "BBMP / BDA Plan Sanction", mumbai: "Intimation of Disapproval (IOD)" },
  { category: "Building Sanction & Construction", subcategory: "FSI / TDR Loading", hyderabad: "Premium FSI via TS-bPASS", bangalore: "Premium FSI (FAR) Regulations", mumbai: "Slum/Heritage TDR & Premium FSI" },
  { category: "Building Sanction & Construction", subcategory: "Public Amenity Clearances", hyderabad: "Simple Mortgage (10% Built-up)", bangalore: "Relinquishment Deed (Parks/Roads)", mumbai: "Adjusted via Open Space Deficiency" },
  { category: "Building Sanction & Construction", subcategory: "Structural & Safety", hyderabad: "Structural Stability Certificate", bangalore: "Structural Peer Review Certificate", mumbai: "High-Rise Committee Approval (>70m)" },
  { category: "Building Sanction & Construction", subcategory: "Initial Construction Start", hyderabad: "Automatic via TS-bPASS Approval", bangalore: "Commencement Certificate (CC)", mumbai: "Plinth Commencement Certificate (CC)" },
  { category: "Building Sanction & Construction", subcategory: "Superstructure Start", hyderabad: "Checked during routine inspection", bangalore: "Plinth Inspection Clearance", mumbai: "Full Commencement Certificate (Full CC)" },
  { category: "Building Sanction & Construction", subcategory: "Worker Welfare", hyderabad: "Labour Cess & BOCW Registration", bangalore: "Labour Cess & BOCW Registration", mumbai: "Labour Cess & BOCW Registration" },
  { category: "Building Sanction & Construction", subcategory: "Consumer Compliance", hyderabad: "TS RERA Registration", bangalore: "Karnataka RERA (K-RERA)", mumbai: "MahaRERA Registration" },
  { category: "Building Sanction & Construction", subcategory: "Site Utilities", hyderabad: "Temporary Power & Water", bangalore: "Temporary Power & Water", mumbai: "Temporary Power & Water" },
  // 4. Post-Construction & Occupancy
  { category: "Post-Construction & Occupancy", subcategory: "Fire Compliance", hyderabad: "Final Fire NOC", bangalore: "Final Fire Safety Clearance", mumbai: "Final CFO Clearance Certificate" },
  { category: "Post-Construction & Occupancy", subcategory: "Mechanical Systems", hyderabad: "Lift & Escalator License (CEIG)", bangalore: "Electrical Inspectorate Lift License", mumbai: "PWD Lift Inspectorate NOC" },
  { category: "Post-Construction & Occupancy", subcategory: "Environmental Operation", hyderabad: "TSPCB Consent for Operation", bangalore: "KSPCB Consent for Operation (CFO)", mumbai: "MPCB Consent for Operation" },
  { category: "Post-Construction & Occupancy", subcategory: "Public Amenity Release", hyderabad: "Mortgage Area Release Deed", bangalore: "Final Handover Verification", mumbai: "Building Completion Certificate (BCC)" },
  { category: "Post-Construction & Occupancy", subcategory: "Final Handover Document", hyderabad: "Occupancy Certificate (OC)", bangalore: "Occupancy Certificate (OC)", mumbai: "Part / Full Occupancy Certificate (OC)" },
  { category: "Post-Construction & Occupancy", subcategory: "Utility Infrastructure", hyderabad: "Permanent Water & Power Links", bangalore: "Permanent BWSSB & BESCOM Links", mumbai: "Permanent Hydraulic & Power Links" },
];

export function getApprovalsForCity(city: City): { category: string; items: { name: string; approval: string }[] }[] {
  const cityKey = city.toLowerCase() as keyof Omit<ApprovalItem, "category" | "subcategory">;
  const grouped: Record<string, { name: string; approval: string }[]> = {};
  for (const item of APPROVALS) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push({ name: item.subcategory, approval: item[cityKey] });
  }
  return Object.entries(grouped).map(([category, items]) => ({ category, items }));
}
