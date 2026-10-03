// The battles played on the map in the Turkish theme. Each is a sketch of how the day went,
// following the usual account of it: bodies of soldiers are drawn as groups of dots that move,
// wheel and break as the battle did. The map is 72 pixels square, not to scale, with north
// roughly at the top where the lie of the land is known.
//
// Moments are counted in captions: 0 is the start, 1 the end of the first caption, and 2.5 is
// halfway through the third.

export type Point = [number, number]

/** Where a body of soldiers stands at one moment of the battle. */
export type Stand = {
  at: number
  x: number
  y: number
  /** How loose its order is: 1 is close order, more is spread out. */
  loose?: number
  /** How much of it is still in the fight, from 1 down to 0, as it breaks or leaves the field. */
  left?: number
  /** How far the two ends of its line stand ahead of the middle, in pixels: a crescent. */
  bend?: number
}

/** Shooting at another body (by its place in the list of units) or at a place on the map. */
export type Volley = { from: number; until: number; at: number | Point }

export type Unit = {
  side: 'turk' | 'foe'
  /** What each dot is: a body of men unless said otherwise. */
  kind?: 'men' | 'ships' | 'carts'
  dots: number
  /** How many dots stand side by side in each row. */
  wide: number
  /**
   * Which way its rows face, in degrees clockwise from the top of the map; the first row is the
   * front. A body keeps this for the whole battle: it moves, spreads and breaks, but the picture
   * of it never spins.
   */
  facing?: number
  path: Stand[]
  shoots?: Volley[]
}

/** A stretch of the map that is not open ground, given by its corners. */
export type Ground = { kind: 'water' | 'marsh' | 'heights'; shape: Point[] }

export type Aim = 'up' | 'down' | 'left' | 'right'

/** Something that stands on the ground. Rows run from one end of `line` to the other. */
export type Mark =
  | { kind: 'hills' | 'stakes' | 'carts' | 'tents'; line: [Point, Point] }
  | { kind: 'guns'; line: [Point, Point]; aim: Aim; fires?: [number, number][]; reach?: number }
  | { kind: 'wall' | 'river' | 'rail' | 'chain'; line: Point[] }
  | { kind: 'mines'; line: [Point, Point]; count: number; laid?: [number, number] }
  | { kind: 'town'; x: number; y: number }
  | { kind: 'label'; x: number; y: number; text: string }

export type Battle = {
  name: string
  /** A short name for the row of buttons: usually the year. */
  tag: string
  when: string
  where: string
  /** Who the white dots are, and who the dark ones are. */
  turks: string
  foes: string
  story: string
  /** What is happening, in order. */
  phases: string[]
  units: Unit[]
  ground?: Ground[]
  marks?: Mark[]
  /** Shells landing, mines going off. */
  blasts?: { at: number; x: number; y: number }[]
}

