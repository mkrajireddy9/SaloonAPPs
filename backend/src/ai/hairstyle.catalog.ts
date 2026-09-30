export type HairstyleCatalogItem = {
  id: string;
  name: string;
  length: string;
  maintenance: string;
  worksWith: string[];
  goodFor: string[];
  goals: string[];
};

export const HAIRSTYLE_CATALOG: HairstyleCatalogItem[] = [
  { id: 'face-framing-layers', name: 'Long Face-Framing Layers', length: 'long', maintenance: 'medium', worksWith: ['straight', 'wavy', 'curly'], goodFor: ['oval', 'round', 'heart'], goals: ['face framing', 'keep length', 'more modern look'] },
  { id: 'butterfly-layers', name: 'Butterfly Layers', length: 'long', maintenance: 'medium', worksWith: ['straight', 'wavy'], goodFor: ['oval', 'round', 'square'], goals: ['add volume', 'face framing', 'more modern look'] },
  { id: 'curtain-layers', name: 'Curtain Layers', length: 'medium', maintenance: 'low', worksWith: ['straight', 'wavy'], goodFor: ['oval', 'heart', 'long'], goals: ['face framing', 'easier styling'] },
  { id: 'soft-shag', name: 'Soft Shag', length: 'medium', maintenance: 'medium', worksWith: ['wavy', 'curly', 'straight'], goodFor: ['oval', 'round', 'heart'], goals: ['reduce bulk', 'more modern look', 'add volume'] },
  { id: 'textured-lob', name: 'Textured Lob', length: 'medium', maintenance: 'low', worksWith: ['straight', 'wavy'], goodFor: ['oval', 'round', 'square'], goals: ['easier styling', 'reduce bulk', 'more modern look'] },
  { id: 'collarbone-layers', name: 'Collarbone Layers', length: 'medium', maintenance: 'low', worksWith: ['straight', 'wavy', 'curly'], goodFor: ['oval', 'heart', 'long'], goals: ['keep length', 'face framing', 'easier styling'] },
  { id: 'blunt-bob', name: 'Blunt Bob', length: 'short', maintenance: 'medium', worksWith: ['straight', 'wavy'], goodFor: ['oval', 'heart', 'long'], goals: ['more modern look', 'reduce bulk'] },
  { id: 'curly-bob', name: 'Curly Bob', length: 'short', maintenance: 'medium', worksWith: ['curly', 'wavy'], goodFor: ['oval', 'heart', 'square'], goals: ['add volume', 'more modern look'] },
  { id: 'long-side-fringe', name: 'Long Side-Swept Fringe', length: 'long', maintenance: 'low', worksWith: ['straight', 'wavy'], goodFor: ['round', 'square', 'heart'], goals: ['face framing', 'keep length'] },
  { id: 'textured-pixie', name: 'Textured Pixie', length: 'short', maintenance: 'high', worksWith: ['straight', 'wavy', 'curly'], goodFor: ['oval', 'heart'], goals: ['more modern look', 'easier styling'] },
];

export const catalogForPrompt = () => HAIRSTYLE_CATALOG.map(({ id, name, length, maintenance, worksWith, goodFor, goals }) => ({ id, name, length, maintenance, worksWith, goodFor, goals }));
