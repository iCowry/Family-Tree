export enum Gender {
  Male = 'MALE',
  Female = 'FEMALE'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  name: string;
  historicalName?: string;
  province: string;
  coordinates?: Coordinates;
}

export interface Region {
  id: string;
  name: string; // e.g. "陇西", "太原" (Modern Name or General Name)
  historicalName?: string; // e.g. "郡望", "古称"
  province: string;
  description?: string;
}

export interface LifeEvent {
  year: number;
  title: string;
  description: string;
  type: 'BIRTH' | 'DEATH' | 'MARRIAGE' | 'MIGRATION' | 'ACHIEVEMENT' | 'DISASTER';
}

export interface Person {
  id: string;
  surname: string;
  givenName: string;
  courtesyName?: string; // 字
  artName?: string; // 号
  generation: number; // 世系
  generationName: string; // 字辈
  gender: Gender;
  birthYear: number;
  deathYear?: number;
  fatherId?: string;
  motherId?: string; // ID
  motherName?: string; // Name of mother (if ID not available)
  spouses: string[]; // Names or IDs
  children: string[]; // IDs
  portrait?: string;
  biography?: string;
  location?: Location;
}

export interface HallData {
  name: string; // e.g. "陇西堂"
  description: string;
  region?: string; // e.g. "甘肃"
}

export interface SurnameData {
  character: string; // e.g. "李"
  pinyin: string; // e.g. "Li"
  origin: string; // History text
  totemDescription?: string;
  halls: HallData[]; // List of halls associated
  famousAncestors?: string[];
  distribution?: string; // Description of geographical distribution
  populationRank?: number; // Approximate ranking
}

export interface ClanInfo {
  surname: string;
  hallName: string; // 堂号
  origin: string;
  ancestor: string;
  motto: string; // 族训
  generationPoem: string; // 字辈诗
}

export interface Family {
  id: string;
  info: ClanInfo;
  members: Person[];
  events: LifeEvent[];
  createdAt: number;
}