export const BATTLES: Battle[] = [
  {
    name: 'The Turan tactic',
    tag: 'Idea',
    when: 'the old way of the steppe',
    where: 'Any open country with somewhere to hide',
    turks: 'Steppe horse archers',
    foes: 'Whoever chases them',
    story:
      'Turkish military history calls it the Turan tactic, the crescent (hilal) or the wolf’s game (kurt oyunu): wear the enemy down, pretend to flee, and lead the chase to where the rest are waiting. Other steppe peoples, such as the Hungarians and the Mongols, fought the same way.',
    phases: [
      'Horse archers ride up, shoot, and ride away again. They never come close enough to be caught.',
      'Then they turn and run as if beaten, still shooting backwards from the saddle. The enemy breaks ranks to chase them.',
      'The chase leads between two rises. The riders hidden behind them come out on both sides.',
      'The ones who ran turn around. The trap is shut.',
    ],
    ground: [
      { kind: 'heights', shape: [[2, 34], [14, 31], [21, 38], [20, 50], [9, 54], [2, 48]] },
      { kind: 'heights', shape: [[70, 34], [58, 31], [51, 38], [52, 50], [63, 54], [70, 48]] },
    ],
    units: [
      {
        side: 'foe',
        dots: 35,
        wide: 7,
        facing: 180,
        path: [
          { at: 0, x: 36, y: 4 },
          { at: 1, x: 36, y: 17 },
          { at: 2, x: 36, y: 40, loose: 1.3 },
          { at: 3, x: 36, y: 45, loose: 1.2 },
          { at: 4, x: 36, y: 45, loose: 0.85, left: 0.35 },
        ],
      },
      {
        side: 'turk',
        dots: 16,
        wide: 8,
        path: [
          { at: 0, x: 36, y: 40 },
          { at: 0.45, x: 36, y: 31 },
          { at: 1, x: 36, y: 38 },
          { at: 1.2, x: 36, y: 40 },
          { at: 2, x: 36, y: 62, loose: 1.35 },
          { at: 3, x: 36, y: 63, loose: 1.3 },
          { at: 3.35, x: 36, y: 62, loose: 1.1 },
          { at: 4, x: 36, y: 57, loose: 1 },
        ],
        shoots: [
          { from: 0.25, until: 2.1, at: 0 },
          { from: 3.3, until: 4, at: 0 },
        ],
      },
      {
        side: 'turk',
        dots: 12,
        wide: 4,
        path: [
          { at: 0, x: 9, y: 61 },
          { at: 2, x: 9, y: 61 },
          { at: 2.5, x: 11, y: 44 },
          { at: 3, x: 19, y: 30 },
          { at: 4, x: 27, y: 33 },
        ],
        shoots: [{ from: 2.7, until: 4, at: 0 }],
      },
      {
        side: 'turk',
        dots: 12,
        wide: 4,
        path: [
          { at: 0, x: 63, y: 61 },
          { at: 2, x: 63, y: 61 },
          { at: 2.5, x: 61, y: 44 },
          { at: 3, x: 53, y: 30 },
          { at: 4, x: 45, y: 33 },
        ],
        shoots: [{ from: 2.7, until: 4, at: 0 }],
      },
    ],
  },
  {
    name: 'Malazgirt',
    tag: '1071',
    when: '26 August 1071',
    where: 'Near Malazgirt (Manzikert), north of Lake Van',
    turks: 'The Seljuks under Sultan Alp Arslan',
    foes: 'The Byzantine army of Emperor Romanos IV Diogenes',
    story:
      'The Turan tactic on a grand scale. Alp Arslan held the captured emperor for a week, treated him well, and set him free. Within a few years Turkish peoples were settling across Anatolia.',
    phases: [
      'The emperor advances in three bodies, with a reserve under Andronikos Doukas behind. Alp Arslan waits in a crescent.',
      'The center of the crescent keeps falling back. On the wings, horse archers shoot and ride off before anyone can close with them.',
      'By late afternoon the emperor has taken the Seljuk camp but caught no one. At dusk he orders the army back.',
      'The order is misunderstood on the right wing, and Doukas marches the reserve away instead of covering the retreat. The Seljuks charge.',
      'The right wing breaks first, then the left. The center is surrounded, and the emperor is wounded and taken prisoner.',
    ],
    marks: [
      { kind: 'tents', line: [[52, 33], [52, 39]] },
      { kind: 'tents', line: [[57, 31], [57, 41]] },
    ],
    units: [
      // 0: the emperor's center
      {
        side: 'foe',
        dots: 24,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: 17, y: 36 },
          { at: 1, x: 24, y: 36 },
          { at: 2, x: 37, y: 36, loose: 1.05 },
          { at: 2.6, x: 45, y: 36 },
          { at: 3, x: 45, y: 36 },
          { at: 4, x: 37, y: 36, loose: 1.15 },
          { at: 5, x: 34, y: 36, loose: 0.8, left: 0.4 },
        ],
      },
      // 1: the left wing under Bryennios, to the north
      {
        side: 'foe',
        dots: 12,
        wide: 4,
        facing: 90,
        path: [
          { at: 0, x: 17, y: 19 },
          { at: 1, x: 24, y: 19 },
          { at: 2, x: 37, y: 19, loose: 1.15 },
          { at: 2.6, x: 44, y: 20, loose: 1.25 },
          { at: 3, x: 44, y: 20 },
          { at: 4, x: 37, y: 21 },
          { at: 4.6, x: 33, y: 22, loose: 1.4, left: 0.9 },
          { at: 4.85, x: 23, y: 14, loose: 1.9, left: 0.3 },
          { at: 5, x: 15, y: 8, left: 0 },
        ],
      },
      // 2: the right wing under Alyates, to the south
      {
        side: 'foe',
        dots: 12,
        wide: 4,
        facing: 90,
        path: [
          { at: 0, x: 17, y: 53 },
          { at: 1, x: 24, y: 53 },
          { at: 2, x: 37, y: 53, loose: 1.15 },
          { at: 2.6, x: 44, y: 52, loose: 1.25 },
          { at: 3, x: 44, y: 52 },
          { at: 3.6, x: 41, y: 53, loose: 1.6 },
          { at: 4, x: 38, y: 54 },
          { at: 4.3, x: 31, y: 59, loose: 1.9, left: 0.5 },
          { at: 4.6, x: 19, y: 66, left: 0 },
        ],
      },
      // 3: the reserve under Doukas
      {
        side: 'foe',
        dots: 12,
        wide: 4,
        facing: 90,
        path: [
          { at: 0, x: 4, y: 36 },
          { at: 1, x: 11, y: 36 },
          { at: 2, x: 24, y: 36 },
          { at: 2.6, x: 32, y: 36 },
          { at: 3.2, x: 31, y: 36 },
          { at: 4, x: -12, y: 36 },
        ],
      },
      // 4: the Seljuk center
      {
        side: 'turk',
        dots: 14,
        wide: 7,
        facing: -90,
        path: [
          { at: 0, x: 44, y: 36, bend: 3 },
          { at: 1, x: 48, y: 36 },
          { at: 2, x: 60, y: 36, bend: 5 },
          { at: 2.6, x: 67, y: 36 },
          { at: 3, x: 67, y: 36 },
          { at: 4, x: 54, y: 36, bend: 3 },
          { at: 5, x: 44, y: 36, bend: 2 },
        ],
        shoots: [
          { from: 0.5, until: 2.7, at: 0 },
          { from: 4, until: 5, at: 0 },
        ],
      },
      // 5 to 8: the horns of the crescent, two bands of horse archers on each side
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        path: [
          { at: 0, x: 33, y: 11 },
          { at: 1, x: 32, y: 10 },
          { at: 1.5, x: 31, y: 11 },
          { at: 2, x: 34, y: 6 },
          { at: 2.5, x: 38, y: 10 },
          { at: 3, x: 38, y: 7 },
          { at: 4, x: 34, y: 10 },
          { at: 4.6, x: 28, y: 17 },
          { at: 5, x: 25, y: 31 },
        ],
        shoots: [
          { from: 0.8, until: 3, at: 1 },
          { from: 4, until: 4.7, at: 1 },
          { from: 4.7, until: 5, at: 0 },
        ],
      },
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        path: [
          { at: 0, x: 40, y: 20 },
          { at: 1, x: 43, y: 19 },
          { at: 2, x: 47, y: 13 },
          { at: 2.6, x: 51, y: 14 },
          { at: 3, x: 50, y: 12 },
          { at: 4, x: 45, y: 15 },
          { at: 4.6, x: 40, y: 20 },
          { at: 5, x: 36, y: 26 },
        ],
        shoots: [
          { from: 1.2, until: 3, at: 1 },
          { from: 4, until: 4.6, at: 1 },
          { from: 4.6, until: 5, at: 0 },
        ],
      },
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        path: [
          { at: 0, x: 33, y: 61 },
          { at: 1, x: 32, y: 62 },
          { at: 1.5, x: 31, y: 61 },
          { at: 2, x: 34, y: 66 },
          { at: 2.5, x: 38, y: 62 },
          { at: 3, x: 38, y: 65 },
          { at: 4, x: 34, y: 62 },
          { at: 4.3, x: 29, y: 56 },
          { at: 5, x: 25, y: 41 },
        ],
        shoots: [
          { from: 0.8, until: 3, at: 2 },
          { from: 4, until: 4.4, at: 2 },
          { from: 4.4, until: 5, at: 0 },
        ],
      },
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        path: [
          { at: 0, x: 40, y: 52 },
          { at: 1, x: 43, y: 53 },
          { at: 2, x: 47, y: 59 },
          { at: 2.6, x: 51, y: 58 },
          { at: 3, x: 50, y: 60 },
          { at: 4, x: 45, y: 57 },
          { at: 4.4, x: 40, y: 52 },
          { at: 5, x: 36, y: 46 },
        ],
        shoots: [
          { from: 1.2, until: 3, at: 2 },
          { from: 4, until: 4.4, at: 2 },
          { from: 4.4, until: 5, at: 0 },
        ],
      },
    ],
  },
  {
    name: 'Miryokefalon',
    tag: '1176',
    when: '17 September 1176',
    where: 'A mountain pass west of Konya',
    turks: 'The Seljuks of Anatolia under Sultan Kılıç Arslan II',
    foes: 'The Byzantine army of Emperor Manuel I Komnenos',
    story:
      'The last Byzantine attempt to win back the middle of Anatolia. The emperor himself compared the day to Malazgirt, a century before.',
    phases: [
      'Emperor Manuel’s army marches into a long mountain pass in a single column, with the baggage and the siege engines in the middle.',
      'The front divisions get through with little loss. As the rear comes in, the Seljuks come down from the heights on both sides.',
      'The right wing is broken. The pack animals are shot down, and the wrecked wagons block the road for everyone behind.',
      'The emperor pulls the survivors into order and forces a way past the wreck, out to the camp the vanguard has built beyond the pass.',
      'The siege engines are lost, so Konya cannot be taken. Sultan Kılıç Arslan offers peace, and the emperor takes it and marches home.',
    ],
    ground: [
      { kind: 'heights', shape: [[0, 0], [60, 0], [56, 10], [52, 22], [44, 26], [34, 28], [22, 26], [10, 29], [0, 28]] },
      { kind: 'heights', shape: [[0, 72], [60, 72], [56, 62], [52, 50], [44, 45], [34, 47], [22, 44], [10, 47], [0, 45]] },
    ],
    marks: [
      { kind: 'tents', line: [[62, 33], [67, 33]] },
      { kind: 'tents', line: [[62, 40], [67, 40]] },
    ],
    units: [
      // 0: the vanguard
      {
        side: 'foe',
        dots: 6,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: 6, y: 38 },
          { at: 1, x: 38, y: 37 },
          { at: 1.6, x: 56, y: 36 },
          { at: 2, x: 65, y: 30 },
        ],
      },
      // 1: the main division
      {
        side: 'foe',
        dots: 8,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -6, y: 38 },
          { at: 1, x: 26, y: 36 },
          { at: 1.6, x: 44, y: 36 },
          { at: 2, x: 56, y: 36 },
          { at: 2.4, x: 65, y: 43 },
        ],
      },
      // 2: the right wing under Baldwin of Antioch
      {
        side: 'foe',
        dots: 8,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -19, y: 38 },
          { at: 1, x: 13, y: 37 },
          { at: 2, x: 40, y: 36 },
          { at: 2.5, x: 42, y: 36, loose: 1.5, left: 0.6 },
          { at: 3, x: 44, y: 36, loose: 1.8, left: 0.2 },
          { at: 3.5, x: 45, y: 36, left: 0 },
        ],
      },
      // 3: the baggage and the siege train
      {
        side: 'foe',
        kind: 'carts',
        dots: 6,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -32, y: 38, loose: 1.4 },
          { at: 1, x: 0, y: 38 },
          { at: 2, x: 27, y: 36 },
          { at: 2.5, x: 30, y: 36 },
          { at: 3, x: 30, y: 36, left: 0.6 },
          { at: 4, x: 30, y: 36, left: 0.5 },
          { at: 5, x: 30, y: 36, left: 0 },
        ],
      },
      // 4: the left wing
      {
        side: 'foe',
        dots: 8,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -45, y: 38 },
          { at: 1, x: -13, y: 38 },
          { at: 2, x: 14, y: 37 },
          { at: 2.6, x: 18, y: 36, loose: 1.3, left: 0.8 },
          { at: 3, x: 19, y: 36, loose: 1.4, left: 0.6 },
          { at: 4, x: 50, y: 36, loose: 1.2 },
          { at: 4.4, x: 58, y: 36 },
          { at: 5, x: 60, y: 36 },
        ],
      },
      // 5: the emperor and his picked troops
      {
        side: 'foe',
        dots: 6,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -57, y: 38 },
          { at: 1, x: -25, y: 38 },
          { at: 2, x: 2, y: 38 },
          { at: 3, x: 8, y: 38 },
          { at: 3.3, x: 10, y: 37 },
          { at: 4, x: 42, y: 36 },
          { at: 4.5, x: 58, y: 33 },
          { at: 5, x: 61, y: 33 },
        ],
      },
      // 6: the rearguard under Kontostephanos
      {
        side: 'foe',
        dots: 6,
        wide: 2,
        facing: 90,
        path: [
          { at: 0, x: -68, y: 38 },
          { at: 1, x: -36, y: 38 },
          { at: 2, x: -9, y: 38 },
          { at: 3, x: -4, y: 38 },
          { at: 4, x: 16, y: 37 },
          { at: 4.6, x: 44, y: 36 },
          { at: 5, x: 56, y: 39 },
        ],
      },
      // 7 to 11: the Seljuks on the heights
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 16, y: 17 },
          { at: 2, x: 16, y: 17 },
          { at: 2.5, x: 16, y: 30 },
          { at: 4, x: 20, y: 29 },
        ],
        shoots: [{ from: 2.3, until: 3.8, at: 4 }],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 38, y: 18 },
          { at: 1.7, x: 38, y: 18 },
          { at: 2.2, x: 40, y: 29 },
          { at: 3, x: 35, y: 30 },
          { at: 4, x: 40, y: 28 },
          { at: 5, x: 56, y: 21 },
        ],
        shoots: [
          { from: 1.9, until: 2.9, at: 2 },
          { from: 2.9, until: 3.8, at: 3 },
          { from: 4.4, until: 5, at: 0 },
        ],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        path: [
          { at: 0, x: 16, y: 56 },
          { at: 2, x: 16, y: 56 },
          { at: 2.5, x: 16, y: 44 },
          { at: 4, x: 20, y: 44 },
        ],
        shoots: [{ from: 2.3, until: 3.8, at: 4 }],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        path: [
          { at: 0, x: 38, y: 55 },
          { at: 1.7, x: 38, y: 55 },
          { at: 2.2, x: 40, y: 43 },
          { at: 3, x: 34, y: 43 },
          { at: 4, x: 40, y: 44 },
          { at: 5, x: 56, y: 52 },
        ],
        shoots: [
          { from: 1.9, until: 2.9, at: 2 },
          { from: 2.9, until: 3.8, at: 3 },
          { from: 4.4, until: 5, at: 1 },
        ],
      },
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        path: [
          { at: 0, x: 4, y: 60 },
          { at: 2.6, x: 4, y: 60 },
          { at: 3, x: 3, y: 46 },
        ],
        shoots: [{ from: 2.9, until: 3.9, at: 5 }],
      },
    ],
  },
  {
    name: 'Niğbolu',
    tag: '1396',
    when: '25 September 1396',
    where: 'Niğbolu (Nicopolis), on the Danube in Bulgaria',
    turks: 'The Ottomans under Sultan Bayezid I',
    foes: 'A crusader army led by King Sigismund of Hungary',
    story:
      'One of the last great crusades of the Middle Ages was over in a day. Bayezid is remembered as Yıldırım, the Thunderbolt.',
    phases: [
      'The French knights refuse to wait for King Sigismund. They charge alone, with the Danube and the fortress of Niğbolu at their backs.',
      'They scatter the light troops in front, and ride onto rows of sharpened stakes with archers behind them.',
      'Many are on foot by now, but they climb on to the top of the slope. Sultan Bayezid is waiting there with fresh cavalry.',
      'The knights are overwhelmed and give themselves up. Sipahis ride down both flanks, and the Wallachians and Transylvanians leave the field.',
      'Sigismund fights on until Serbian knights, vassals of the sultan, charge in. He escapes in a boat on the Danube.',
    ],
    ground: [
      { kind: 'water', shape: [[0, 0], [72, 0], [72, 6], [50, 7], [28, 6], [0, 8]] },
      { kind: 'heights', shape: [[0, 72], [72, 72], [72, 53], [54, 50], [36, 52], [18, 50], [0, 54]] },
    ],
    marks: [
      { kind: 'town', x: 36, y: 10 },
      { kind: 'stakes', line: [[20, 41], [52, 41]] },
    ],
    units: [
      // 0: the French knights
      {
        side: 'foe',
        dots: 16,
        wide: 8,
        facing: 180,
        path: [
          { at: 0, x: 36, y: 22 },
          { at: 1, x: 36, y: 30 },
          { at: 1.5, x: 36, y: 36, loose: 1.15 },
          { at: 2, x: 36, y: 40, loose: 1.3, left: 0.85 },
          { at: 2.6, x: 36, y: 48, loose: 1.4, left: 0.75 },
          { at: 3, x: 36, y: 51, loose: 1.3, left: 0.7 },
          { at: 3.6, x: 36, y: 47, loose: 1.1, left: 0.3 },
          { at: 4, x: 36, y: 46, loose: 1, left: 0 },
        ],
      },
      // 1: Sigismund with the Hungarians, the Hospitallers and the Germans
      {
        side: 'foe',
        dots: 24,
        wide: 12,
        facing: 180,
        path: [
          { at: 0, x: 36, y: 14 },
          { at: 2, x: 36, y: 16 },
          { at: 3, x: 36, y: 23 },
          { at: 4, x: 36, y: 27, loose: 1.1 },
          { at: 4.6, x: 37, y: 26, loose: 1.2, left: 0.6 },
          { at: 5, x: 40, y: 22, loose: 1.4, left: 0.2 },
        ],
      },
      // 2 and 3: the Wallachians and the Transylvanians, drawn on the wings
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 9, y: 16 },
          { at: 3, x: 9, y: 21 },
          { at: 3.4, x: 8, y: 20 },
          { at: 4, x: -10, y: 14 },
        ],
      },
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 63, y: 16 },
          { at: 3, x: 63, y: 21 },
          { at: 3.4, x: 64, y: 20 },
          { at: 4, x: 82, y: 14 },
        ],
      },
      // 4: the light troops in the Ottoman front line
      {
        side: 'turk',
        dots: 12,
        wide: 12,
        path: [
          { at: 0, x: 36, y: 34 },
          { at: 1, x: 36, y: 34 },
          { at: 1.4, x: 36, y: 38, loose: 1.6, left: 0.5 },
          { at: 2, x: 36, y: 46, loose: 2.2, left: 0.25 },
          { at: 2.6, x: 36, y: 62, left: 0 },
        ],
      },
      // 5: the foot archers behind the stakes
      {
        side: 'turk',
        dots: 16,
        wide: 8,
        path: [
          { at: 0, x: 36, y: 45 },
          { at: 2, x: 36, y: 45 },
          { at: 2.5, x: 36, y: 52, loose: 1.4, left: 0.7 },
          { at: 3, x: 36, y: 66, loose: 1.2, left: 0.6 },
        ],
        shoots: [{ from: 1, until: 2.2, at: 0 }],
      },
      // 6: Bayezid with the sipahis he kept back
      {
        side: 'turk',
        dots: 20,
        wide: 10,
        path: [
          { at: 0, x: 36, y: 61 },
          { at: 2.7, x: 36, y: 61 },
          { at: 3, x: 36, y: 57 },
          { at: 3.6, x: 36, y: 52 },
          { at: 4, x: 36, y: 50 },
          { at: 4.5, x: 36, y: 41 },
          { at: 5, x: 36, y: 34 },
        ],
      },
      // 7 and 8: the sipahis on the wings
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        facing: 90,
        path: [
          { at: 0, x: 6, y: 60 },
          { at: 2.3, x: 6, y: 60 },
          { at: 3, x: 6, y: 42 },
          { at: 3.6, x: 9, y: 30 },
          { at: 4, x: 13, y: 26 },
          { at: 5, x: 17, y: 24 },
        ],
      },
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 66, y: 60 },
          { at: 2.3, x: 66, y: 60 },
          { at: 3, x: 66, y: 42 },
          { at: 3.6, x: 63, y: 30 },
          { at: 4, x: 59, y: 26 },
          { at: 5, x: 55, y: 24 },
        ],
      },
      // 9: the Serbian knights of Stefan Lazarević
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        facing: 30,
        path: [
          { at: 0, x: 4, y: 78 },
          { at: 4, x: 4, y: 78 },
          { at: 4.4, x: 13, y: 46 },
          { at: 5, x: 27, y: 31 },
        ],
      },
      // 10: the king's boat
      {
        side: 'foe',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: 46, y: 5, left: 0 },
          { at: 4.6, x: 46, y: 5, left: 0 },
          { at: 4.7, x: 48, y: 3, left: 1 },
          { at: 5, x: 66, y: 2 },
        ],
      },
    ],
  },
  {
    name: 'Varna',
    tag: '1444',
    when: '10 November 1444',
    where: 'Varna, on the Black Sea coast of Bulgaria',
    turks: 'The Ottomans under Murad II',
    foes: 'A crusader army under King Władysław III and John Hunyadi',
    story:
      'Murad II had already handed the throne to his young son and retired; he came back to command this one battle. Nine years later that son took Constantinople.',
    phases: [
      'The crusaders stand in an arc between the lake and the plateau, with the sea behind them. Sultan Murad’s janissaries are dug in around two old burial mounds.',
      'Light cavalry strikes the crusader right, is driven off and chased. Anatolian cavalry hits the pursuers from the side, and most of that wing dies in the marshes by the lake.',
      'On the other wing the sipahis are stopped, then attack again. Hunyadi rides over to help, and tells the young king to wait for him.',
      'King Władysław does not wait. He charges the janissaries with 500 knights to seize the sultan, and is brought down in front of Murad’s tent.',
      'With the king dead the army loses heart and breaks. Hunyadi can only lead the survivors away.',
    ],
    ground: [
      { kind: 'marsh', shape: [[12, 72], [16, 61], [30, 55], [48, 56], [60, 61], [62, 72]] },
      { kind: 'water', shape: [[18, 72], [22, 65], [34, 60], [48, 61], [57, 66], [58, 72]] },
      { kind: 'water', shape: [[66, 0], [72, 0], [72, 72], [62, 72], [63, 62], [67, 50], [65, 32], [67, 14]] },
      { kind: 'heights', shape: [[0, 0], [62, 0], [58, 8], [44, 12], [24, 10], [8, 14], [0, 12]] },
    ],
    marks: [
      { kind: 'hills', line: [[11, 31], [11, 41]] },
      { kind: 'tents', line: [[7, 36], [7, 36]] },
      { kind: 'stakes', line: [[22, 30], [22, 42]] },
      { kind: 'carts', line: [[61, 45], [61, 55]] },
      { kind: 'label', x: 31, y: 65, text: 'LAKE' },
    ],
    units: [
      // 0: the crusader right, by the plateau
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 47, y: 20 },
          { at: 1.3, x: 47, y: 20 },
          { at: 1.7, x: 33, y: 17, loose: 1.6 },
          { at: 2, x: 37, y: 24, loose: 1.8, left: 0.6 },
          { at: 2.5, x: 51, y: 55, loose: 2, left: 0.3 },
          { at: 3, x: 53, y: 60, left: 0 },
        ],
      },
      // 1: the Croats of ban Talovac
      {
        side: 'foe',
        dots: 2,
        wide: 2,
        facing: -90,
        path: [
          { at: 0, x: 47, y: 29 },
          { at: 1.3, x: 47, y: 29 },
          { at: 1.7, x: 39, y: 25 },
          { at: 2, x: 43, y: 31 },
          { at: 2.6, x: 63, y: 50 },
        ],
      },
      // 2: the center, with the king's guard
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: -90,
        path: [
          { at: 0, x: 46, y: 37 },
          { at: 4, x: 46, y: 37 },
          { at: 4.4, x: 49, y: 37, loose: 1.3 },
          { at: 5, x: 60, y: 28, loose: 1.6, left: 0.4 },
        ],
      },
      // 3: the king and his knights
      {
        side: 'foe',
        dots: 4,
        wide: 2,
        facing: -90,
        path: [
          { at: 0, x: 52, y: 37 },
          { at: 3.1, x: 52, y: 37 },
          { at: 3.6, x: 26, y: 36 },
          { at: 3.85, x: 15, y: 36 },
          { at: 4, x: 12, y: 36, left: 0 },
        ],
      },
      // 4: the crusader left, by the lake
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 47, y: 49 },
          { at: 2, x: 47, y: 49 },
          { at: 2.3, x: 44, y: 49 },
          { at: 2.6, x: 45, y: 49 },
          { at: 3, x: 42, y: 49 },
          { at: 4, x: 42, y: 49 },
          { at: 4.5, x: 46, y: 48, loose: 1.2 },
          { at: 5, x: 58, y: 34, loose: 1.5, left: 0.5 },
        ],
      },
      // 5: Hunyadi with the reserve
      {
        side: 'foe',
        dots: 6,
        wide: 3,
        facing: -90,
        path: [
          { at: 0, x: 59, y: 37 },
          { at: 2.3, x: 59, y: 37 },
          { at: 2.8, x: 46, y: 43 },
          { at: 3, x: 40, y: 45 },
          { at: 4, x: 38, y: 46 },
          { at: 4.3, x: 44, y: 41 },
          { at: 5, x: 61, y: 22, loose: 1.3, left: 0.7 },
        ],
      },
      // 6: the janissaries
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [{ at: 0, x: 17, y: 36 }],
        shoots: [{ from: 3.4, until: 4, at: 3 }],
      },
      // 7: the Anatolian cavalry
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: 22, y: 21 },
          { at: 1.5, x: 22, y: 21 },
          { at: 1.8, x: 30, y: 24 },
          { at: 2, x: 35, y: 22 },
          { at: 2.5, x: 46, y: 21 },
          { at: 4.3, x: 47, y: 22 },
          { at: 5, x: 54, y: 27 },
        ],
      },
      // 8: the light cavalry on the plateau
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: 110,
        path: [
          { at: 0, x: 31, y: 7 },
          { at: 1, x: 31, y: 7 },
          { at: 1.3, x: 41, y: 22 },
          { at: 1.7, x: 27, y: 12 },
          { at: 2, x: 33, y: 13 },
          { at: 2.5, x: 44, y: 13 },
          { at: 5, x: 56, y: 17 },
        ],
        shoots: [
          { from: 1.1, until: 1.4, at: 1 },
          { from: 1.75, until: 2.3, at: 0 },
        ],
      },
      // 9: the Rumelian cavalry
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: 22, y: 50 },
          { at: 2, x: 22, y: 50 },
          { at: 2.3, x: 37, y: 49 },
          { at: 2.6, x: 30, y: 50 },
          { at: 2.8, x: 35, y: 49 },
          { at: 3, x: 28, y: 51, left: 0.8 },
          { at: 4.2, x: 28, y: 51 },
          { at: 5, x: 44, y: 48 },
        ],
      },
    ],
    blasts: [{ at: 1.33, x: 42, y: 23 }],
  },
  {
    name: 'İstanbul',
    tag: '1453',
    when: '6 April to 29 May 1453',
    where: 'Constantinople, between the Golden Horn and the Sea of Marmara',
    turks: 'The Ottomans under Sultan Mehmed II',
    foes: 'The city’s defenders under Emperor Constantine XI',
    story:
      'Mehmed was twenty-one. From that day he was Fatih, the Conqueror, and the city was his capital. Tradition says a janissary called Ulubatlı Hasan was the first to plant the flag on the wall.',
    phases: [
      'Sultan Mehmed II camps before the land walls with his great guns. The city has water on its other sides, and a chain shuts his fleet out of the Golden Horn.',
      'The guns fire for weeks. They are slow to load, and the defenders mend most of the damage between shots.',
      '22 April: the sultan has ships dragged over the hill behind Galata on greased logs and launched inside the chain.',
      'Now the walls along the harbor need guards too, so the land walls are held more thinly. Tunnels dug toward them are all found and destroyed.',
      '29 May, after midnight. The attack comes in waves: first the irregulars, then the Anatolian troops, and last the janissaries.',
      'Giustiniani, who leads the defense, is wounded and carried off, and his men give way. The janissaries are over the wall, and the city is taken.',
    ],
    ground: [
      {
        kind: 'water',
        shape: [[0, 66], [12, 65], [26, 63], [40, 60], [52, 54], [60, 46], [65, 38], [66, 31], [65, 24], [64, 12], [65, 0], [72, 0], [72, 72], [0, 72]],
      },
      {
        kind: 'water',
        shape: [[66, 31], [57, 30], [47, 27], [37, 22], [30, 15], [28, 7], [28, 2], [32, 2], [34, 9], [40, 16], [48, 21], [57, 24], [65, 25]],
      },
    ],
    marks: [
      { kind: 'wall', line: [[27, 61], [25, 53], [24, 43], [25, 33], [27, 24], [30, 17]] },
      { kind: 'chain', line: [[63, 25], [64, 31]] },
      { kind: 'guns', line: [[18, 38], [18, 46]], aim: 'right', fires: [[1, 2], [3.1, 4], [4.2, 5.2]], reach: 5 },
      { kind: 'town', x: 57, y: 20 },
      { kind: 'label', x: 42, y: 2, text: 'GALATA' },
      { kind: 'label', x: 40, y: 66, text: 'MARMARA' },
    ],
    units: [
      // 0: the sultan and the janissaries, facing the middle of the walls
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: -6, y: 42 },
          { at: 0.7, x: 11, y: 42 },
          { at: 4.7, x: 11, y: 42 },
          { at: 5, x: 21, y: 42 },
          { at: 5.4, x: 30, y: 42, loose: 1.1 },
          { at: 6, x: 44, y: 40 },
        ],
      },
      // 1: the European troops of Karaca Pasha, to the north
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        facing: 90,
        path: [
          { at: 0, x: -6, y: 27 },
          { at: 0.8, x: 15, y: 27 },
          { at: 4.3, x: 15, y: 27 },
          { at: 4.55, x: 22, y: 27 },
          { at: 4.75, x: 17, y: 27, left: 0.85 },
          { at: 5.3, x: 22, y: 27 },
          { at: 6, x: 38, y: 31 },
        ],
      },
      // 2: the Anatolian troops of Ishak Pasha, to the south
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        facing: 90,
        path: [
          { at: 0, x: -6, y: 55 },
          { at: 0.9, x: 15, y: 55 },
          { at: 4.3, x: 15, y: 55 },
          { at: 4.55, x: 21, y: 55 },
          { at: 4.75, x: 16, y: 55, left: 0.85 },
          { at: 5.4, x: 21, y: 55 },
          { at: 6, x: 34, y: 52 },
        ],
      },
      // 3: the irregulars
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: -12, y: 42, loose: 1.2 },
          { at: 1, x: 4, y: 42 },
          { at: 4, x: 4, y: 42 },
          { at: 4.25, x: 21, y: 42, loose: 1.3 },
          { at: 4.5, x: 5, y: 48, loose: 1.4, left: 0.6 },
        ],
      },
      // 4: Zagan Pasha, north of the Golden Horn
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        facing: 180,
        path: [
          { at: 0, x: 44, y: -6 },
          { at: 1, x: 44, y: 10 },
        ],
      },
      // 5: the fleet in the Bosphorus
      {
        side: 'turk',
        kind: 'ships',
        dots: 3,
        wide: 1,
        path: [
          { at: 0, x: 67, y: -20, loose: 1.4 },
          { at: 1, x: 67, y: 6 },
        ],
      },
      // 6, 7, 8: the ships that go overland, one after another
      {
        side: 'turk',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: 67, y: -12 },
          { at: 1, x: 67, y: 14 },
          { at: 2, x: 67, y: 14 },
          { at: 2.2, x: 60, y: 13 },
          { at: 2.5, x: 51, y: 15 },
          { at: 2.75, x: 41, y: 18 },
          { at: 2.85, x: 38, y: 20 },
        ],
      },
      {
        side: 'turk',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: 67, y: -8 },
          { at: 1, x: 67, y: 18 },
          { at: 2.15, x: 67, y: 18 },
          { at: 2.35, x: 60, y: 14 },
          { at: 2.65, x: 51, y: 16 },
          { at: 2.9, x: 45, y: 20 },
          { at: 3, x: 43, y: 22 },
        ],
      },
      {
        side: 'turk',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: 67, y: -4 },
          { at: 1, x: 67, y: 22 },
          { at: 2.3, x: 67, y: 22 },
          { at: 2.5, x: 61, y: 15 },
          { at: 2.8, x: 53, y: 17 },
          { at: 3.05, x: 49, y: 22 },
          { at: 3.15, x: 48, y: 24 },
        ],
      },
      // 9: the defenders' ships behind the chain
      {
        side: 'foe',
        kind: 'ships',
        dots: 3,
        wide: 1,
        facing: -63,
        path: [
          { at: 0, x: 56, y: 26, loose: 1.5 },
          { at: 5.5, x: 56, y: 26 },
          { at: 5.75, x: 64, y: 30 },
          { at: 6, x: 68, y: 47 },
        ],
      },
      // 10, 11, 12: the defenders on the land walls, from north to south
      {
        side: 'foe',
        dots: 5,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 30, y: 26 },
          { at: 5.4, x: 30, y: 26 },
          { at: 6, x: 37, y: 27, loose: 1.5, left: 0.2 },
        ],
      },
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: -90,
        path: [
          { at: 0, x: 29, y: 42 },
          { at: 5, x: 29, y: 42 },
          { at: 5.25, x: 30, y: 42, left: 0.8 },
          { at: 5.6, x: 34, y: 42, loose: 1.4, left: 0.4 },
          { at: 6, x: 41, y: 41, left: 0.1 },
        ],
      },
      {
        side: 'foe',
        dots: 5,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 29, y: 54 },
          { at: 5.5, x: 29, y: 54 },
          { at: 6, x: 35, y: 51, loose: 1.5, left: 0.2 },
        ],
      },
      // 13: the men sent from the land walls to the harbor
      {
        side: 'foe',
        dots: 4,
        wide: 2,
        facing: -90,
        path: [
          { at: 0, x: 30, y: 34 },
          { at: 3, x: 30, y: 34 },
          { at: 3.6, x: 43, y: 30 },
          { at: 5.6, x: 43, y: 30 },
          { at: 6, x: 45, y: 33, left: 0.25 },
        ],
      },
      // 14: the reserve inside the city
      {
        side: 'foe',
        dots: 4,
        wide: 2,
        facing: -90,
        path: [
          { at: 0, x: 44, y: 43 },
          { at: 5.2, x: 44, y: 43 },
          { at: 5.5, x: 35, y: 43 },
          { at: 6, x: 39, y: 44, left: 0.25 },
        ],
      },
    ],
    blasts: [
      { at: 1.25, x: 24, y: 41 },
      { at: 1.6, x: 24, y: 45 },
      { at: 3.4, x: 24, y: 43 },
      { at: 3.75, x: 25, y: 36 },
      { at: 4.6, x: 26, y: 27 },
      { at: 4.95, x: 24, y: 41 },
      { at: 5.15, x: 24, y: 44 },
    ],
  },
  {
    name: 'Çaldıran',
    tag: '1514',
    when: '23 August 1514',
    where: 'The plain of Çaldıran, northeast of Lake Van',
    turks: 'The Ottomans under Sultan Selim I',
    foes: 'The Safavid army of Shah Ismail I',
    story:
      'Cavalry against gunpowder. The Safavid horsemen had seemed unbeatable; after this day eastern Anatolia was Ottoman, and Shah Ismail never led an army again.',
    phases: [
      'Sultan Selim sets his back to the hills. Cannons are hidden behind the foot soldiers on both wings; the janissaries stand behind a line of wagons.',
      'Shah Ismail has no guns. He charges the Ottoman left so fast that the foot soldiers cannot clear the way, and those cannons never fire. The Rumelian wing breaks.',
      'On the other wing the plan works. The foot soldiers pull back behind the guns, and the Safavid left rides into cannon fire.',
      'Selim turns his guns and the janissaries’ muskets on Ismail’s wing, and cuts off its road back.',
      'Ismail is wounded and barely escapes, and his army scatters. Two weeks later Selim rides into Tabriz, the shah’s capital.',
    ],
    ground: [{ kind: 'heights', shape: [[0, 72], [72, 72], [72, 68], [56, 65], [36, 67], [16, 64], [0, 61]] }],
    marks: [
      { kind: 'guns', line: [[10, 50], [30, 50]], aim: 'up' },
      { kind: 'guns', line: [[42, 50], [62, 50]], aim: 'up', fires: [[2.25, 3.3]], reach: 10 },
      { kind: 'carts', line: [[26, 56], [46, 56]] },
    ],
    units: [
      // 0 and 1: the foot soldiers in front of the guns
      {
        side: 'turk',
        dots: 8,
        wide: 8,
        path: [
          { at: 0, x: 20, y: 46 },
          { at: 1.55, x: 20, y: 46 },
          { at: 1.8, x: 19, y: 48, loose: 1.7, left: 0.5 },
          { at: 2, x: 17, y: 52, loose: 2, left: 0.3 },
        ],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 8,
        path: [
          { at: 0, x: 52, y: 46 },
          { at: 2, x: 52, y: 46 },
          { at: 2.25, x: 52, y: 53 },
        ],
      },
      // 2: the Rumelian cavalry on the left
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        path: [
          { at: 0, x: 12, y: 58 },
          { at: 1.7, x: 12, y: 58 },
          { at: 2, x: 11, y: 59, loose: 1.3, left: 0.6 },
          { at: 2.5, x: 9, y: 61, loose: 1.5, left: 0.35 },
        ],
      },
      // 3: the Anatolian cavalry on the right
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        path: [
          { at: 0, x: 60, y: 58 },
          { at: 3, x: 60, y: 58 },
          { at: 3.4, x: 66, y: 46 },
          { at: 4, x: 62, y: 34 },
          { at: 5, x: 56, y: 18 },
        ],
      },
      // 4: the janissaries
      {
        side: 'turk',
        dots: 16,
        wide: 8,
        path: [
          { at: 0, x: 36, y: 61 },
          { at: 3, x: 36, y: 61 },
          { at: 3.5, x: 28, y: 50 },
          { at: 4, x: 21, y: 43 },
        ],
        shoots: [{ from: 3.3, until: 4.6, at: 5 }],
      },
      // 5: the Safavid right, led by the shah
      {
        side: 'foe',
        dots: 20,
        wide: 10,
        facing: 180,
        path: [
          { at: 0, x: 20, y: 9 },
          { at: 1, x: 20, y: 15 },
          { at: 1.6, x: 20, y: 42 },
          { at: 2, x: 17, y: 52, loose: 1.15 },
          { at: 3, x: 15, y: 53 },
          { at: 3.5, x: 15, y: 52, left: 0.75 },
          { at: 4, x: 14, y: 50, loose: 1.2, left: 0.45 },
          { at: 4.4, x: 10, y: 36, loose: 1.5, left: 0.35 },
          { at: 5, x: 2, y: 8, loose: 1.8, left: 0.15 },
        ],
      },
      // 6: the Safavid left
      {
        side: 'foe',
        dots: 20,
        wide: 10,
        facing: 180,
        path: [
          { at: 0, x: 52, y: 9 },
          { at: 1, x: 52, y: 15 },
          { at: 2, x: 52, y: 20 },
          { at: 2.6, x: 52, y: 38, loose: 1.1, left: 0.8 },
          { at: 3, x: 52, y: 42, loose: 1.3, left: 0.45 },
          { at: 3.6, x: 52, y: 40, loose: 1.5, left: 0.3 },
          { at: 4.3, x: 54, y: 24, left: 0.25 },
          { at: 5, x: 60, y: -4, left: 0.1 },
        ],
      },
      // 7: the Safavid center
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        facing: 180,
        path: [
          { at: 0, x: 36, y: 5 },
          { at: 1, x: 36, y: 10 },
          { at: 4, x: 36, y: 12 },
          { at: 4.4, x: 36, y: 30 },
          { at: 4.7, x: 36, y: 31, left: 0.6 },
          { at: 5, x: 38, y: 4, loose: 1.5, left: 0.3 },
        ],
      },
    ],
    blasts: [
      { at: 2.7, x: 52, y: 40 },
      { at: 2.9, x: 47, y: 41 },
      { at: 3.05, x: 57, y: 42 },
      { at: 3.5, x: 17, y: 50 },
      { at: 3.75, x: 12, y: 54 },
      { at: 3.95, x: 19, y: 54 },
      { at: 4.15, x: 14, y: 48 },
    ],
  },
  {
    name: 'Mohaç',
    tag: '1526',
    when: '29 August 1526',
    where: 'Mohács (Mohaç), on the Danube in Hungary',
    turks: 'The Ottomans under Suleiman the Magnificent',
    foes: 'The Hungarian army of King Louis II',
    story:
      'The battle that decided the fate of Hungary. People of the time credited Ibrahim Pasha with a planned retreat; some historians think the Ottomans had no time to plan one.',
    phases: [
      'On a wet plain beside the Danube the Hungarian army stands in two lines. It has not waited for its reinforcements.',
      'Archbishop Tomori leads the charge. The Ottoman front line is driven back in disorder.',
      'Ibrahim Pasha pulls the center back in good order. The line bends into a crescent, and the knights ride into it.',
      'As King Louis brings up the second line, janissaries and cannons open fire from prepared positions, and cavalry closes in from both wings.',
      'Within two hours the Hungarian army is destroyed. The king, twenty years old, drowns in a stream as he flees.',
    ],
    ground: [
      { kind: 'marsh', shape: [[55, 0], [66, 0], [64, 24], [66, 40], [63, 56], [66, 72], [57, 72], [56, 56], [58, 40], [55, 24]] },
      { kind: 'water', shape: [[64, 0], [72, 0], [72, 72], [66, 72], [63, 56], [66, 40], [62, 24], [65, 10]] },
    ],
    marks: [
      { kind: 'river', line: [[38, 2], [47, 4], [56, 8], [64, 10]] },
      { kind: 'guns', line: [[22, 23], [34, 23]], aim: 'down', fires: [[0.5, 1.2]], reach: 8 },
      { kind: 'guns', line: [[21, 58], [35, 58]], aim: 'up', fires: [[3.05, 4.4]], reach: 10 },
    ],
    units: [
      // 0: the hired infantry in the middle of the first line
      {
        side: 'foe',
        dots: 12,
        wide: 6,
        facing: 180,
        path: [
          { at: 0, x: 28, y: 19 },
          { at: 1, x: 28, y: 19 },
          { at: 2, x: 28, y: 31 },
          { at: 3, x: 28, y: 43 },
          { at: 3.6, x: 28, y: 44, left: 0.6 },
          { at: 4.2, x: 28, y: 43, left: 0.25 },
          { at: 5, x: 28, y: 40, left: 0.05 },
        ],
      },
      // 1 and 2: the knights on its flanks
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 11, y: 19 },
          { at: 1, x: 11, y: 19 },
          { at: 1.5, x: 13, y: 32 },
          { at: 2, x: 15, y: 40 },
          { at: 3, x: 19, y: 47 },
          { at: 3.6, x: 19, y: 47, left: 0.6 },
          { at: 4.2, x: 19, y: 46, left: 0.25 },
          { at: 5, x: 20, y: 44, left: 0 },
        ],
      },
      {
        side: 'foe',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 45, y: 19 },
          { at: 1, x: 45, y: 19 },
          { at: 1.5, x: 43, y: 32 },
          { at: 2, x: 41, y: 40 },
          { at: 3, x: 37, y: 47 },
          { at: 3.6, x: 37, y: 47, left: 0.6 },
          { at: 4.2, x: 37, y: 46, left: 0.25 },
          { at: 5, x: 36, y: 44, left: 0 },
        ],
      },
      // 3: the second line
      {
        side: 'foe',
        dots: 16,
        wide: 8,
        facing: 180,
        path: [
          { at: 0, x: 28, y: 11 },
          { at: 2, x: 28, y: 12 },
          { at: 3, x: 28, y: 24 },
          { at: 4, x: 28, y: 33 },
          { at: 4.4, x: 28, y: 32, loose: 1.3, left: 0.6 },
          { at: 5, x: 34, y: 12, loose: 1.8, left: 0.15 },
        ],
      },
      // 4: the king
      {
        side: 'foe',
        dots: 2,
        wide: 2,
        facing: 180,
        path: [
          { at: 0, x: 28, y: 6 },
          { at: 2, x: 28, y: 7 },
          { at: 3, x: 28, y: 19 },
          { at: 4, x: 28, y: 28 },
          { at: 4.4, x: 31, y: 22 },
          { at: 4.85, x: 46, y: 7 },
          { at: 5, x: 47, y: 5, left: 0 },
        ],
      },
      // 5: the irregulars of the Ottoman front line
      {
        side: 'turk',
        dots: 10,
        wide: 10,
        path: [
          { at: 0, x: 28, y: 40 },
          { at: 1, x: 28, y: 36 },
          { at: 1.5, x: 28, y: 40, loose: 1.3 },
          { at: 2, x: 28, y: 48, loose: 1.8, left: 0.5 },
          { at: 2.6, x: 28, y: 66, loose: 2, left: 0.25 },
        ],
      },
      // 6 and 7: the two halves of Ibrahim Pasha's center
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        path: [
          { at: 0, x: 20, y: 49 },
          { at: 1, x: 20, y: 45 },
          { at: 2, x: 19, y: 47 },
          { at: 3, x: 11, y: 53 },
          { at: 4, x: 12, y: 50 },
          { at: 5, x: 15, y: 45 },
        ],
      },
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        path: [
          { at: 0, x: 36, y: 49 },
          { at: 1, x: 36, y: 45 },
          { at: 2, x: 37, y: 47 },
          { at: 3, x: 45, y: 53 },
          { at: 4, x: 44, y: 50 },
          { at: 5, x: 41, y: 45 },
        ],
      },
      // 8 and 9: the cavalry on the wings
      {
        side: 'turk',
        dots: 10,
        wide: 2,
        path: [
          { at: 0, x: 3, y: 51 },
          { at: 1, x: 3, y: 47 },
          { at: 3, x: 3, y: 45 },
          { at: 3.5, x: 4, y: 34 },
          { at: 4, x: 10, y: 27 },
          { at: 5, x: 16, y: 25 },
        ],
      },
      {
        side: 'turk',
        dots: 10,
        wide: 2,
        path: [
          { at: 0, x: 53, y: 51 },
          { at: 1, x: 53, y: 47 },
          { at: 3, x: 53, y: 45 },
          { at: 3.5, x: 52, y: 34 },
          { at: 4, x: 46, y: 27 },
          { at: 5, x: 40, y: 25 },
        ],
      },
      // 10: the sultan and the janissaries behind the guns
      {
        side: 'turk',
        dots: 14,
        wide: 7,
        path: [
          { at: 0, x: 28, y: 70 },
          { at: 1, x: 28, y: 64 },
        ],
        shoots: [{ from: 3.05, until: 4.4, at: 0 }],
      },
    ],
    blasts: [
      { at: 3.3, x: 28, y: 45 },
      { at: 3.5, x: 20, y: 47 },
      { at: 3.7, x: 36, y: 47 },
      { at: 3.95, x: 27, y: 42 },
    ],
  },
  {
    name: 'Çanakkale',
    tag: '1915',
    when: '18 March 1915',
    where: 'The Dardanelles (Çanakkale Boğazı)',
    turks: 'The Ottoman forts, shore guns and mines',
    foes: 'The British and French fleet',
    story:
      'Çanakkale geçilmez: Çanakkale cannot be passed. 18 March is kept every year as Martyrs’ Day. Tradition tells of Corporal Seyit, who carried shells of more than 200 kg to his gun on his back when its hoist was broken.',
    phases: [
      'Ten nights earlier the small minelayer Nusret slips down the strait in the dark and lays 26 mines along the bay where Allied ships had been seen turning.',
      '18 March, 11 in the morning: the first line of British battleships opens fire on the forts from long range.',
      'After noon the French line passes through to shell the Narrows from closer in. The forts hit back, and several ships are damaged.',
      'By half past one the forts are almost silent. The French turn away into the bay, and at 1:54 Bouvet strikes a mine and sinks in two minutes.',
      'The second British line comes up. Around four o’clock Inflexible strikes a mine in the same place, then Irresistible, and at 6:05 Ocean.',
      'Three battleships are lost and three more badly damaged. The fleet withdraws, and does not try again.',
    ],
    ground: [
      {
        kind: 'water',
        shape: [
          [0, 0], [14, 0], [10, 8], [6, 18], [4, 30], [6, 38], [18, 36], [30, 31], [42, 25], [52, 19], [58, 15], [61, 9],
          [64, 3], [66, 0], [72, 0], [72, 3], [70, 6], [66, 13], [63, 19], [61, 24], [56, 31], [50, 37], [45, 42], [44, 47],
          [40, 53], [33, 57], [24, 58], [16, 57], [8, 60], [6, 66], [8, 72], [0, 72],
        ],
      },
    ],
    marks: [
      { kind: 'label', x: 20, y: 10, text: 'EUROPE' },
      { kind: 'label', x: 50, y: 62, text: 'ASIA' },
      { kind: 'town', x: 55, y: 11 },
      { kind: 'town', x: 67, y: 22 },
      { kind: 'guns', line: [[36, 24], [48, 18]], aim: 'down', fires: [[1.5, 3.1], [4.1, 5.5]], reach: 8 },
      { kind: 'guns', line: [[50, 41], [58, 33]], aim: 'up', fires: [[1.5, 3.1], [4.1, 5.5]], reach: 8 },
      { kind: 'guns', line: [[22, 62], [34, 61]], aim: 'up', fires: [[2.2, 3.1], [4.1, 5.5]], reach: 9 },
      { kind: 'mines', line: [[46, 27], [48, 35]], count: 4 },
      { kind: 'mines', line: [[50, 24], [53, 31]], count: 4 },
      { kind: 'mines', line: [[54, 21], [57, 27]], count: 3 },
      { kind: 'mines', line: [[58, 17], [60, 22]], count: 3 },
      { kind: 'mines', line: [[21, 54], [37, 51]], count: 9, laid: [0.4, 0.85] },
    ],
    units: [
      // 0: Nusret
      {
        side: 'turk',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: 61, y: 19 },
          { at: 0.12, x: 54, y: 29 },
          { at: 0.22, x: 46, y: 37 },
          { at: 0.3, x: 39, y: 46 },
          { at: 0.4, x: 21, y: 53 },
          { at: 0.85, x: 37, y: 50 },
          { at: 0.95, x: 45, y: 38 },
          { at: 1.1, x: 55, y: 28 },
          { at: 1.25, x: 61, y: 20 },
        ],
      },
      // 1: the first British line
      {
        side: 'foe',
        kind: 'ships',
        dots: 3,
        wide: 3,
        facing: 60,
        path: [
          { at: 0, x: -16, y: 60, loose: 1.6 },
          { at: 1, x: -10, y: 58 },
          { at: 1.5, x: 21, y: 42 },
          { at: 5.2, x: 21, y: 42 },
          { at: 6, x: -14, y: 58 },
        ],
        shoots: [
          { from: 1.5, until: 3.1, at: [55, 12] },
          { from: 4.1, until: 5, at: [55, 12] },
        ],
      },
      // 2: Inflexible, at the end of that line
      {
        side: 'foe',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: -10, y: 66 },
          { at: 1, x: -4, y: 64 },
          { at: 1.5, x: 26, y: 49 },
          { at: 4.3, x: 26, y: 49 },
          { at: 4.45, x: 27, y: 52 },
          { at: 4.6, x: 24, y: 52 },
          { at: 5, x: 4, y: 55 },
          { at: 5.3, x: -12, y: 60 },
        ],
      },
      // 3: the French line
      {
        side: 'foe',
        kind: 'ships',
        dots: 2,
        wide: 2,
        facing: 60,
        path: [
          { at: 0, x: -24, y: 66, loose: 2.4 },
          { at: 1.5, x: 8, y: 50 },
          { at: 2, x: 8, y: 50 },
          { at: 2.6, x: 34, y: 37 },
          { at: 3.2, x: 34, y: 37 },
          { at: 3.45, x: 38, y: 43 },
          { at: 3.7, x: 33, y: 49 },
          { at: 4, x: 19, y: 52 },
          { at: 4.4, x: 4, y: 55 },
          { at: 4.8, x: -14, y: 60 },
        ],
        shoots: [{ from: 2.6, until: 3.2, at: [66, 21] }],
      },
      // 4: Bouvet
      {
        side: 'foe',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: -28, y: 68 },
          { at: 1.5, x: 4, y: 53 },
          { at: 2, x: 4, y: 53 },
          { at: 2.6, x: 30, y: 40 },
          { at: 3.2, x: 30, y: 40 },
          { at: 3.45, x: 35, y: 45 },
          { at: 3.6, x: 33, y: 50 },
          { at: 3.68, x: 31, y: 51 },
          { at: 3.85, x: 30, y: 52, left: 0.4 },
          { at: 4, x: 30, y: 52, left: 0 },
        ],
      },
      // 5: the second British line
      {
        side: 'foe',
        kind: 'ships',
        dots: 2,
        wide: 2,
        facing: 60,
        path: [
          { at: 0, x: -30, y: 72, loose: 2.4 },
          { at: 2, x: -8, y: 60 },
          { at: 3.3, x: 6, y: 52 },
          { at: 3.9, x: 34, y: 36 },
          { at: 5.2, x: 34, y: 36 },
          { at: 5.5, x: 38, y: 43 },
          { at: 5.75, x: 30, y: 47 },
          { at: 6, x: 8, y: 54 },
        ],
        shoots: [{ from: 4, until: 5.2, at: [66, 21] }],
      },
      // 6: Irresistible
      {
        side: 'foe',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: -34, y: 72 },
          { at: 2, x: -12, y: 62 },
          { at: 3.3, x: 2, y: 55 },
          { at: 3.9, x: 30, y: 41 },
          { at: 4.4, x: 32, y: 44 },
          { at: 4.6, x: 33, y: 51 },
          { at: 5, x: 35, y: 52 },
          { at: 5.6, x: 36, y: 52, left: 0.6 },
          { at: 6, x: 36, y: 52, left: 0 },
        ],
      },
      // 7: Ocean
      {
        side: 'foe',
        kind: 'ships',
        dots: 1,
        wide: 1,
        path: [
          { at: 0, x: -38, y: 74 },
          { at: 2, x: -16, y: 64 },
          { at: 3.3, x: -2, y: 58 },
          { at: 3.9, x: 37, y: 41 },
          { at: 4.7, x: 37, y: 44 },
          { at: 4.9, x: 29, y: 52 },
          { at: 5.3, x: 28, y: 53, left: 0.8 },
          { at: 6, x: 27, y: 53, left: 0 },
        ],
      },
    ],
    blasts: [
      { at: 1.8, x: 55, y: 12 },
      { at: 2.2, x: 57, y: 14 },
      { at: 2.4, x: 22, y: 43 },
      { at: 2.8, x: 66, y: 21 },
      { at: 2.9, x: 35, y: 38 },
      { at: 3.05, x: 31, y: 41 },
      { at: 3.68, x: 32, y: 52 },
      { at: 4.3, x: 65, y: 22 },
      { at: 4.45, x: 28, y: 53 },
      { at: 4.6, x: 34, y: 52 },
      { at: 4.9, x: 30, y: 53 },
    ],
  },
  {
    name: 'Sakarya',
    tag: '1921',
    when: '23 August to 13 September 1921',
    where: 'East of the Sakarya river, near Polatlı',
    turks: 'The Turkish army under Mustafa Kemal Pasha',
    foes: 'The Greek army in Anatolia',
    story:
      'Twenty-two days and nights on a front 100 km long, with so many officers lost that it is called the Officers’ Battle. As a writer of the time put it, the retreat that began at Vienna in 1683 stopped here.',
    phases: [
      'The Turkish army waits east of the Sakarya river. The Greek army marches nine days to reach it, and tries to get around its southern end.',
      'The flank holds, so the attack moves to the center. Hill after hill is stormed, and on 2 September Çal Dağı falls.',
      'Mustafa Kemal’s order: there is no line of defense, there is a surface of defense. A unit pushed off one hill makes its stand on the next.',
      'Turkish cavalry raids the supply roads behind the attack. Fifty kilometers from Ankara, it runs out of food, shells and strength.',
      '10 September: the counterattack, led by Mustafa Kemal himself, takes Çal Dağı back. By the 13th the Greek army is across the river again.',
    ],
    ground: [
      { kind: 'heights', shape: [[33, 35], [41, 31], [49, 34], [50, 41], [42, 45], [34, 42]] },
      { kind: 'heights', shape: [[47, 50], [55, 47], [61, 51], [59, 57], [50, 58]] },
      { kind: 'heights', shape: [[26, 15], [33, 11], [39, 16], [34, 23], [27, 21]] },
    ],
    marks: [
      { kind: 'river', line: [[20, 0], [17, 10], [20, 22], [16, 34], [12, 44], [4, 52], [0, 54]] },
      { kind: 'river', line: [[72, 63], [58, 62], [44, 64], [30, 60], [18, 52], [12, 44]] },
      { kind: 'town', x: 67, y: 10 },
      { kind: 'label', x: 46, y: 2, text: 'ANKARA' },
    ],
    units: [
      // 0 to 4: the Turkish groups, from north to south
      {
        side: 'turk',
        dots: 6,
        wide: 6,
        facing: -90,
        path: [
          { at: 0, x: 25, y: 9 },
          { at: 4.4, x: 25, y: 9 },
          { at: 5, x: 22, y: 9 },
        ],
      },
      {
        side: 'turk',
        dots: 6,
        wide: 6,
        facing: -90,
        path: [
          { at: 0, x: 24, y: 28 },
          { at: 4.4, x: 24, y: 28 },
          { at: 5, x: 21, y: 28 },
        ],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: -135,
        path: [
          { at: 0, x: 24, y: 42 },
          { at: 1.6, x: 24, y: 42 },
          { at: 2, x: 27, y: 35 },
          { at: 3, x: 29, y: 30 },
          { at: 4, x: 29, y: 30 },
          { at: 4.5, x: 26, y: 37 },
          { at: 5, x: 21, y: 43 },
        ],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 36, y: 53 },
          { at: 1.3, x: 36, y: 53 },
          { at: 1.7, x: 40, y: 42 },
          { at: 2, x: 43, y: 28 },
          { at: 3, x: 45, y: 24 },
          { at: 4, x: 45, y: 24 },
          { at: 4.5, x: 41, y: 37 },
          { at: 5, x: 36, y: 51 },
        ],
      },
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: 180,
        path: [
          { at: 0, x: 54, y: 53 },
          { at: 1.2, x: 54, y: 53 },
          { at: 1.5, x: 55, y: 44 },
          { at: 2, x: 56, y: 39 },
          { at: 3, x: 58, y: 32 },
          { at: 4, x: 58, y: 32 },
          { at: 4.6, x: 56, y: 44 },
          { at: 5, x: 54, y: 54 },
        ],
      },
      // 5: the cavalry corps
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        facing: 180,
        path: [
          { at: 0, x: 67, y: 55 },
          { at: 1.5, x: 67, y: 50 },
          { at: 3, x: 67, y: 49 },
          { at: 3.3, x: 68, y: 67 },
          { at: 3.6, x: 50, y: 69 },
          { at: 3.9, x: 30, y: 68 },
          { at: 4.2, x: 22, y: 67 },
          { at: 5, x: 10, y: 61 },
        ],
        shoots: [{ from: 3.6, until: 4.3, at: 9 }],
      },
      // 6: the Greek corps that pins the north of the line
      {
        side: 'foe',
        dots: 8,
        wide: 8,
        facing: 90,
        path: [
          { at: 0, x: -8, y: 18 },
          { at: 1, x: 10, y: 18 },
          { at: 4.5, x: 10, y: 18 },
          { at: 5, x: -8, y: 18 },
        ],
      },
      // 7: the corps that attacks the center
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        path: [
          { at: 0, x: -10, y: 66 },
          { at: 1, x: 33, y: 68 },
          { at: 1.3, x: 34, y: 62 },
          { at: 1.7, x: 37, y: 52 },
          { at: 2, x: 41, y: 39 },
          { at: 3, x: 43, y: 34 },
          { at: 4, x: 43, y: 34 },
          { at: 4.5, x: 37, y: 46, left: 0.85 },
          { at: 5, x: -10, y: 60 },
        ],
      },
      // 8: the corps sent around the southern end
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        path: [
          { at: 0, x: -16, y: 70 },
          { at: 1, x: 56, y: 68 },
          { at: 1.2, x: 56, y: 63 },
          { at: 1.5, x: 55, y: 54 },
          { at: 2, x: 56, y: 49 },
          { at: 3, x: 58, y: 42 },
          { at: 4, x: 58, y: 42 },
          { at: 4.6, x: 50, y: 58, left: 0.85 },
          { at: 5, x: -10, y: 68 },
        ],
      },
      // 9: the supply wagons
      {
        side: 'foe',
        kind: 'carts',
        dots: 4,
        wide: 1,
        facing: 90,
        path: [
          { at: 0, x: -34, y: 67, loose: 1.8 },
          { at: 2, x: 4, y: 67 },
          { at: 3, x: 20, y: 68 },
          { at: 3.6, x: 24, y: 68 },
          { at: 3.9, x: 25, y: 68, left: 0.5 },
          { at: 4.3, x: 25, y: 68, left: 0.25 },
          { at: 5, x: 25, y: 68, left: 0 },
        ],
      },
    ],
  },
  {
    name: 'The Great Offensive',
    tag: '1922',
    when: '26 to 30 August 1922',
    where: 'From Afyon to Dumlupınar, in western Anatolia',
    turks: 'The Turkish army under Mustafa Kemal Pasha',
    foes: 'The Greek army in Anatolia',
    story:
      'The last battle of the War of Independence, known in Turkey as the Field Battle of the Commander-in-Chief (Başkomutanlık Meydan Muharebesi). The thirtieth of August is Victory Day.',
    phases: [
      'The night before, the cavalry corps crosses the mountains by a path that is left unguarded after dark, and comes out behind the Greek line.',
      '26 August, five in the morning: the guns open south of Afyon. The First Army attacks north while the Second Army pins the rest of the front.',
      '27 August: the line breaks where two divisions meet, and Afyon is free. The cavalry has cut the railway and the telegraph to İzmir.',
      'The Greek army falls back west in two groups that lose touch with each other. One reaches Dumlupınar; the larger one is cut off.',
      '30 August: the larger group is surrounded on every side. Mustafa Kemal directs the battle himself, and by nightfall it is over.',
      '“Armies, your first goal is the Mediterranean. Forward!” The pursuit begins, and on 9 September the army enters İzmir.',
    ],
    ground: [
      { kind: 'heights', shape: [[0, 42], [9, 39], [17, 42], [18, 49], [8, 53], [0, 51]] },
      { kind: 'heights', shape: [[21, 41], [34, 39], [47, 40], [52, 43], [40, 46], [25, 46]] },
    ],
    marks: [
      { kind: 'rail', line: [[58, 37], [42, 35], [26, 33], [10, 32], [0, 33]] },
      { kind: 'town', x: 59, y: 35 },
      { kind: 'label', x: 51, y: 28, text: 'AFYON' },
      { kind: 'town', x: 9, y: 30 },
      { kind: 'label', x: 2, y: 22, text: 'DUMLUPINAR' },
      { kind: 'guns', line: [[24, 57], [50, 57]], aim: 'up', fires: [[1.05, 1.6]], reach: 9 },
    ],
    units: [
      // 0: the First Army's I Corps
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        path: [
          { at: 0, x: 28, y: 53 },
          { at: 1.4, x: 28, y: 53 },
          { at: 2, x: 29, y: 49 },
          { at: 2.5, x: 30, y: 43 },
          { at: 3, x: 28, y: 38 },
          { at: 4, x: 19, y: 38 },
          { at: 5, x: 13, y: 36 },
          { at: 6, x: -10, y: 36 },
        ],
      },
      // 1: its IV Corps
      {
        side: 'turk',
        dots: 12,
        wide: 6,
        path: [
          { at: 0, x: 44, y: 53 },
          { at: 1.4, x: 44, y: 53 },
          { at: 2, x: 43, y: 49 },
          { at: 2.5, x: 40, y: 41 },
          { at: 3, x: 38, y: 35 },
          { at: 3.5, x: 33, y: 29 },
          { at: 4, x: 25, y: 26 },
          { at: 5, x: 20, y: 25 },
          { at: 6, x: -6, y: 24 },
        ],
      },
      // 2: its II Corps, in reserve
      {
        side: 'turk',
        dots: 8,
        wide: 4,
        facing: -90,
        path: [
          { at: 0, x: 38, y: 63 },
          { at: 2.4, x: 38, y: 63 },
          { at: 3, x: 54, y: 39 },
          { at: 3.5, x: 48, y: 27 },
          { at: 4, x: 37, y: 21 },
          { at: 5, x: 28, y: 17 },
          { at: 6, x: 2, y: 19 },
        ],
      },
      // 3: the cavalry corps
      {
        side: 'turk',
        dots: 9,
        wide: 3,
        path: [
          { at: 0, x: 15, y: 61 },
          { at: 0.5, x: 10, y: 47 },
          { at: 1, x: 13, y: 36 },
          { at: 1.8, x: 21, y: 33 },
          { at: 3, x: 23, y: 32 },
          { at: 3.5, x: 21, y: 25 },
          { at: 4, x: 16, y: 23 },
          { at: 5, x: 8, y: 16 },
          { at: 6, x: -8, y: 16 },
        ],
      },
      // 4: the Second Army, holding the rest of the front
      {
        side: 'turk',
        dots: 10,
        wide: 5,
        facing: -90,
        path: [
          { at: 0, x: 68, y: 19 },
          { at: 1, x: 68, y: 19 },
          { at: 2, x: 65, y: 19 },
          { at: 3, x: 60, y: 19 },
          { at: 4, x: 48, y: 16 },
          { at: 6, x: 30, y: 14 },
        ],
      },
      // 5: its VI Corps, which comes round by the north
      {
        side: 'turk',
        dots: 6,
        wide: 3,
        facing: 180,
        path: [
          { at: 0, x: 68, y: 5 },
          { at: 2, x: 66, y: 5 },
          { at: 3, x: 56, y: 5 },
          { at: 4, x: 38, y: 6 },
          { at: 5, x: 20, y: 7 },
          { at: 6, x: 2, y: 9 },
        ],
      },
      // 6: the divisions that become Frangou's group
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        facing: 180,
        path: [
          { at: 0, x: 30, y: 43 },
          { at: 1, x: 30, y: 43 },
          { at: 2, x: 30, y: 43, left: 0.85 },
          { at: 2.5, x: 30, y: 40, left: 0.75 },
          { at: 3, x: 29, y: 33 },
          { at: 3.4, x: 28, y: 26 },
          { at: 4, x: 11, y: 27 },
          { at: 5, x: 8, y: 28, left: 0.6 },
          { at: 5.3, x: -10, y: 29 },
        ],
      },
      // 7 and 8: the divisions that become Trikoupis's group
      {
        side: 'foe',
        dots: 10,
        wide: 5,
        facing: 180,
        path: [
          { at: 0, x: 44, y: 43 },
          { at: 1, x: 44, y: 43 },
          { at: 2, x: 44, y: 43, left: 0.8 },
          { at: 2.5, x: 45, y: 39, left: 0.65 },
          { at: 3, x: 47, y: 30 },
          { at: 3.5, x: 39, y: 22 },
          { at: 4, x: 31, y: 18 },
          { at: 4.4, x: 19, y: 18 },
          { at: 5, x: 18, y: 18, loose: 0.8, left: 0.3 },
          { at: 5.5, x: 18, y: 18, left: 0 },
        ],
      },
      {
        side: 'foe',
        dots: 12,
        wide: 6,
        facing: 90,
        path: [
          { at: 0, x: 61, y: 21 },
          { at: 2.5, x: 60, y: 21 },
          { at: 3, x: 52, y: 19 },
          { at: 3.5, x: 42, y: 16 },
          { at: 4, x: 34, y: 13 },
          { at: 4.4, x: 22, y: 13 },
          { at: 5, x: 20, y: 14, loose: 0.8, left: 0.3 },
          { at: 5.5, x: 20, y: 14, left: 0 },
        ],
      },
    ],
    blasts: [
      { at: 1.15, x: 28, y: 43 },
      { at: 1.3, x: 37, y: 42 },
      { at: 1.45, x: 45, y: 43 },
      { at: 1.6, x: 32, y: 44 },
      { at: 5.2, x: 18, y: 16 },
      { at: 5.4, x: 21, y: 19 },
    ],
  },
]
