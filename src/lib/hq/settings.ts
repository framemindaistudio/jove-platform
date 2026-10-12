/** Company settings stored in data/settings.json (object, not array). Editable in HQ → Settings. */
export interface CompanySettings {
  legalName: string;
  brandName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  sacCode: string;
  bankAccountName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  upiId: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  proposalPrefix: string;
  nextProposalNumber: number;
  poPrefix: string;
  nextPoNumber: number;
  orderPrefix: string;
  nextOrderNumber: number;
  certificatePrefix: string;
  financialYear: string;
  signatoryName: string;
  signatoryTitle: string;
  invoiceTerms: string;
  baseLocation: string;
  monthlyRevenueTarget: number;
  workshopsPerMonthTarget: number;
  fuelCostPerKm: number;
  updatedAt?: string;
  updatedBy?: string;
}

export const defaultSettings: CompanySettings = {
  legalName: "JOVE — Journey of Visionation & Excellence",
  brandName: "JOVE",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Karnataka",
  stateCode: "29",
  pincode: "",
  phone: "",
  email: "",
  website: "",
  gstin: "",
  pan: "",
  sacCode: "999293",
  bankAccountName: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  upiId: "",
  invoicePrefix: "JOVE/26-27/",
  nextInvoiceNumber: 1,
  proposalPrefix: "JOVE-P-",
  nextProposalNumber: 1,
  poPrefix: "JOVE-PO-",
  nextPoNumber: 1,
  orderPrefix: "JV",
  nextOrderNumber: 1001,
  certificatePrefix: "JOVE-26-",
  financialYear: "2026-27",
  signatoryName: "Shivaprasad Reddy S S",
  signatoryTitle: "Founder & CEO",
  invoiceTerms:
    "50% advance to confirm the date; balance within 7 days of the workshop. Payment by bank transfer/UPI to the account below. Prices in INR. Subject to local jurisdiction.",
  baseLocation: "",
  monthlyRevenueTarget: 400000,
  workshopsPerMonthTarget: 4,
  fuelCostPerKm: 9,
};

export const SETTINGS_PATH = "data/settings.json";
