import { normalizeMake } from "./normalizeMake";

const makeMap: Record<string, string> = {
  "HERO MOTOCORP": "HERO MOTOCORP",
  "HERO HONDA MOTORS": "HERO HONDA",

  "HONDA MOTORCYCLE AND SCOOTER INDIA": "HONDA",

  "SUZUKI MOTORCYCLE INDIA": "SUZUKI",

  "TVS MOTOR COMPANY": "TVS",

  "BAJAJ AUTO": "BAJAJ",

  "INDIA YAMAHA MOTOR": "YAMAHA",

  "ROYAL ENFIELD": "ROYAL ENFIELD",

  "MAHINDRA TWO WHEELERS": "MAHINDRA",

  "OLA ELECTRIC TECHNOLOGIES": "OLA",

  "ATHER ENERGY": "ATHER",

  "PIAGGIO VEHICLES": "PIAGGIO",

  "CLASSIC LEGENDS": "JAWA",

  "INDIA KAWASAKI MOTORS": "KAWASAKI",

  "HARLEY DAVIDSON": "HARLEY DAVIDSON",

  "DUCATI": "DUCATI",

  "BMW MOTORRAD": "BMW",

  "TRIUMPH": "TRIUMPH",

  "BENELLI": "BENELLI",

  "OKINAWA AUTOTECH": "OKINAWA",

  "GREAVES ELECTRIC MOBILITY": "AMPERE",

  "REVOLT INTELLICORP": "REVOLT",

  "LML": "LML",
};

export function getZunoMakeName(make: string) {

  const normalized = normalizeMake(make);

  // Hero Honda pehle
  if (normalized.includes("HERO HONDA"))
    return "HERO HONDA";

  // Hero Motocorp
  if (normalized.includes("HERO"))
    return "HERO MOTOCORP";

  if (normalized.includes("HONDA"))
    return "HONDA";

  if (normalized.includes("SUZUKI"))
    return "SUZUKI";

  if (normalized.includes("BAJAJ"))
    return "BAJAJ";

  if (normalized.includes("TVS"))
    return "TVS";

  if (normalized.includes("YAMAHA"))
    return "YAMAHA";

  if (normalized.includes("ROYAL ENFIELD"))
    return "ROYAL ENFIELD";

  if (normalized.includes("MAHINDRA"))
    return "MAHINDRA";

  if (normalized.includes("OLA"))
    return "OLA";

  if (normalized.includes("ATHER"))
    return "ATHER";

  return makeMap[normalized] || normalized;

}
export function mapZunoBike(vehicle: any) {
  return {
    ...vehicle,
    make: getZunoMakeName(vehicle.make),
  };
}