export const SERVICE_CATEGORIES = [
  "Pravidelný servis",
  "Oprava",
  "Úpravy / Tuning",
  "Detailing & Péče",
  "Pneumatiky & Kola",
  "Administrativa / STK / Poplatky",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const FUEL_TYPES = [
  "Benzín",
  "Nafta",
  "Hybrid",
  "Plug-in Hybrid",
  "Elektro",
  "LPG / CNG",
] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export interface Vehicle {
  id: string;
  user_id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  license_plate: string | null;
  initial_mileage: number;
  current_mileage: number;
  cover_photo_path: string | null;
  cover_photo_url?: string | null;
  vin: string | null;
  engine_code: string | null;
  paint_code: string | null;
  fuel_type: string | null;
  engine_spec: string | null;
  stk_expires_at: string | null;
  vignette_expires_at: string | null;
  insurance_expires_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordPhoto {
  id: string;
  record_id: string;
  user_id: string;
  storage_path: string;
  signed_url?: string | null;
  caption: string | null;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  user_id: string;
  title: string;
  category: ServiceCategory;
  record_date: string;
  mileage: number;
  parts_cost: number;
  labor_cost: number;
  total_cost: number;
  oem_codes: string | null;
  product_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  photos?: RecordPhoto[];
}

export interface VehicleFormValues {
  nickname: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  initial_mileage: number;
  current_mileage: number;
  vin: string;
  engine_code: string;
  paint_code: string;
  fuel_type: string;
  engine_spec: string;
  stk_expires_at: string;
  vignette_expires_at: string;
  insurance_expires_at: string;
  notes: string;
}

export interface ServiceRecordFormValues {
  vehicle_id: string;
  title: string;
  category: ServiceCategory;
  record_date: string;
  mileage: number;
  parts_cost: number;
  labor_cost: number;
  oem_codes: string;
  product_url: string;
  notes: string;
}
