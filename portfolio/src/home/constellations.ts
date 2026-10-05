import type { Sight } from './deepSky'
import type { Look } from './starChart'

// The constellations drawn behind the page. Star positions are right ascension and declination
// in degrees (J2000). `size` 2 marks the sky's brightest stars, 1 the easy ones, 0 the faint
// ones; `look` gives the color of the few stars that are clearly orange or yellow.
//
// A constellation is flat only from where we stand: its stars lie at very different distances.
// Each star's distance is here, worked out from its parallax in the SIMBAD database of the
// Strasbourg astronomical Data Center, and the sky behind the page uses it to give every star a
// depth of its own.
//
// Beside most of the constellations are the galaxies, nebulae and star clusters that stargazers
// look for there, at their real places. Their positions, sizes, tilts and, where a parallax is
// known, distances are from SIMBAD too. Some belong to a neighboring constellation that is not
// drawn here: the Andromeda Galaxy, for one, is found by starting from Cassiopeia.

/** A star: its place in the sky, how bright and what color it is, and how far away, in light-years. */
type Star = { ra: number; dec: number; size: number; look?: Look; ly: number }

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
  /** The deep-sky objects drawn beside it. */
  sights?: Sight[]
  /** Puts the name above the stars instead of below them. */
  nameAbove?: boolean
}

