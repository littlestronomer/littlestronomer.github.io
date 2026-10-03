import type { Look } from './starChart'

// The constellations drawn behind the page. Star positions are right ascension and declination
// in degrees (J2000). `size` 2 marks the sky's brightest stars, 1 the easy ones, 0 the faint
// ones; `look` gives the color of the few stars that are clearly orange or yellow.

type Star = { ra: number; dec: number; size: number; look?: Look }

export type Constellation = {
  name: string
  /**
   * Where it sits: beside the page on the left or right, behind the sidebar, or with the other
   * northern constellations in the patch of open sky above the footer.
   */
  lane: 'left' | 'right' | 'side' | 'north'
  /** How far down the sky it sits, from 0 (top) to 1 (bottom). The northern ones are placed by the page. */
  down: number
  stars: Star[]
  /** Pairs of stars, by position in `stars`, joined by a line. */
  lines: [number, number][]
  /** A few words shown beside the cursor while it is lit. */
  whisper?: string
  /** Puts the name above the stars instead of below them. */
  nameAbove?: boolean
}

const chain = (...stars: number[]) => stars.slice(1).map((star, i): [number, number] => [stars[i], star])

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'CASSIOPEIA',
    lane: 'north',
    down: 1,
    whisper: 'How I would look for her',
    stars: [
      { ra: 2.295, dec: 59.15, size: 1 }, // Caph
      { ra: 10.127, dec: 56.537, size: 1, look: 'gold' }, // Schedar
      { ra: 14.177, dec: 60.717, size: 1 }, // Gamma Cassiopeiae
      { ra: 21.454, dec: 60.235, size: 1 }, // Ruchbah
      { ra: 28.599, dec: 63.67, size: 0 }, // Segin
    ],
    lines: chain(0, 1, 2, 3, 4),
  },
  {
    name: 'CYGNUS',
    lane: 'right',
    down: 0.08,
    stars: [
      { ra: 310.358, dec: 45.28, size: 2 }, // Deneb
      { ra: 305.557, dec: 40.257, size: 1 }, // Sadr
      { ra: 299.077, dec: 35.083, size: 0 }, // Eta Cygni
      { ra: 292.68, dec: 27.96, size: 1, look: 'gold' }, // Albireo
      { ra: 296.244, dec: 45.131, size: 1 }, // Delta Cygni
      { ra: 311.553, dec: 33.97, size: 1 }, // Epsilon Cygni
    ],
    lines: [...chain(0, 1, 2, 3), ...chain(4, 1, 5)],
  },
  {
    name: 'GEMINI',
    lane: 'left',
    down: 0.1,
    stars: [
      { ra: 113.65, dec: 31.888, size: 1 }, // Castor
      { ra: 116.329, dec: 28.026, size: 2, look: 'gold' }, // Pollux
      { ra: 107.785, dec: 30.245, size: 0 }, // Tau Geminorum
      { ra: 100.983, dec: 25.131, size: 1 }, // Mebsuta
      { ra: 95.74, dec: 22.514, size: 1, look: 'red' }, // Tejat
      { ra: 93.72, dec: 22.507, size: 0 }, // Propus
      { ra: 110.031, dec: 21.982, size: 0 }, // Wasat
      { ra: 106.027, dec: 20.57, size: 0 }, // Mekbuda
      { ra: 99.428, dec: 16.399, size: 1 }, // Alhena
    ],
    lines: [[0, 1], ...chain(0, 2, 3, 4, 5), ...chain(1, 6, 7, 8)],
  },
  {
    name: 'LEO',
    lane: 'right',
    down: 0.27,
    stars: [
      { ra: 152.093, dec: 11.967, size: 2 }, // Regulus
      { ra: 151.833, dec: 16.763, size: 0 }, // Eta Leonis
      { ra: 154.993, dec: 19.842, size: 1, look: 'gold' }, // Algieba
      { ra: 154.173, dec: 23.417, size: 0 }, // Adhafera
      { ra: 148.191, dec: 26.007, size: 0 }, // Rasalas
      { ra: 146.463, dec: 23.774, size: 1 }, // Epsilon Leonis
      { ra: 168.527, dec: 20.524, size: 1 }, // Zosma
      { ra: 168.56, dec: 15.43, size: 0 }, // Chertan
      { ra: 177.265, dec: 14.572, size: 1 }, // Denebola
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5), ...chain(2, 6, 8, 7, 0), [6, 7]],
  },
  {
    name: 'BOOTES',
    lane: 'left',
    down: 0.34,
    stars: [
      { ra: 213.915, dec: 19.182, size: 2, look: 'red' }, // Arcturus
      { ra: 221.247, dec: 27.074, size: 1, look: 'gold' }, // Izar
      { ra: 228.876, dec: 33.315, size: 0 }, // Delta Bootis
      { ra: 225.487, dec: 40.391, size: 0 }, // Nekkar
      { ra: 218.02, dec: 38.308, size: 1 }, // Seginus
      { ra: 217.958, dec: 30.371, size: 0 }, // Rho Bootis
      { ra: 208.671, dec: 18.398, size: 1 }, // Muphrid
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5, 0), [0, 6]],
  },
  {
    name: 'TAURUS',
    lane: 'right',
    down: 0.45,
    stars: [
      { ra: 68.98, dec: 16.509, size: 2, look: 'red' }, // Aldebaran
      { ra: 67.165, dec: 15.871, size: 0 }, // Theta Tauri
      { ra: 64.948, dec: 15.628, size: 0 }, // Gamma Tauri
      { ra: 65.734, dec: 17.543, size: 0 }, // Delta Tauri
      { ra: 67.154, dec: 19.18, size: 0 }, // Ain
      { ra: 81.573, dec: 28.608, size: 1 }, // Elnath
      { ra: 84.411, dec: 21.143, size: 1 }, // Zeta Tauri
      { ra: 60.17, dec: 12.49, size: 0 }, // Lambda Tauri
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5), [0, 6], [2, 7]],
  },
  {
    name: 'LYRA',
    lane: 'side',
    down: 0.56,
    stars: [
      { ra: 279.235, dec: 38.784, size: 2 }, // Vega
      { ra: 281.193, dec: 37.605, size: 0 }, // Zeta Lyrae
      { ra: 283.626, dec: 36.899, size: 0 }, // Delta Lyrae
      { ra: 284.736, dec: 32.69, size: 1 }, // Sulafat
      { ra: 282.52, dec: 33.363, size: 0 }, // Sheliak
    ],
    lines: chain(0, 1, 2, 3, 4, 1),
  },
  {
    name: 'CANIS MAJOR',
    lane: 'right',
    down: 0.63,
    stars: [
      { ra: 101.287, dec: -16.716, size: 2 }, // Sirius
      { ra: 95.675, dec: -17.956, size: 1 }, // Mirzam
      { ra: 105.756, dec: -23.833, size: 1 }, // Omicron2 Canis Majoris
      { ra: 107.098, dec: -26.393, size: 1 }, // Wezen
      { ra: 104.656, dec: -28.972, size: 1 }, // Adhara
      { ra: 111.024, dec: -29.303, size: 1 }, // Aludra
    ],
    lines: [[0, 1], ...chain(0, 2, 3, 4), [3, 5]],
  },
  {
    name: 'SCORPIUS',
    lane: 'left',
    down: 0.6,
    stars: [
      { ra: 241.359, dec: -19.806, size: 1 }, // Graffias
      { ra: 240.083, dec: -22.622, size: 1 }, // Dschubba
      { ra: 239.713, dec: -26.114, size: 1 }, // Pi Scorpii
      { ra: 245.297, dec: -25.593, size: 1 }, // Sigma Scorpii
      { ra: 247.352, dec: -26.432, size: 2, look: 'red' }, // Antares
      { ra: 248.971, dec: -28.216, size: 1 }, // Tau Scorpii
      { ra: 252.541, dec: -34.293, size: 1 }, // Epsilon Scorpii
      { ra: 252.968, dec: -38.047, size: 1 }, // Mu Scorpii
      { ra: 253.646, dec: -42.361, size: 0 }, // Zeta Scorpii
      { ra: 258.038, dec: -43.239, size: 0 }, // Eta Scorpii
      { ra: 264.33, dec: -42.998, size: 1 }, // Sargas
      { ra: 266.896, dec: -40.127, size: 1 }, // Iota Scorpii
      { ra: 265.622, dec: -39.03, size: 1 }, // Kappa Scorpii
      { ra: 263.402, dec: -37.104, size: 1 }, // Shaula
    ],
    lines: [[0, 1], [2, 1], ...chain(1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)],
  },
  {
    name: 'AQUILA',
    lane: 'side',
    down: 0.72,
    stars: [
      { ra: 297.696, dec: 8.868, size: 2 }, // Altair
      { ra: 296.565, dec: 10.613, size: 1, look: 'gold' }, // Tarazed
      { ra: 298.828, dec: 6.407, size: 0 }, // Alshain
      { ra: 291.375, dec: 3.115, size: 0 }, // Delta Aquilae
      { ra: 286.353, dec: 13.863, size: 1 }, // Zeta Aquilae
      { ra: 302.826, dec: -0.821, size: 0 }, // Theta Aquilae
      { ra: 286.562, dec: -4.883, size: 0 }, // Lambda Aquilae
    ],
    lines: [...chain(1, 0, 2), [0, 3], [3, 4], [3, 5], [3, 6]],
  },
  {
    name: 'URSA MINOR',
    lane: 'north',
    down: 1,
    nameAbove: true,
    stars: [
      { ra: 37.955, dec: 89.264, size: 1, look: 'gold' }, // Polaris
      { ra: 263.054, dec: 86.586, size: 0 }, // Yildun
      { ra: 251.493, dec: 82.037, size: 0 }, // Epsilon Ursae Minoris
      { ra: 236.015, dec: 77.794, size: 0 }, // Zeta Ursae Minoris
      { ra: 222.676, dec: 74.156, size: 1, look: 'gold' }, // Kochab
      { ra: 230.182, dec: 71.834, size: 1 }, // Pherkad
      { ra: 244.376, dec: 75.755, size: 0 }, // Eta Ursae Minoris
    ],
    lines: chain(0, 1, 2, 3, 4, 5, 6, 3),
  },
  {
    name: 'URSA MAJOR',
    lane: 'north',
    down: 1,
    stars: [
      { ra: 165.932, dec: 61.751, size: 1, look: 'gold' }, // Dubhe
      { ra: 165.46, dec: 56.382, size: 1 }, // Merak
      { ra: 178.458, dec: 53.695, size: 1 }, // Phecda
      { ra: 183.857, dec: 57.033, size: 0 }, // Megrez
      { ra: 193.507, dec: 55.96, size: 1 }, // Alioth
      { ra: 200.981, dec: 54.925, size: 1 }, // Mizar
      { ra: 206.885, dec: 49.313, size: 1 }, // Alkaid
    ],
    lines: [...chain(0, 1, 2, 3, 0), ...chain(3, 4, 5, 6)],
  },
]

// The northern constellations share one chart around the celestial pole, drawn as they stand on
// a summer evening when you face north: the Great Bear on the left, the Queen on the right.
/** The right ascension, in degrees, that points straight up from the pole on that chart. */
export const NORTH_UP = 275

/**
 * How to find the Queen: follow the two stars at the end of the Great Bear's bowl (Merak, then
 * Dubhe) to the North Star, and keep going the same distance again to Cassiopeia. Each step
 * names a constellation and a star in it; the trail lights up while Cassiopeia is lit.
 */
export const WAY_TO_THE_QUEEN: { name: string; star: number }[] = [
  { name: 'URSA MAJOR', star: 1 },
  { name: 'URSA MAJOR', star: 0 },
  { name: 'URSA MINOR', star: 0 },
  { name: 'CASSIOPEIA', star: 2 },
]
