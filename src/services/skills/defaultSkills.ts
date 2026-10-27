import { SkillDefinition } from '../../types/kos';
import { getEngineeringSkills } from './catalogs/engineeringSkills';
import { getBackendAndDataSkills } from './catalogs/backendAndDataSkills';
import { getFrontendAndMobileSkills } from './catalogs/frontendAndMobileSkills';
import { getNativeAndSwarmSkills } from './catalogs/nativeAndSwarmSkills';

export function getDefaultSkills(): SkillDefinition[] {
  const baseTime = Date.now() - 3600000;
  return [
    ...getEngineeringSkills(baseTime),
    ...getBackendAndDataSkills(baseTime),
    ...getFrontendAndMobileSkills(baseTime),
    ...getNativeAndSwarmSkills(baseTime),
  ];
}

export const DEFAULT_SKILLS = getDefaultSkills();
