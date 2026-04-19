export const RAMPURHAT_CITY = "Rampurhat";

export const SERVICE_COPY = {
  shortName: "Rampurhat TOTO",
  tagline: "Fast, local, trusted TOTO booking inside Rampurhat.",
  supportPhone: "+91 90000 12345",
  supportHours: "6:00 AM - 10:00 PM",
};

export type RampurhatLocality = {
  name: string;
  latitude: number;
  longitude: number;
};

export const RAMPURHAT_LOCALITIES: RampurhatLocality[] = [
  { name: "Station Road", latitude: 24.1756, longitude: 87.7826 },
  { name: "College More", latitude: 24.1698, longitude: 87.7839 },
  { name: "Bus Stand", latitude: 24.1714, longitude: 87.7795 },
  { name: "Kalikapur", latitude: 24.1799, longitude: 87.7868 },
  { name: "Dumka Road", latitude: 24.1732, longitude: 87.7718 },
  { name: "Deshbandhu Road", latitude: 24.1679, longitude: 87.7808 },
  { name: "Nischintapur", latitude: 24.1658, longitude: 87.7894 },
  { name: "Mahamaya More", latitude: 24.1771, longitude: 87.7901 },
  { name: "Hospital More", latitude: 24.1706, longitude: 87.7873 },
  { name: "Sainthia More", latitude: 24.1744, longitude: 87.7752 },
  { name: "Rail Gate", latitude: 24.1768, longitude: 87.7809 },
  { name: "Murarai Road", latitude: 24.1685, longitude: 87.7734 }
];

export const DISTANCE_BANDS = {
  short: 2.5,
  medium: 5,
};