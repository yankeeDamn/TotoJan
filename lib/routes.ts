/**
 * The Rampurhat <-> Tarapith corridor.
 *
 * NOTE: coordinates and the road distance are approximations good enough for the map and for
 * fare estimates. Refine them with surveyed values before launch.
 */
export interface Place {
  id: string;
  name: string;
  short: string;
  lat: number;
  lng: number;
}

export const RAMPURHAT_STATION: Place = {
  id: "rampurhat-station",
  name: "Rampurhat Railway Station",
  short: "Rampurhat Station",
  lat: 24.1737,
  lng: 87.7801,
};

export const TARAPITH_TEMPLE: Place = {
  id: "tarapith-temple",
  name: "Tarapith Temple",
  short: "Tarapith Temple",
  lat: 24.1322,
  lng: 87.7845,
};

export interface PresetRoute {
  id: string;
  label: string;
  from: Place;
  to: Place;
}

export const PRESET_ROUTES: PresetRoute[] = [
  { id: "station-to-temple", label: "Station → Temple", from: RAMPURHAT_STATION, to: TARAPITH_TEMPLE },
  { id: "temple-to-station", label: "Temple → Station", from: TARAPITH_TEMPLE, to: RAMPURHAT_STATION },
];

/** Approximate road distance between the two ends of the corridor. */
export const CORRIDOR_DISTANCE_KM = 6.5;

/** Average moving speeds (km/h) used for the ETA shown to travelers. */
export const AVG_SPEED_KMPH: Record<"toto" | "cab", number> = { toto: 18, cab: 28 };

/** Suggestions for the pickup/drop fields. Free text is still allowed. */
export const LANDMARKS = [
  "Rampurhat Railway Station",
  "Rampurhat Bus Stand",
  "Tarapith Temple",
  "Tarapith Bus Stand",
  "Tarapith Mahashmashan",
  "Dwarka River Ghat, Tarapith",
];
