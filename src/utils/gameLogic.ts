import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import logger from './logger';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);
const LOCATION_BATCH_SIZE = 50;
const MIN_LOCATIONS_THRESHOLD = 10;

export type GameType = 'classic' | 'hiddenGems' | 'continent';

interface LocationInfo {
  facts: string[];
  historicalSignificance: string;
  culturalSignificance: string;
  locationType: 'landmark' | 'hiddenGem' | 'cultural';
   address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
}

interface LocationBank {
  locations: GameData[];
  lastUpdated: Date;
}

interface GeneratedLandmark extends LocationInfo {
  name: string;
  description: string;
  lat: number;
  lng: number;
  country: string;
  countryBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface GameData {
  targetLocation: {
    lat: number;
    lng: number;
    name: string;
    description: string;
  };
  startLocation: {
    lat: number;
    lng: number;
  };
  country: string;
  countryBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  viewPosition: {
    lat: number;
    lng: number;
  };
  locationInfo: LocationInfo;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'score' | 'games' | 'accuracy' | 'speed' | 'special';
  requirement: number;
}

const JS_3D_SUPPORTED_COUNTRIES = [
  "Albania", "Argentina", "Austria", "Australia", "Bosnia & Herzegovina", 
  "Belgium", "Bulgaria", "Brazil", "Bahamas", "Canada", "Switzerland", 
  "Chile", "Czechia", "Germany", "Denmark", "Finland", "France", 
  "United Kingdom", "Greece", "Croatia", "Hungary", "Indonesia", 
  "Ireland", "Israel", "India", "Italy", "Japan", "South Korea", 
  "Lithuania", "Luxembourg", "Latvia", "Montenegro", "North Macedonia", 
  "Malta", "Mexico", "Malaysia", "Netherlands", "Norway", "New Zealand", 
  "Philippines", "Poland", "Puerto Rico", "Portugal", "Romania", "Serbia", 
  "Sweden", "Singapore", "Slovenia", "Slovakia", "San Marino", "Tunisia", 
  "Taiwan", "United States", "South Africa"
];

const PROMPTS: Record<GameType, string> = {
  classic: `Generate ${LOCATION_BATCH_SIZE} locations as a JSON array. CRITICAL REQUIREMENTS:

Format each location EXACTLY as follows:
{
  "name": "Eiffel Tower",
  "description": "Iconic iron lattice tower on the Champ de Mars in Paris",
  "lat": 48.858370,
  "lng": 2.294481,
  "country": "France",
  "countryBounds": {
    "north": 51.09,
    "south": 41.36,
    "east": 9.56,
    "west": -5.14
  },
  "address": {
    "street": "Champ de Mars, 5 Avenue Anatole France",
    "city": "Paris",
    "postalCode": "75007",
    "country": "France"
  },
  "facts": [
    "Completed in 1889",
    "324 meters tall",
    "Most visited paid monument in the world"
  ],
  "historicalSignificance": "Built for the 1889 World's Fair, symbolizing French industrial might.",
  "culturalSignificance": "Global icon of France and romance, featured in countless artworks and films.",
  "locationType": "landmark"
}

REQUIREMENTS:
- ONLY use locations from these countries: ${JS_3D_SUPPORTED_COUNTRIES.join(', ')}
- Use EXACT real-world coordinates with 6+ decimal precision
- Include complete, accurate street addresses
- Include EXACT country boundary coordinates
- Provide at least 3 unique facts
- Write detailed historical and cultural significance
- Focus on major landmarks and tourist attractions`,

  hiddenGems: `Generate ${LOCATION_BATCH_SIZE} hidden gem locations as a JSON array. CRITICAL REQUIREMENTS:

Format each location EXACTLY as follows:
{
  "name": "Hidden Coffee Roastery",
  "description": "Local favorite coffee roastery hidden in an old warehouse district",
  "lat": 40.415363,
  "lng": -3.709609,
  "country": "Spain",
  "countryBounds": {
    "north": 43.79,
    "south": 36.00,
    "east": 4.33,
    "west": -9.30
  },
  "address": {
    "street": "Calle del Café, 123",
    "city": "Madrid",
    "postalCode": "28012",
    "country": "Spain"
  },
  "facts": [
    "Family-owned since 1985",
    "Roasts beans from 12 different countries",
    "Known only to locals"
  ],
  "historicalSignificance": "Located in a converted 1920s grain warehouse, representing the area's industrial heritage.",
  "culturalSignificance": "A gathering spot for local artists and musicians, fostering community creativity.",
  "locationType": "hiddenGem"
}

REQUIREMENTS:
- ONLY use locations from these countries: ${JS_3D_SUPPORTED_COUNTRIES.join(', ')}
- Use EXACT real-world coordinates with 6+ decimal precision
- Include complete, accurate street addresses
- Include EXACT country boundary coordinates
- Provide at least 3 unique facts
- Write detailed historical and cultural significance
- Focus on lesser-known but authentic local spots`,

  continent: `Generate ${LOCATION_BATCH_SIZE} locations as a JSON array. CRITICAL REQUIREMENTS:

Format each location EXACTLY as follows:
{
  "name": "Machu Picchu",
  "description": "Ancient Incan city set high in the Andes Mountains",
  "lat": -13.163141,
  "lng": -72.545872,
  "country": "Peru",
  "countryBounds": {
    "north": -0.03,
    "south": -18.35,
    "east": -68.68,
    "west": -81.33
  },
  "address": {
    "street": "Machu Picchu Pueblo",
    "city": "Cusco",
    "state": "Cusco Region",
    "country": "Peru"
  },
  "facts": [
    "Built in 15th century",
    "Discovered in 1911",
    "UNESCO World Heritage Site"
  ],
  "historicalSignificance": "Ancient Incan city showcasing their architectural and engineering prowess.",
  "culturalSignificance": "Sacred religious and ceremonial site of the Inca civilization.",
  "locationType": "cultural"
}

REQUIREMENTS:
- ONLY use locations from these countries: ${JS_3D_SUPPORTED_COUNTRIES.join(', ')}
- Include interesting locations from ALL continents
- Use EXACT real-world coordinates with 6+ decimal precision
- Include complete, accurate addresses
- Include EXACT country boundary coordinates
- Provide at least 3 unique facts
- Write detailed historical and cultural significance`,
};

function validateLocation(landmark: GeneratedLandmark): boolean {
  if (!JS_3D_SUPPORTED_COUNTRIES.includes(landmark.country)) {
    return false;
  }
  // Validate coordinates precision (ensure enough decimal places for accuracy)
  const hasValidPrecision = 
    landmark.lat.toString().split('.')[1]?.length >= 5 &&
    landmark.lng.toString().split('.')[1]?.length >= 5;

  // Validate country bounds precision
  const hasValidBoundsPrecision =
    landmark.countryBounds.north.toString().split('.')[1]?.length >= 2 &&
    landmark.countryBounds.south.toString().split('.')[1]?.length >= 2 &&
    landmark.countryBounds.east.toString().split('.')[1]?.length >= 2 &&
    landmark.countryBounds.west.toString().split('.')[1]?.length >= 2;

  // Validate address completeness with type checking
  const hasValidAddress = Boolean(
    landmark.address &&
    typeof landmark.address === 'object' &&
    landmark.address.street &&
    typeof landmark.address.street === 'string' &&
    landmark.address.city &&
    typeof landmark.address.city === 'string' &&
    landmark.address.country &&
    typeof landmark.address.country === 'string'
  );

  // Validate location name and description completeness
  const hasDetailedInfo =
    landmark.name.length > 5 &&
    landmark.description.length > 20 &&
    landmark.facts.length >= 3 &&
    landmark.historicalSignificance.length > 30 &&
    landmark.culturalSignificance.length > 30;

  return hasValidPrecision && hasValidBoundsPrecision && hasValidAddress && hasDetailedInfo;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'score_1000',
    name: 'Globe Trotter',
    description: 'Reach a score of 1,000 points',
    icon: '🌍',
    type: 'score',
    requirement: 1000
  },
  {
    id: 'score_5000',
    name: 'World Explorer',
    description: 'Reach a score of 5,000 points',
    icon: '🗺️',
    type: 'score',
    requirement: 5000
  },
  {
    id: 'score_10000',
    name: 'Geography Master',
    description: 'Reach a score of 10,000 points',
    icon: '🏆',
    type: 'score',
    requirement: 10000
  },
  {
    id: 'games_10',
    name: 'Dedicated Explorer',
    description: 'Play 10 games',
    icon: '🧭',
    type: 'games',
    requirement: 10
  },
  {
    id: 'games_50',
    name: 'Adventure Seeker',
    description: 'Play 50 games',
    icon: '🎯',
    type: 'games',
    requirement: 50
  },
  {
    id: 'accuracy_90',
    name: 'Precision Navigator',
    description: 'Achieve 90% accuracy in a game',
    icon: '🎯',
    type: 'accuracy',
    requirement: 90
  },
  {
    id: 'speed_10',
    name: 'Lightning Fast',
    description: 'Find a location in under 10 seconds',
    icon: '⚡',
    type: 'speed',
    requirement: 10
  },
  {
    id: 'continent_master',
    name: 'Continent Master',
    description: 'Win games in all continents',
    icon: '🌎',
    type: 'special',
    requirement: 1
  },
  {
    id: 'hidden_gems_5',
    name: 'Hidden Treasures',
    description: 'Discover 5 hidden gems',
    icon: '💎',
    type: 'special',
    requirement: 5
  }
];

