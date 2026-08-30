export type DistrictSide = "avrupa" | "anadolu";

export type District = {
  name: string;
  slug: string;
  side: DistrictSide;
  /**
   * İBB Şehir Haritası kamu haritası için doğrulanmış ilçe odağıdır.
   * Bu koordinatlar sınır geometrisi değildir; sınır katmanı için ayrıca
   * doğrulanmış GeoJSON/WFS kaynağı gerekir.
   */
  center: readonly [latitude: number, longitude: number];
};

const europeanDistricts = [
  ["Arnavutköy", "arnavutkoy", 41.184, 28.74],
  ["Avcılar", "avcilar", 40.98, 28.72],
  ["Bağcılar", "bagcilar", 41.04, 28.86],
  ["Bahçelievler", "bahcelievler", 41.0, 28.86],
  ["Bakırköy", "bakirkoy", 40.98, 28.87],
  ["Başakşehir", "basaksehir", 41.11, 28.8],
  ["Bayrampaşa", "bayrampasa", 41.05, 28.91],
  ["Beşiktaş", "besiktas", 41.04, 29.01],
  ["Beylikdüzü", "beylikduzu", 40.99, 28.64],
  ["Beyoğlu", "beyoglu", 41.04, 28.98],
  ["Büyükçekmece", "buyukcekmece", 41.02, 28.59],
  ["Çatalca", "catalca", 41.14, 28.46],
  ["Esenler", "esenler", 41.04, 28.88],
  ["Esenyurt", "esenyurt", 41.03, 28.68],
  ["Eyüpsultan", "eyupsultan", 41.05, 28.93],
  ["Fatih", "fatih", 41.02, 28.95],
  ["Gaziosmanpaşa", "gaziosmanpasa", 41.06, 28.92],
  ["Güngören", "gungoren", 41.02, 28.88],
  ["Kağıthane", "kagithane", 41.08, 28.97],
  ["Küçükçekmece", "kucukcekmece", 41.0, 28.78],
  ["Sarıyer", "sariyer", 41.17, 29.05],
  ["Silivri", "silivri", 41.08, 28.25],
  ["Sultangazi", "sultangazi", 41.11, 28.87],
  ["Şişli", "sisli", 41.06, 28.99],
  ["Zeytinburnu", "zeytinburnu", 41.0, 28.9],
] as const;

const asianDistricts = [
  ["Adalar", "adalar", 40.87, 29.13],
  ["Ataşehir", "atasehir", 40.99, 29.13],
  ["Beykoz", "beykoz", 41.13, 29.1],
  ["Çekmeköy", "cekmekoy", 41.04, 29.18],
  ["Kadıköy", "kadikoy", 40.99, 29.03],
  ["Kartal", "kartal", 40.9, 29.19],
  ["Maltepe", "maltepe", 40.92, 29.14],
  ["Pendik", "pendik", 40.88, 29.24],
  ["Sancaktepe", "sancaktepe", 41.0, 29.23],
  ["Sultanbeyli", "sultanbeyli", 40.96, 29.27],
  ["Şile", "sile", 41.18, 29.61],
  ["Tuzla", "tuzla", 40.82, 29.3],
  ["Ümraniye", "umraniye", 41.03, 29.12],
  ["Üsküdar", "uskudar", 41.02, 29.02],
] as const;

function makeDistricts(
  source: ReadonlyArray<readonly [string, string, number, number]>,
  side: DistrictSide,
): District[] {
  return source.map(([name, slug, latitude, longitude]) => ({
    name,
    slug,
    side,
    center: [latitude, longitude],
  }));
}

export const districts = [
  ...makeDistricts(europeanDistricts, "avrupa"),
  ...makeDistricts(asianDistricts, "anadolu"),
] as const;

export const districtOptions = districts.map((district) => ({
  label: district.name,
  value: district.slug,
}));

export function getDistrict(slug: string): District | null {
  return districts.find((district) => district.slug === slug) ?? null;
}

export function getDistrictsBySide(side: DistrictSide): District[] {
  return districts.filter((district) => district.side === side);
}