const chain = (...stars: number[]) => stars.slice(1).map((star, i): [number, number] => [stars[i], star])

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'CASSIOPEIA',
    lane: 'north',
    down: 1,
    whisper: 'How I would see her',
    stars: [
      { ra: 2.295, dec: 59.15, size: 1, ly: 55 }, // Caph
      { ra: 10.127, dec: 56.537, size: 1, look: 'gold', ly: 231 }, // Schedar
      { ra: 14.177, dec: 60.717, size: 1, ly: 549 }, // Gamma Cassiopeiae
      { ra: 21.454, dec: 60.235, size: 1, ly: 99 }, // Ruchbah
      { ra: 28.599, dec: 63.67, size: 0, ly: 466 }, // Segin
    ],
    lines: chain(0, 1, 2, 3, 4),
    sights: [{ tag: 'M31', name: 'Andromeda Galaxy', ra: 10.685, dec: 41.269, shape: 'andromeda' }],
  },
  {
    name: 'CYGNUS',
    lane: 'right',
    down: 0.08,
    stars: [
      { ra: 310.358, dec: 45.28, size: 2, ly: 1412 }, // Deneb
      { ra: 305.557, dec: 40.257, size: 1, ly: 1832 }, // Sadr
      { ra: 299.077, dec: 35.083, size: 0, ly: 139 }, // Eta Cygni
      { ra: 292.68, dec: 27.96, size: 1, look: 'gold', ly: 363 }, // Albireo
      { ra: 296.244, dec: 45.131, size: 1, ly: 154 }, // Delta Cygni
      { ra: 311.553, dec: 33.97, size: 1, ly: 76 }, // Epsilon Cygni
    ],
    lines: [...chain(0, 1, 2, 3), ...chain(4, 1, 5)],
    sights: [
      { tag: 'NGC 7000', name: 'North America Nebula', ra: 314.696, dec: 44.33, shape: 'northAmerica' },
      { tag: 'VEIL', name: 'Veil Nebula', ra: 312.75, dec: 30.667, shape: 'veil' },
    ],
  },
  {
    name: 'GEMINI',
    lane: 'left',
    down: 0.1,
    stars: [
      { ra: 113.65, dec: 31.888, size: 1, ly: 51 }, // Castor
      { ra: 116.329, dec: 28.026, size: 2, look: 'gold', ly: 34 }, // Pollux
      { ra: 107.785, dec: 30.245, size: 0, ly: 392 }, // Tau Geminorum
      { ra: 100.983, dec: 25.131, size: 1, ly: 870 }, // Mebsuta
      { ra: 95.74, dec: 22.514, size: 1, look: 'red', ly: 232 }, // Tejat
      { ra: 93.72, dec: 22.507, size: 0, ly: 689 }, // Propus
      { ra: 110.031, dec: 21.982, size: 0, ly: 61 }, // Wasat
      { ra: 106.027, dec: 20.57, size: 0, ly: 1061 }, // Mekbuda
      { ra: 99.428, dec: 16.399, size: 1, ly: 109 }, // Alhena
    ],
    lines: [[0, 1], ...chain(0, 2, 3, 4, 5), ...chain(1, 6, 7, 8)],
    sights: [{ tag: 'M35', name: 'Open cluster M35', ra: 92.272, dec: 24.336, ly: 2886, shape: 'cluster', across: 38 }],
  },
  {
    name: 'LEO',
    lane: 'right',
    down: 0.27,
    stars: [
      { ra: 152.093, dec: 11.967, size: 2, ly: 79 }, // Regulus
      { ra: 151.833, dec: 16.763, size: 0, ly: 1816 }, // Eta Leonis
      { ra: 154.993, dec: 19.842, size: 1, look: 'gold', ly: 130 }, // Algieba
      { ra: 154.173, dec: 23.417, size: 0, ly: 232 }, // Adhafera
      { ra: 148.191, dec: 26.007, size: 0, ly: 125 }, // Rasalas
      { ra: 146.463, dec: 23.774, size: 1, ly: 227 }, // Epsilon Leonis
      { ra: 168.527, dec: 20.524, size: 1, ly: 58 }, // Zosma
      { ra: 168.56, dec: 15.43, size: 0, ly: 161 }, // Chertan
      { ra: 177.265, dec: 14.572, size: 1, ly: 36 }, // Denebola
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5), ...chain(2, 6, 8, 7, 0), [6, 7]],
    sights: [{ tag: 'M66', name: 'Leo Triplet', ra: 170.063, dec: 12.992, shape: 'triplet' }],
  },
  {
    name: 'BOOTES',
    lane: 'left',
    down: 0.34,
    stars: [
      { ra: 213.915, dec: 19.182, size: 2, look: 'red', ly: 37 }, // Arcturus
      { ra: 221.247, dec: 27.074, size: 1, look: 'gold', ly: 236 }, // Izar
      { ra: 228.876, dec: 33.315, size: 0, ly: 120 }, // Delta Bootis
      { ra: 225.487, dec: 40.391, size: 0, ly: 235 }, // Nekkar
      { ra: 218.02, dec: 38.308, size: 1, ly: 86 }, // Seginus
      { ra: 217.958, dec: 30.371, size: 0, ly: 164 }, // Rho Bootis
      { ra: 208.671, dec: 18.398, size: 1, ly: 37 }, // Muphrid
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5, 0), [0, 6]],
    sights: [{ tag: 'M3', name: 'Globular cluster M3', ra: 205.548, dec: 28.377, ly: 29651, shape: 'globular' }],
  },
  {
    name: 'TAURUS',
    lane: 'right',
    down: 0.45,
    stars: [
      { ra: 68.98, dec: 16.509, size: 2, look: 'red', ly: 67 }, // Aldebaran
      { ra: 67.165, dec: 15.871, size: 0, ly: 150 }, // Theta Tauri
      { ra: 64.948, dec: 15.628, size: 0, ly: 151 }, // Gamma Tauri
      { ra: 65.734, dec: 17.543, size: 0, ly: 161 }, // Delta Tauri
      { ra: 67.154, dec: 19.18, size: 0, ly: 146 }, // Ain
      { ra: 81.573, dec: 28.608, size: 1, ly: 134 }, // Elnath
      { ra: 84.411, dec: 21.143, size: 1, ly: 445 }, // Zeta Tauri
      { ra: 60.17, dec: 12.49, size: 0, ly: 406 }, // Lambda Tauri
    ],
    lines: [...chain(0, 1, 2, 3, 4, 5), [0, 6], [2, 7]],
    sights: [
      { tag: 'M45', name: 'The Pleiades', ra: 56.601, dec: 24.114, ly: 443, shape: 'pleiades' },
      { tag: 'M1', name: 'Crab Nebula', ra: 83.632, dec: 22.017, shape: 'crab' },
    ],
  },
  {
    name: 'LYRA',
    lane: 'side',
    down: 0.56,
    stars: [
      { ra: 279.235, dec: 38.784, size: 2, ly: 25 }, // Vega
      { ra: 281.193, dec: 37.605, size: 0, ly: 158 }, // Zeta Lyrae
      { ra: 283.626, dec: 36.899, size: 0, ly: 770 }, // Delta Lyrae
      { ra: 284.736, dec: 32.69, size: 1, ly: 657 }, // Sulafat
      { ra: 282.52, dec: 33.363, size: 0, ly: 906 }, // Sheliak
    ],
    lines: chain(0, 1, 2, 3, 4, 1),
    sights: [{ tag: 'M57', name: 'Ring Nebula', ra: 283.396, dec: 33.029, ly: 2569, shape: 'ring' }],
  },
  {
    name: 'CANIS MAJOR',
    lane: 'right',
    down: 0.63,
    stars: [
      { ra: 101.287, dec: -16.716, size: 2, ly: 9 }, // Sirius
      { ra: 95.675, dec: -17.956, size: 1, ly: 493 }, // Mirzam
      { ra: 105.756, dec: -23.833, size: 1, ly: 3742 }, // Omicron2 Canis Majoris
      { ra: 107.098, dec: -26.393, size: 1, ly: 1607 }, // Wezen
      { ra: 104.656, dec: -28.972, size: 1, ly: 405 }, // Adhara
      { ra: 111.024, dec: -29.303, size: 1, ly: 1989 }, // Aludra
    ],
    lines: [[0, 1], ...chain(0, 2, 3, 4), [3, 5]],
    sights: [{ tag: 'M41', name: 'Open cluster M41', ra: 101.499, dec: -20.716, ly: 2398, shape: 'cluster', across: 40 }],
  },
  {
    name: 'SCORPIUS',
    lane: 'left',
    down: 0.6,
    stars: [
      { ra: 241.359, dec: -19.806, size: 1, ly: 404 }, // Graffias
      { ra: 240.083, dec: -22.622, size: 1, ly: 491 }, // Dschubba
      { ra: 239.713, dec: -26.114, size: 1, ly: 586 }, // Pi Scorpii
      { ra: 245.297, dec: -25.593, size: 1, ly: 697 }, // Sigma Scorpii
      { ra: 247.352, dec: -26.432, size: 2, look: 'red', ly: 554 }, // Antares
      { ra: 248.971, dec: -28.216, size: 1, ly: 474 }, // Tau Scorpii
      { ra: 252.541, dec: -34.293, size: 1, ly: 64 }, // Epsilon Scorpii
      { ra: 252.968, dec: -38.047, size: 1, ly: 1741 }, // Mu Scorpii
      { ra: 253.646, dec: -42.361, size: 0, ly: 135 }, // Zeta Scorpii
      { ra: 258.038, dec: -43.239, size: 0, ly: 73 }, // Eta Scorpii
      { ra: 264.33, dec: -42.998, size: 1, ly: 300 }, // Sargas
      { ra: 266.896, dec: -40.127, size: 1, ly: 2301 }, // Iota Scorpii
      { ra: 265.622, dec: -39.03, size: 1, ly: 483 }, // Kappa Scorpii
      { ra: 263.402, dec: -37.104, size: 1, ly: 571 }, // Shaula
    ],
    lines: [[0, 1], [2, 1], ...chain(1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)],
    sights: [{ tag: 'M4', name: 'Globular cluster M4', ra: 245.897, dec: -26.526, ly: 5866, shape: 'globular' }],
  },
  {
    name: 'AQUILA',
    lane: 'side',
    down: 0.72,
    stars: [
      { ra: 297.696, dec: 8.868, size: 2, ly: 17 }, // Altair
      { ra: 296.565, dec: 10.613, size: 1, look: 'gold', ly: 583 }, // Tarazed
      { ra: 298.828, dec: 6.407, size: 0, ly: 44 }, // Alshain
      { ra: 291.375, dec: 3.115, size: 0, ly: 51 }, // Delta Aquilae
      { ra: 286.353, dec: 13.863, size: 1, ly: 85 }, // Zeta Aquilae
      { ra: 302.826, dec: -0.821, size: 0, ly: 229 }, // Theta Aquilae
      { ra: 286.562, dec: -4.883, size: 0, ly: 127 }, // Lambda Aquilae
    ],
    lines: [...chain(1, 0, 2), [0, 3], [3, 4], [3, 5], [3, 6]],
    sights: [{ tag: 'M11', name: 'Wild Duck Cluster', ra: 282.766, dec: -6.272, ly: 7638, shape: 'cluster', across: 9 }],
  },
  {
    name: 'URSA MINOR',
    lane: 'north',
    down: 1,
    nameAbove: true,
    stars: [
      { ra: 37.955, dec: 89.264, size: 1, look: 'gold', ly: 433 }, // Polaris
      { ra: 263.054, dec: 86.586, size: 0, ly: 182 }, // Yildun
      { ra: 251.493, dec: 82.037, size: 0, ly: 331 }, // Epsilon Ursae Minoris
      { ra: 236.015, dec: 77.794, size: 0, ly: 359 }, // Zeta Ursae Minoris
      { ra: 222.676, dec: 74.156, size: 1, look: 'gold', ly: 131 }, // Kochab
      { ra: 230.182, dec: 71.834, size: 1, ly: 494 }, // Pherkad
      { ra: 244.376, dec: 75.755, size: 0, ly: 98 }, // Eta Ursae Minoris
    ],
    lines: chain(0, 1, 2, 3, 4, 5, 6, 3),
  },
  {
    name: 'URSA MAJOR',
    lane: 'north',
    down: 1,
    stars: [
      { ra: 165.932, dec: 61.751, size: 1, look: 'gold', ly: 123 }, // Dubhe
      { ra: 165.46, dec: 56.382, size: 1, ly: 84 }, // Merak
      { ra: 178.458, dec: 53.695, size: 1, ly: 83 }, // Phecda
      { ra: 183.857, dec: 57.033, size: 0, ly: 81 }, // Megrez
      { ra: 193.507, dec: 55.96, size: 1, ly: 83 }, // Alioth
      { ra: 200.981, dec: 54.925, size: 1, ly: 81 }, // Mizar
      { ra: 206.885, dec: 49.313, size: 1, ly: 104 }, // Alkaid
    ],
    lines: [...chain(0, 1, 2, 3, 0), ...chain(3, 4, 5, 6)],
    sights: [
      { tag: 'M81', name: "Bode's Galaxy and the Cigar Galaxy", ra: 148.888, dec: 69.065, shape: 'bode' },
      { tag: 'M101', name: 'Pinwheel Galaxy', ra: 210.802, dec: 54.349, shape: 'pinwheel' },
      { tag: 'M51', name: 'Whirlpool Galaxy', ra: 202.47, dec: 47.195, shape: 'whirlpool' },
    ],
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