async function generateLocationBatch(gameType: GameType): Promise<GameData[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
  const prompt = `${PROMPTS[gameType]}

Follow these rules exactly:
1. Return ONLY valid JSON, no other text
2. Each location must have exact numeric coordinates
3. Use the exact format below
4. Include all required fields
5. No trailing commas
6. No comments
7. Validate JSON structure

{
  "landmarks": [
    {
      "name": "Hidden Coffee Roastery",
      "description": "Local favorite coffee roastery hidden in an old warehouse district",
      "lat": 40.415363,
      "lng": -3.709609,
      "country": "Spain",
      "countryBounds": {
        "north": 43.79,
        "south": 36.00,
        "east": 4.33,
        "west": -9.30
      },
      "facts": [
        "Family-owned since 1985",
        "Roasts beans from 12 different countries",
        "Known only to locals",
        "Hosts underground jazz nights"
      ],
      "historicalSignificance": "Located in a converted 1920s grain warehouse, representing the area's industrial heritage.",
      "culturalSignificance": "A gathering spot for local artists and musicians, fostering community creativity.",
      "locationType": "hiddenGem"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const jsonStr = jsonMatch[0];
    
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      const cleanedJson = jsonStr
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
      
      try {
        data = JSON.parse(cleanedJson);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        throw new Error('Invalid JSON structure in response');
      }
    }

    if (!Array.isArray(data?.landmarks)) {
      throw new Error('Response missing landmarks array');
    }

    return data.landmarks
      .filter((landmark: GeneratedLandmark) => {
        const hasValidCoordinates =
          typeof landmark.lat === 'number' &&
          typeof landmark.lng === 'number' &&
          !isNaN(landmark.lat) &&
          !isNaN(landmark.lng) &&
          landmark.lat >= -90 &&
          landmark.lat <= 90 &&
          landmark.lng >= -180 &&
          landmark.lng <= 180;

        const hasValidBounds =
          landmark.countryBounds &&
          typeof landmark.countryBounds.north === 'number' &&
          typeof landmark.countryBounds.south === 'number' &&
          typeof landmark.countryBounds.east === 'number' &&
          typeof landmark.countryBounds.west === 'number' &&
          landmark.countryBounds.north > landmark.countryBounds.south &&
          landmark.countryBounds.north <= 90 &&
          landmark.countryBounds.south >= -90 &&
          landmark.countryBounds.east > landmark.countryBounds.west &&
          landmark.countryBounds.east <= 180 &&
          landmark.countryBounds.west >= -180;

        const isWithinBounds =
          hasValidBounds &&
          landmark.lat >= landmark.countryBounds.south &&
          landmark.lat <= landmark.countryBounds.north &&
          landmark.lng >= landmark.countryBounds.west &&
          landmark.lng <= landmark.countryBounds.east;

        const hasRequiredFields =
          typeof landmark.name === 'string' &&
          typeof landmark.description === 'string' &&
          typeof landmark.country === 'string' &&
          Array.isArray(landmark.facts) &&
          landmark.facts.length > 0 &&
          typeof landmark.historicalSignificance === 'string' &&
          typeof landmark.culturalSignificance === 'string' &&
          typeof landmark.locationType === 'string';

        return hasValidCoordinates && hasValidBounds && isWithinBounds && hasRequiredFields && validateLocation(landmark);
      })
      .map((landmark: GeneratedLandmark) => {
        const targetLocation = {
          lat: landmark.lat,
          lng: landmark.lng,
          name: landmark.name,
          description: landmark.description
        };
        
        return {
          targetLocation,
          startLocation: generateStartPosition(
            targetLocation,
            landmark.countryBounds,
            false
          ),
          country: landmark.country,
          countryBounds: landmark.countryBounds,
          viewPosition: generateViewPosition(targetLocation, landmark.countryBounds),
          locationInfo: {
            facts: landmark.facts,
            historicalSignificance: landmark.historicalSignificance,
            culturalSignificance: landmark.culturalSignificance,
            locationType: landmark.locationType
          }
        };
      });
  } catch (error) {
    logger.error('Error generating location batch:', error);
    throw new Error('Failed to generate location batch');
  }
}

async function getLocationBank(userId: string, gameType: GameType): Promise<LocationBank> {
  try {
    const bankRef = doc(db, 'locationBanks', `${userId}_${gameType}`);
    const bankDoc = await getDoc(bankRef);

    if (bankDoc.exists()) {
      const data = bankDoc.data();
      return {
        locations: data.locations || [],
        lastUpdated: data.lastUpdated?.toDate() || new Date(),
      };
    }

    const initialLocations = await generateLocationBatch(gameType);
    const newBank = {
      locations: initialLocations,
      lastUpdated: new Date(),
    };
    await setDoc(bankRef, {
      locations: initialLocations,
      lastUpdated: new Date(),
    });
    return newBank;
  } catch (error) {
    logger.error('Error getting location bank:', error);
    throw new Error('Failed to get location bank');
  }
}

async function updateLocationBank(
  userId: string,
  gameType: GameType,
  locations: GameData[]
): Promise<void> {
  try {
    const bankRef = doc(db, 'locationBanks', `${userId}_${gameType}`);
    await setDoc(bankRef, {
      locations,
      lastUpdated: new Date(),
    });
  } catch (error) {
    logger.error('Error updating location bank:', error);
    throw new Error('Failed to update location bank');
  }
}

export const getGameData = async (userId: string): Promise<GameData> => {
  // Default to 'classic' game type for backward compatibility
  return getGameDataByType(userId, 'classic');
};

export function isValidCoordinates(
  location: { lat: number; lng: number },
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return (
    location.lat >= bounds.south &&
    location.lat <= bounds.north &&
    location.lng >= bounds.west &&
    location.lng <= bounds.east
  );
}

export const getGameDataByType = async (userId: string, gameType: GameType): Promise<GameData> => {
  try {
    let bank = await getLocationBank(userId, gameType);

    if (bank.locations.length <= MIN_LOCATIONS_THRESHOLD) {
      const newLocations = await generateLocationBatch(gameType);
      bank.locations.push(...newLocations);
      await updateLocationBank(userId, gameType, bank.locations);
    }

    if (bank.locations.length === 0) {
      throw new Error('No locations available in the bank');
    }

    const randomIndex = Math.floor(Math.random() * bank.locations.length);
    const selectedLocation = bank.locations[randomIndex];
    bank.locations.splice(randomIndex, 1);
    await updateLocationBank(userId, gameType, bank.locations);

    return selectedLocation;
  } catch (error) {
    logger.error('Error getting game data:', error);
    throw new Error('Failed to get game data');
  }
};

function generateStartPosition(
  target: { lat: number; lng: number },
  bounds: { north: number; south: number; east: number; west: number },
  isPreview: boolean = false
): { lat: number; lng: number } {
  if (isPreview) {
    const previewRadius = 500;
    const angle = Math.random() * 2 * Math.PI;
    const latOffset = (previewRadius / 111111) * Math.cos(angle);
    const lngOffset = (previewRadius / (111111 * Math.cos(target.lat * Math.PI / 180))) * Math.sin(angle);
    return {
      lat: target.lat + latOffset,
      lng: target.lng + lngOffset
    };
  }

  const minRadius = 2000;
  const maxRadius = 10000;
  const radius = Math.random() * (maxRadius - minRadius) + minRadius;
  const angle = Math.random() * 2 * Math.PI;
  const latOffset = (radius / 111111) * Math.cos(angle);
  const lngOffset = (radius / (111111 * Math.cos(target.lat * Math.PI / 180))) * Math.sin(angle);
  let newLat = target.lat + latOffset;
  let newLng = target.lng + lngOffset;
  newLat = Math.max(bounds.south, Math.min(bounds.north, newLat));
  newLng = Math.max(bounds.west, Math.min(bounds.east, newLng));
  return { lat: newLat, lng: newLng };
}

function generateViewPosition(
  target: { lat: number; lng: number },
  bounds: { north: number; south: number; east: number; west: number }
): { lat: number; lng: number } {
  const offsetRange = 0.001;
  const angle = Math.random() * 2 * Math.PI;
  
  const latOffset = Math.cos(angle) * offsetRange;
  const lngOffset = Math.sin(angle) * offsetRange;
  
  const lat = Math.max(
    bounds.south,
    Math.min(bounds.north, target.lat + latOffset)
  );
  const lng = Math.max(
    bounds.west,
    Math.min(bounds.east, target.lng + lngOffset)
  );
  
  return { lat, lng };
}

export const calculateScore = (distance: number, timeLeft: number): number => {
  const baseScore = 1000;
  const distanceDeduction = Math.min(1000, distance / 10);
  const timeBonus = timeLeft * 8.33;
  return Math.max(0, Math.round(baseScore - distanceDeduction + timeBonus));
};

export const checkWinCondition = (
  position: google.maps.LatLngLiteral,
  polygonCoordinates: google.maps.LatLngLiteral[]
): boolean => {
  if (!position || !polygonCoordinates || polygonCoordinates.length < 3) {
    console.log('Invalid position or polygon coordinates');
    return false;
  }

  try {
    const polygonPath = polygonCoordinates.map(coord => ({
      lat: parseFloat(coord.lat.toFixed(6)),
      lng: parseFloat(coord.lng.toFixed(6))
    }));

    const bounds = polygonPath.reduce((acc, coord) => ({
      north: Math.max(acc.north, coord.lat),
      south: Math.min(acc.south, coord.lat),
      east: Math.max(acc.east, coord.lng),
      west: Math.min(acc.west, coord.lng)
    }), {
      north: -90,
      south: 90,
      east: -180,
      west: 180
    });

    if (
      position.lat < bounds.south ||
      position.lat > bounds.north ||
      position.lng < bounds.west ||
      position.lng > bounds.east
    ) {
      return false;
    }

    let inside = false;
    for (let i = 0, j = polygonPath.length - 1; i < polygonPath.length; j = i++) {
      const xi = polygonPath[i].lng;
      const yi = polygonPath[i].lat;
      const xj = polygonPath[j].lng;
      const yj = polygonPath[j].lat;
      const intersect = ((yi > position.lat) !== (yj > position.lat)) &&
        (position.lng < (xj - xi) * (position.lat - yi) / (yj - yi) + xi);
      
      if (intersect) inside = !inside;
    }

    if (!inside) {
      const tolerance = 0.0001;
      for (let i = 0; i < polygonPath.length; i++) {
        const j = (i + 1) % polygonPath.length;
        const distance = distanceToSegment(
          position,
          polygonPath[i],
          polygonPath[j]
        );
        if (distance < tolerance) {
          inside = true;
          break;
        }
      }
    }

    return inside;
  } catch (error) {
    console.error('Error checking win condition:', error);
    return false;
  }
};

function distanceToSegment(
  point: google.maps.LatLngLiteral,
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral
): number {
  const A = point.lng - start.lng;
  const B = point.lat - start.lat;
  const C = end.lng - start.lng;
  const D = end.lat - start.lat;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;
  if (param < 0) {
    xx = start.lng;
    yy = start.lat;
  } else if (param > 1) {
    xx = end.lng;
    yy = end.lat;
  } else {
    xx = start.lng + param * C;
    yy = start.lat + param * D;
  }

  const dx = point.lng - xx;
  const dy = point.lat - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

export const checkAchievements = (
  score: number,
  gamesPlayed: number,
  accuracy: number,
  fastestTime: number,
  continentsExplored: string[],
  hiddenGemsFound: number
): Achievement[] => {
  const unlockedAchievements: Achievement[] = [];

  ACHIEVEMENTS.forEach(achievement => {
    switch (achievement.type) {
      case 'score':
        if (score >= achievement.requirement) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'games':
        if (gamesPlayed >= achievement.requirement) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'accuracy':
        if (accuracy >= achievement.requirement) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'speed':
        if (fastestTime <= achievement.requirement) {
          unlockedAchievements.push(achievement);
        }
        break;
      case 'special':
        if (achievement.id === 'continent_master' && continentsExplored.length >= 3) {
          unlockedAchievements.push(achievement);
        }
        if (achievement.id === 'hidden_gems_5' && hiddenGemsFound >= 5) {
          unlockedAchievements.push(achievement);
        }
        break;
    }
  });

  return unlockedAchievements;
};