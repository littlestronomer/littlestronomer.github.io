// A Factorio factory seen from above. It is a small simulation: drills put ore on belts, arms carry
// items, and each machine turns what it gets into the next item. The page is one long line that you
// walk along: scrolling slides it sideways, from the ore fields to the rocket silo, and each note
// stands above the part of the factory it is about.
const runway = document.getElementById('runway')
const stage = document.getElementById('stage')
const slide = document.getElementById('slide')
const scene = document.getElementById('scene')
const labelsEl = document.getElementById('labels')
const chestsEl = document.getElementById('chests')
const bar = document.getElementById('bar')
const cardEls = [...document.querySelectorAll('.k-card')]
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const ctx = scene.getContext('2d')
const base = document.createElement('canvas')
// Everything stands on a grid of 6-pixel tiles, as in Factorio. The factory is 25 tiles tall.
const TILE = 6
const ROWS = 25
const BAND = ROWS * TILE
const PI = Math.PI
const UP = -PI / 2
const DOWN = PI / 2
// The ways an arm can swing: from where it picks up to where it drops, and which side it passes.
const LEFT_UP = [DOWN, (3 * PI) / 2]
const LEFT_DOWN = [UP, (-3 * PI) / 2]
const RIGHT_DOWN = [UP, DOWN]
const RIGHT_UP = [DOWN, UP]
const OVER = [PI, 2 * PI]
const UNDER = [PI, 0]
const cx = (col) => col * TILE + 3
const cy = (row) => row * TILE + 3

let W = 600
let H = BAND
let top = 0
// Rows of floor above the factory's own top edge, where the notes stand.
let aisle = 0
// What is on screen: the factory is drawn on a canvas as wide as the window, not as the whole line.
let camX = 0
let viewW = 0
let dirty = true
let viewL = 0
let viewR = 0
const seen = (x0, x1 = x0) => x1 > viewL && x0 < viewR
let scale = 4
let launchAt = null
let progress = 0
let world = null

const put = (c, color, x, y, w = 1, h = 1) => {
  c.fillStyle = color
  c.fillRect(Math.round(x), Math.round(y), w, h)
}

// What travels the line, from raw data to a checked answer. Each is 4x4 pixels.
const grid = (head) => [[0, 0, 4, 1, head], [0, 1, 4, 3, '#eceff2'], [0, 2, 4, 1, '#c5ccd3'], [1, 1, 1, 3, '#7a8794']]
const ITEMS = {
  oreBlue: [[1, 0, 2, 1, '#8fb0c8'], [0, 1, 4, 2, '#56718a'], [1, 3, 2, 1, '#3d5266'], [1, 1, 1, 1, '#a9c6da']],
  oreCopper: [[1, 0, 2, 1, '#e39056'], [0, 1, 4, 2, '#b0603a'], [1, 3, 2, 1, '#7f4325'], [1, 1, 1, 1, '#f0a874']],
  bronze: [[0, 1, 4, 1, '#e0a070'], [0, 2, 4, 2, '#b8692e']],
  silver: [[0, 1, 4, 1, '#f4f6f8'], [0, 2, 4, 2, '#aab1ba']],
  gold: [[0, 1, 4, 1, '#ffe48a'], [0, 2, 4, 2, '#dba21c']],
  table: grid('#3b7bd1'),
  realTable: grid('#4fae4f'),
  indexTable: grid('#e08a2c'),
  pyTable: [...grid('#3776ab'), [2, 0, 2, 1, '#ffd43b']],
  chart: [[0, 3, 4, 1, '#d9d9d9'], [0, 2, 1, 1, '#5eb663'], [1, 1, 1, 2, '#5eb663'], [2, 2, 1, 1, '#3b7bd1'], [3, 0, 1, 3, '#5eb663']],
  causal: [[0, 0, 4, 4, '#2a2a2a'], [0, 2, 1, 1, '#ff944d'], [1, 1, 1, 1, '#ff944d'], [2, 0, 1, 1, '#ff944d'], [0, 3, 1, 1, '#4aa8ff'], [1, 2, 1, 1, '#4aa8ff'], [2, 1, 1, 1, '#4aa8ff'], [3, 0, 1, 1, '#4aa8ff']],
  crate: [[0, 0, 4, 1, '#c49a62'], [0, 1, 4, 3, '#9a7444'], [0, 2, 4, 1, '#6b4f2a']],
  answer: [[0, 0, 4, 3, '#f4f4f4'], [1, 1, 2, 1, '#3a3a3a'], [0, 3, 1, 1, '#f4f4f4']],
  wrong: [[0, 0, 4, 3, '#f1d6d2'], [0, 3, 1, 1, '#f1d6d2'], [0, 0, 1, 1, '#d23b32'], [1, 1, 1, 1, '#d23b32'], [2, 2, 1, 1, '#d23b32'], [3, 0, 1, 1, '#d23b32'], [2, 1, 1, 1, '#d23b32'], [1, 2, 1, 1, '#d23b32']],
  checked: [[0, 0, 4, 3, '#4fae4f'], [0, 3, 1, 1, '#4fae4f'], [0, 1, 1, 1, '#ffffff'], [1, 2, 1, 1, '#ffffff'], [2, 1, 1, 1, '#ffffff'], [3, 0, 1, 1, '#ffffff']],
}

// A tiny 3x5 font, just for the numbers on the chests and the word on the pointer.
const GLYPHS = {
  l: ['X..', 'X..', 'X..', 'X..', 'XXX'],
  a: ['.X.', 'X.X', 'XXX', 'X.X', 'X.X'],
  t: ['XXX', '.X.', '.X.', '.X.', '.X.'],
  e: ['XXX', 'X..', 'XX.', 'X..', 'XXX'],
  s: ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  0: ['XXX', 'X.X', 'X.X', 'X.X', 'XXX'],
  1: ['.X.', 'XX.', '.X.', '.X.', 'XXX'],
  2: ['XXX', '..X', 'XXX', 'X..', 'XXX'],
  3: ['XXX', '..X', 'XXX', '..X', 'XXX'],
  4: ['X.X', 'X.X', 'XXX', '..X', '..X'],
  5: ['XXX', 'X..', 'XXX', '..X', 'XXX'],
  6: ['XXX', 'X..', 'XXX', 'X.X', 'XXX'],
  7: ['XXX', '..X', '..X', '..X', '..X'],
  8: ['XXX', 'X.X', 'XXX', 'X.X', 'XXX'],
  9: ['XXX', 'X.X', 'XXX', '..X', 'XXX'],
}
const textWidth = (str) => str.length * 4 - 1
function drawText(c, str, x, y, color) {
  c.fillStyle = color
  let gx = Math.round(x)
  for (const ch of str) {
    GLYPHS[ch].forEach((row, dy) => {
      for (let dx = 0; dx < 3; dx++) if (row[dx] === 'X') c.fillRect(gx + dx, Math.round(y) + dy, 1, 1)
    })
    gx += 4
  }
}

function drawItem(c, kind, x, y) {
  const ox = Math.round(x) - 2
  const oy = Math.round(y) - 2
  for (const [dx, dy, w, h, color] of ITEMS[kind]) {
    c.fillStyle = color
    c.fillRect(ox + dx, oy + dy, w, h)
  }
}

// ---- The simulation: belts carry items, arms move them, machines turn them into others.

// k stretches the gaps between the machines, so the notes above them have room.
// lead adds length to the conveyor between the mines and the furnaces, for the first notes to stand
// above.
function buildWorld(k, lead = 0) {
  const g = (gap, least = gap) => Math.max(least, Math.round(gap * k))
  const w = { belts: [], machines: [], inserters: [], drills: [], trains: [], tick: 0 }
  // A belt that runs right to left keeps its positions as u = -x, so the movement code stays the
  // same; only drawing and the arms that drop onto it have to convert.
  const belt = (row, c0, c1, carries, rev = false) => {
    const bt = rev
      ? { row, a: -c0 * TILE, b: -c1 * TILE, rev, carries, items: [], noPrime: true }
      : { row, a: c0 * TILE, b: c1 * TILE, carries, items: [] }
    w.belts.push(bt)
    return bt
  }
  const machine = (kind, col, row, size, needs, makes, time, extra = {}) => {
    const m = { kind, col, row, x: col * TILE, y: row * TILE, size: size * TILE, needs, makes, time, inputs: {}, out: 0, craft: 0, flash: 0, ...extra }
    w.machines.push(m)
    return m
  }
  const arm = (col, row, [pick, drop], from, to, color = '#d8a92b') => {
    w.inserters.push({ x: cx(col), y: cy(row), pick, drop, from, to, color, speed: 5, state: 0, t: 0, holding: null })
  }

  // Where everything goes, in tiles from the left.
  const P0 = 15 + lead
  const f0 = P0 + 2
  const f1 = f0 + g(6)
  const f2 = f1 + g(6)
  // The snapshot vault stands between the gold furnaces and the table, so that stretch is long
  // enough for six chests.
  const t = f2 + Math.max(g(6), 24)
  const STAGES = [
    ['deflate', 'table', 'realTable'],
    ['index', 'realTable', 'indexTable'],
    ['python', 'indexTable', 'pyTable'],
    ['plot', 'pyTable', 'chart'],
    ['causal', 'chart', 'causal'],
    ['answer', 'causal', 'answer'],
    ['lab', 'answer', 'checked'],
  ]
  const stageCols = []
  let c = t + g(8, 7)
  STAGES.forEach(([name], i) => {
    if (i > 0) c += name === 'answer' ? g(7) : g(5)
    stageCols.push(c)
  })
  const s = c + g(6, 5)
  w.at = { P0, f: [f0, f1, f2], t, stageCols, stages: STAGES, s, P1: s + 10 }
  // The vault: every version of the data is kept in a chest of its own, like commits in git, and
  // `latest` is only a pointer that can be moved to any of them.
  const vault = { c0: f2 + 4, n: 6, base: 1, head: 5, shown: 0, hold: 30, commits: 0, flash: 0, back: false, dot: 0 }
  vault.shown = (vault.c0 + 3 * vault.head) * TILE + 6
  w.at.vault = vault
  w.vault = vault

  // Two smelting lines, EVDS above and BDDK below: ore to bronze, silver and gold. Each stage
  // has a furnace on both sides of its belt, with an arm to feed it and an arm to empty it.
  const table = machine('assembler', t, 10, 5, { gold: 2 }, 'table', 10, { big: true })
  const lines = [
    {
      row: 8, ore: 'oreBlue', drillRow: 6, tableArm: [9, LEFT_DOWN],
      sides: [
        { furnRow: 5, armRow: 7, into: LEFT_UP, out: RIGHT_DOWN, badgeY: 22 },
        { furnRow: 10, armRow: 9, into: LEFT_DOWN, out: RIGHT_UP },
      ],
    },
    {
      row: 16, ore: 'oreCopper', drillRow: 17, tableArm: [15, LEFT_UP],
      sides: [
        { furnRow: 18, armRow: 17, into: LEFT_DOWN, out: RIGHT_UP, badgeY: 120 },
        { furnRow: 13, armRow: 15, into: LEFT_UP, out: RIGHT_DOWN },
      ],
    },
  ]
  for (const L of lines) {
    const kinds = [L.ore, 'bronze', 'silver', 'gold']
    const segs = []
    let a = 1
    for (let i = 0; i < 3; i++) {
      segs.push(belt(L.row, a, w.at.f[i] + 1, kinds[i]))
      a = w.at.f[i] + 1
    }
    segs.push(belt(L.row, a, t + 1, 'gold'))
    for (let i = 0; i < 3; i++) {
      const fc = w.at.f[i]
      for (const side of L.sides) {
        const fm = machine('furnace', fc, side.furnRow, 2, { [kinds[i]]: 1 }, kinds[i + 1], 9 + ((fc + side.furnRow) % 4), { badgeY: side.badgeY })
        arm(fc, side.armRow, side.into, { belt: segs[i] }, { machine: fm })
        arm(fc + 1, side.armRow, side.out, { machine: fm }, { belt: segs[i + 1], pos: cx(fc + 1) })
      }
    }
    arm(t, L.tableArm[0], L.tableArm[1], { belt: segs[3] }, { machine: table })
    for (const dc of [2, 5, 8, 11]) {
      w.drills.push({ col: dc, row: L.drillRow, belt: segs[0], pos: cx(dc) + 3, kind: L.ore, every: 14, t: (dc * 5) % 14 })
    }
  }

  // The main line: each tool is a pair of machines, one on each side of the belt. The pair
  // that writes answers also takes documents straight off two trains.
  const rewrite = {}
  let prev = belt(12, t + 6, stageCols[0] + 1, 'table')
  arm(t + 5, 12, OVER, { machine: table }, { belt: prev, pos: cx(t + 6) })
  STAGES.forEach(([name, input, output], i) => {
    const sc = stageCols[i]
    const end = i < STAGES.length - 1 ? stageCols[i + 1] + 1 : s - 1
    const next = belt(12, sc + 1, end, output)
    const kind = name === 'lab' ? 'lab' : name === 'python' ? 'python' : 'assembler'
    const needs = name === 'answer' ? { causal: 1, crate: 1 } : { [input]: 1 }
    // The answer machines can also rewrite an answer the check sent back. The check machines
    // reject some of what they see.
    const extra = () => (name === 'answer' ? { alt: { wrong: 1 } } : name === 'lab' ? { rejects: 0.2, q: [] } : {})
    const above = machine(kind, sc, 8, 3, needs, output, 11 + (i % 3), { stage: name, ...extra() })
    const below = machine(kind, sc, 14, 3, needs, output, 12 + (i % 2), { stage: name, ...extra() })
    if (name === 'answer') rewrite.to = [above, below, sc]
    if (name === 'lab') rewrite.from = [above, below, sc]
    const color = name === 'lab' ? '#3b7bd1' : '#d8a92b'
    arm(sc, 11, LEFT_UP, { belt: prev }, { machine: above }, color)
    const ok = name === 'lab' ? 'checked' : undefined
    arm(sc + 2, 11, RIGHT_DOWN, { machine: above, only: ok }, { belt: next, pos: cx(sc + 2) }, color)
    arm(sc, 13, LEFT_DOWN, { belt: prev }, { machine: below }, color)
    arm(sc + 2, 13, RIGHT_UP, { machine: below, only: ok }, { belt: next, pos: cx(sc + 2) }, color)
    if (name === 'answer') {
      const down = { col: sc - 3, dir: 1, stopY: 8 * TILE, y: 8 * TILE, state: 'stop', cargo: 16, wait: 0 }
      const upward = { col: sc - 3, dir: -1, stopY: 14 * TILE, y: 14 * TILE, state: 'stop', cargo: 16, wait: 60 }
      w.trains.push(down, upward)
      arm(sc - 1, 9, OVER, { train: down }, { machine: above })
      arm(sc - 1, 15, UNDER, { train: upward }, { machine: below })
      w.at.rail = sc - 3
    }
    prev = next
  })
  // Answers the check rejects ride a belt back, past the top and the bottom of the line, and the
  // answer machines write them again.
  {
    const [labUp, labDown, lc] = rewrite.from
    const [ansUp, ansDown, ac] = rewrite.to
    const back = (row, armRow, pickDir, dropDir, labM, ansM) => {
      const ret = belt(row, lc + 2, ac + 1, 'wrong', true)
      arm(lc + 1, armRow, pickDir, { machine: labM, only: 'wrong' }, { belt: ret, pos: -cx(lc + 1) }, '#d23b32')
      arm(ac + 1, armRow, dropDir, { belt: ret }, { machine: ansM }, '#d23b32')
    }
    back(6, 7, RIGHT_UP, RIGHT_DOWN, labUp, ansUp)
    back(18, 17, RIGHT_DOWN, RIGHT_UP, labDown, ansDown)
  }
  const silo = machine('silo', s, 8, 9, { checked: 1 }, null, 4, { silo: true })
  arm(s - 1, 12, OVER, { belt: prev }, { machine: silo }, '#3b7bd1')
  w.silo = silo

  // Start as if the factory has been running for a while.
  for (const bt of w.belts) {
    if (bt.noPrime) continue
    for (let p = bt.b - 3; p >= bt.a + 3; p -= 6) bt.items.unshift({ kind: bt.carries, pos: p })
  }
  w.machines.forEach((m, i) => {
    for (const kk in m.needs) m.inputs[kk] = m.needs[kk]
    m.craft = 1 + ((i * 5) % m.time)
  })
  w.inserters.forEach((ins, i) => {
    ins.t = i % ins.speed
  })
  return w
}

function beltStep(bt) {
  const it = bt.items
  for (let i = it.length - 1; i >= 0; i--) {
    const limit = i === it.length - 1 ? bt.b - 3 : it[i + 1].pos - 5
    if (it[i].pos < limit) it[i].pos = Math.min(limit, it[i].pos + 1)
  }
}

function beltTake(bt) {
  const last = bt.items[bt.items.length - 1]
  if (last && last.pos >= bt.b - 4) {
    bt.items.pop()
    return last.kind
  }
  return null
}

function beltPut(bt, kind, pos) {
  for (const it of bt.items) if (Math.abs(it.pos - pos) < 5) return false
  let i = 0
  while (i < bt.items.length && bt.items[i].pos < pos) i++
  bt.items.splice(i, 0, { kind, pos })
  return true
}

function takeFrom(src) {
  if (src.belt) return beltTake(src.belt)
  if (src.machine) {
    const m = src.machine
    if (m.out > 0) {
      if (!m.q) {
        m.out--
        return m.makes
      }
      const i = m.q.findIndex((kind) => !src.only || kind === src.only)
      if (i >= 0) {
        m.out--
        return m.q.splice(i, 1)[0]
      }
    }
    return null
  }
  if (src.train) {
    const tr = src.train
    if (tr.state === 'stop' && tr.cargo > 0) {
      tr.cargo--
      return 'crate'
    }
  }
  return null
}

function giveTo(dst, kind) {
  if (dst.belt) return beltPut(dst.belt, kind, dst.pos)
  const m = dst.machine
  const need = m.needs[kind] ?? m.alt?.[kind]
  if (!need || (m.inputs[kind] ?? 0) >= need * 2) return false
  m.inputs[kind] = (m.inputs[kind] ?? 0) + 1
  return true
}

function inserterStep(ins) {
  if (ins.state === 0) {
    const kind = takeFrom(ins.from)
    if (kind) {
      ins.holding = kind
      ins.state = 1
      ins.t = 0
    }
  } else if (ins.state === 1) {
    if (ins.t < ins.speed) ins.t++
    else if (giveTo(ins.to, ins.holding)) {
      ins.holding = null
      ins.state = 2
      ins.t = 0
    }
  } else if (++ins.t >= ins.speed) {
    ins.state = 0
    ins.t = 0
  }
}

function machineStep(m) {
  if (m.flash > 0) m.flash--
  if (m.craft > 0) {
    if (--m.craft === 0) {
      if (m.makes) {
        m.out++
        m.q?.push(Math.random() < m.rejects ? 'wrong' : m.makes)
      }
      m.flash = 3
    }
    return
  }
  if (m.out >= 2) return
  const has = (recipe) => Object.keys(recipe).every((kk) => (m.inputs[kk] ?? 0) >= recipe[kk])
  const recipe = has(m.needs) ? m.needs : m.alt && has(m.alt) ? m.alt : null
  if (!recipe) return
  for (const kk in recipe) m.inputs[kk] -= recipe[kk]
  m.craft = m.time
}

function drillStep(d) {
  if (d.t < d.every) d.t++
  if (d.t >= d.every && beltPut(d.belt, d.kind, d.pos)) d.t = 0
}

// A train comes to the end of its track, waits while its wagon is emptied, and backs away.
function trainStep(tr) {
  const away = tr.dir > 0 ? -top - 80 : H - top + 50
  if (tr.state === 'arrive') {
    const d = tr.stopY - tr.y
    tr.y += Math.sign(d) * Math.max(0.35, Math.min(2.2, Math.abs(d) * 0.07))
    if ((tr.dir > 0 && tr.y >= tr.stopY) || (tr.dir < 0 && tr.y <= tr.stopY)) {
      tr.y = tr.stopY
      tr.state = 'stop'
      tr.wait = 0
    }
  } else if (tr.state === 'stop') {
    tr.wait++
    if ((tr.cargo === 0 && tr.wait > 12) || tr.wait > 300) tr.state = 'leave'
  } else if (tr.state === 'leave') {
    tr.y -= tr.dir * Math.min(2.4, 0.3 + Math.abs(tr.y - tr.stopY) * 0.05)
    if ((tr.dir > 0 && tr.y <= away) || (tr.dir < 0 && tr.y >= away)) {
      tr.state = 'away'
      tr.wait = 0
    }
  } else if (++tr.wait > 30) {
    tr.cargo = 16
    tr.state = 'arrive'
  }
}

// The vault keeps a window of the latest snapshots. Every so often a new one is committed, and every
// fourth time the pointer goes back to an older one first, and then comes forward again.
const vaultX = (v, i) => (v.c0 + 3 * i) * TILE
function vaultStep(v) {
  if (v.flash > 0) v.flash--
  v.dot = (v.dot + 1) % 24
  v.shown += (vaultX(v, v.head) + 6 - v.shown) * 0.25
  if (--v.hold > 0) return
  if (v.back) {
    v.back = false
    v.head = v.n - 1
    v.hold = 50 + Math.floor(Math.random() * 30)
  } else if (++v.commits % 4 === 0) {
    v.back = true
    v.head = Math.max(0, v.n - 1 - (2 + Math.floor(Math.random() * 3)))
    v.hold = 70
  } else {
    v.base++
    v.head = v.n - 1
    v.flash = 8
    v.hold = 50 + Math.floor(Math.random() * 30)
  }
}

// Clicking a chest moves the pointer there and keeps it for a while, before the vault carries on by
// itself. It does nothing else: this is only to play with.
function pickSnapshot(i) {
  const v = world.vault
  v.head = i
  v.back = i !== v.n - 1
  v.hold = 160
}

let chestBase = 0
const chestName = (v, i) => ((v.base + i - 1) % 99) + 1
function labelChests() {
  const v = world.vault
  chestBase = v.base
  chestsEl.querySelectorAll('.chest').forEach((el, i) => {
    el.setAttribute('aria-label', `Snapshot ${chestName(v, i)}. Move latest here.`)
  })
}

// One button over each chest of the vault, in the same place as the picture of it.
function placeChests() {
  const v = world.vault
  chestsEl.textContent = ''
  for (let i = 0; i < v.n; i++) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'chest'
    b.title = 'Move latest here'
    b.style.left = `${vaultX(v, i) * scale}px`
    b.style.top = `${(top + 76) * scale}px`
    b.style.width = `${12 * scale}px`
    b.style.height = `${12 * scale}px`
    b.addEventListener('click', () => pickSnapshot(i))
    chestsEl.append(b)
  }
  labelChests()
}

function step() {
  world.tick++
  vaultStep(world.vault)
  for (const bt of world.belts) beltStep(bt)
  for (const d of world.drills) drillStep(d)
  // Two arms often reach for the same belt slot. In a fixed order the first one always wins and its
  // neighbour starves, so they take turns at random.
  const order = (world.order ??= world.inserters.map((_, i) => i))
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (const i of order) inserterStep(world.inserters[i])
  for (const m of world.machines) machineStep(m)
  for (const tr of world.trains) trainStep(tr)
}

// ---- Painting. The still parts go on a canvas of their own, drawn once.

// ---- Layout. The page is one long line, and everything on it moves together. The notes stand on
// the factory floor, above the machines they are about, so scrolling walks along the pipeline.

const MARGIN = 24
const CARD_GAP = 28
// Where along the factory, in scene pixels, the middle of the part each kind of note is about stands.
const ANCHORS = {
  fur: (at) => (at.f[1] + 1) * TILE,
  vault: (at) => (at.vault.c0 + (3 * (at.vault.n - 1)) / 2 + 1) * TILE,
  agent: (at) => ((at.stageCols[0] + at.stageCols[3]) / 2) * TILE + 9,
  trains: (at) => (at.rail + 1) * TILE,
  trust: (at) => at.stageCols[at.stageCols.length - 1] * TILE + 9,
  result: (at) => (at.s - 2) * TILE,
}

let K = 0
let lefts = []
let cardWidths = []
let travel = 0
let caption = { items: [], depth: 0 }

// A note is narrower than the window on a phone, except the credits, which are a strip of boxes
// that you walk past one at a time.
const cardWidth = (el, vw) => (el.id === 'k-credits' ? Number(el.dataset.w) : Math.min(Number(el.dataset.w), vw - 2 * MARGIN))
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Left edge of every note, in screen pixels along the line. A note that would run into the one
// before it is pushed right, and `drift` says how far the worst one is from its machines.
function placeCards(at, sc) {
  let right = 0
  let drift = 0
  const out = cardEls.map((el, i) => {
    const w = cardWidths[i]
    const kind = el.dataset.anchor
    let want
    if (kind === 'start') want = MARGIN
    else if (kind === 'after') want = right + CARD_GAP
    else if (kind === 'credits') want = at.P1 * TILE * sc + 40
    else want = ANCHORS[kind](at) * sc - w / 2
    const left = Math.max(want, i ? right + CARD_GAP : MARGIN)
    drift = Math.max(drift, left - want)
    right = left + w
    return left
  })
  return { lefts: out, right, drift }
}

function layout() {
  const vw = stage.clientWidth
  const vh = stage.clientHeight
  const headerH = bar.offsetHeight + 12
  // The notes need as much room as the tallest one takes at its width.
  cardWidths = cardEls.map((el) => cardWidth(el, vw))
  cardEls.forEach((el, i) => {
    el.style.width = `${cardWidths[i]}px`
    el.style.maxHeight = 'none'
  })
  const need = Math.min(560, Math.max(240, ...cardEls.map((el) => el.scrollHeight)) + 12)
  const before = cardEls.findIndex((el) => el.id === 'k-lake')
  const lakeMiddle = MARGIN + cardWidths.slice(0, before).reduce((sum, w) => sum + w + CARD_GAP, 0) + cardWidths[before] / 2

  // Try the pixel sizes from the biggest down, and keep the first where the notes fit on the floor
  // above the machines: between the bar and the red belts, 27 pixels under the factory's top edge.
  let plan
  for (const sc of [5, 4, 3, 2, 1.5, 1]) {
    scale = sc
    // The hello note stands over the mines, and the next ones over the conveyor that carries the ore
    // to the furnaces. That conveyor gets just long enough, and then the gaps between the machines
    // are stretched until every other note has room above its machines.
    const make = (k) => buildWorld(k, Math.max(0, Math.ceil(lakeMiddle / (sc * TILE) - (15 + 2 + Math.round(6 * k) + 1))))
    let k = 1
    let candidate = make(k)
    let laid = placeCards(candidate.at, sc)
    while (laid.drift > 40 && k < 10) {
      k = Math.round((k + 0.2) * 10) / 10
      candidate = make(k)
      laid = placeCards(candidate.at, sc)
    }
    // Captions hang below the factory, so measure them to know how much room they need.
    const captions = paintLabels(candidate)
    const room = Math.max(0, captions.depth - BAND * sc)
    const t = Math.max(0, Math.floor((vh - 10 - room - BAND * sc) / sc))
    plan = { sc, k, candidate, laid, captions, t }
    if ((t + 27) * sc - headerH - 6 >= need) break
  }
  scale = plan.sc
  const { k, candidate, laid } = plan
  caption = plan.captions
  top = plan.t
  if (!world || k !== K || world.at.P0 !== candidate.at.P0) world = candidate
  K = k
  lefts = laid.lefts
  const trackW = Math.max(vw, Math.ceil(laid.right + MARGIN))
  travel = trackW - vw
  W = Math.ceil(trackW / scale)
  aisle = Math.max(0, Math.floor((top * scale - headerH - 6) / (TILE * scale)))
  H = Math.ceil(vh / scale)
  viewW = vw
  const cw = Math.ceil(vw / scale) + 2
  scene.width = cw
  scene.height = H
  scene.style.width = `${cw * scale}px`
  scene.style.height = `${H * scale}px`
  mast.width = Math.ceil(mast.clientWidth / 3)
  mast.height = Math.ceil(mast.clientHeight / 3)
  slide.style.width = `${trackW}px`
  runway.style.height = `${vh + travel}px`
  paintBase()
  for (const c of caption.items) {
    c.el.style.top = `${top * scale + c.rel}px`
    if (c.stem) c.stem.style.top = `${top * scale + c.from}px`
  }
  // The notes sit on the floor, with their bottom edge 27 pixels under the factory's top edge.
  const floorTop = (top - TILE * aisle + TILE) * scale
  cardEls.forEach((el, i) => {
    el.style.left = `${lefts[i]}px`
    el.style.bottom = `${vh - (top + 27) * scale}px`
    el.style.maxHeight = `${Math.max(160, (top + 27) * scale - floorTop - 10)}px`
  })
  placeChests()
  paint(performance.now())
}

function paintBase() {
  base.width = W
  base.height = H
  const b = base.getContext('2d')
  const at = world.at
  let s = 1054
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const P = (color, x, y, w = 1, h = 1) => put(b, color, x, top + y, w, h)
  const floorX0 = at.P0 * TILE
  const floorX1 = at.P1 * TILE

  // Dirt, with darker patches, specks, stones and grass.
  put(b, '#3a3121', 0, 0, W, H)
  for (let i = 0; i < W / 18; i++) {
    const ox = rnd() * W
    const oy = rnd() * H
    const r = 6 + rnd() * 14
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y < r * r && rnd() < 0.55) put(b, '#352d1e', ox + x, oy + y)
  }
  const specks = ['#4a402a', '#2e271a', '#453b27', '#4f4530', '#2c2518', '#433a26']
  for (let i = 0; i < (W * H) / 14; i++) put(b, specks[(rnd() * specks.length) | 0], rnd() * W, rnd() * H)
  for (let i = 0; i < W / 10; i++) {
    const x = rnd() * W
    const y = rnd() * H
    put(b, '#4b5a2c', x, y)
    put(b, '#5c6e36', x + 1, y - 1)
  }

  // Two ore fields beside the start of the lines: EVDS in iron blue, BDDK in copper.
  const ore = (ox, oy, rx, ry, colors) => {
    for (let y = -ry; y <= ry; y += 2) for (let x = -rx; x <= rx; x += 2) {
      const d = (x * x) / (rx * rx) + (y * y) / (ry * ry)
      if (d < 1 && rnd() < 0.8 - d * 0.6) {
        P(colors[0], ox + x, oy + y, 2, 2)
        if (rnd() < 0.35) P(colors[1], ox + x, oy + y)
        if (rnd() < 0.2) P(colors[2], ox + x + 1, oy + y + 1)
      }
    }
  }
  ore(46, 36, 42, 16, ['#56718a', '#8fb0c8', '#3d5266'])
  ore(46, 114, 42, 16, ['#b0603a', '#e39056', '#7f4325'])

  // Trees beyond the factory, and in the dirt above and below it.
  const tree = (x, y) => {
    if (x > floorX0 - 12 && x < floorX1 + 2 && y > top - TILE * aisle - 10 && y < top + BAND + 2) return
    if (x < floorX0 && y > top + 14 && y < top + BAND - 14) return
    put(b, '#211a10', x + 2, y + 5, 7, 2)
    put(b, '#2e4a22', x + 1, y, 7, 5)
    put(b, '#2e4a22', x + 2, y - 1, 5, 1)
    put(b, '#3d6130', x + 2, y, 3, 2)
    put(b, '#4f7a3a', x + 3, y, 1, 1)
  }
  for (let i = 0; i < W / 4; i++) tree(rnd() * W, rnd() * H)
  for (let i = 0; i < 60; i++) tree(floorX1 + 6 + rnd() * Math.max(0, W - floorX1 - 6), rnd() * H)

  // The factory floor: concrete tiles, with hazard stripes at both ends.
  for (let row = -aisle; row < ROWS; row++) {
    for (let col = at.P0; col < at.P1; col++) {
      const x = col * TILE
      const y = row * TILE
      P('#4b4944', x, y, TILE, TILE)
      P('#3f3d39', x, y, TILE, 1)
      P('#3f3d39', x, y, 1, TILE)
      if (rnd() < 0.35) P('#56544e', x + 2 + ((rnd() * 3) | 0), y + 2 + ((rnd() * 3) | 0))
    }
  }
  for (const col of [at.P0, at.P1 - 1]) {
    for (let y = -TILE * aisle; y < BAND; y++) {
      for (let x = 0; x < TILE; x++) P((x + y) % 6 < 3 ? '#d6a21e' : '#1f1d1a', col * TILE + x, y)
    }
  }

  // Walls along both edges of the floor, with gates where the rails come in.
  const wall = (col, row) => {
    P('#55554a', col * TILE, row * TILE, TILE, TILE)
    P('#9a9a8a', col * TILE, row * TILE, TILE - 1, TILE - 1)
    P('#b9b9a8', col * TILE, row * TILE, TILE - 1, 1)
  }
  const gate = (col) => col === at.rail || col === at.rail + 1
  for (let col = at.P0 + 1; col < at.P1 - 1; col++) {
    if (gate(col)) {
      P('#d6a21e', col * TILE, 2 - TILE * aisle, TILE, 2)
      P('#d6a21e', col * TILE, BAND - 4, TILE, 2)
      continue
    }
    wall(col, -aisle)
    wall(col, ROWS - 1)
  }
  world.turrets = []
  for (let col = at.t; col < at.s + 8; col += 9) {
    if (col >= at.rail - 1 && col <= at.rail + 2) continue
    for (const y of [7 - TILE * aisle, BAND - 15]) {
      P('#2b2a20', col * TILE - 1, y, 8, 8)
      P('#8a7a45', col * TILE, y + 1, 6, 6)
      P('#5c512c', col * TILE + 1, y + 2, 4, 4)
      P('#262626', col * TILE + 2, y < 50 ? y - 3 : y + 8, 2, 3)
    }
    world.turrets.push(col * TILE + 3)
  }

  // Small electric poles along the floor, wired together.
  for (const y of [18 - TILE * aisle, 128]) {
    let last = null
    for (let col = at.P0 + 2; col < at.P1 - 2; col += 8) {
      if (col >= at.rail - 1 && col <= at.rail + 2) {
        last = null
        continue
      }
      const x = col * TILE + 2
      if (last !== null) P('#1a1a1a', last + 1, y - 1, x - last, 1)
      P('#4a3420', x, y, 2, 4)
      P('#6b4a2a', x - 1, y, 4, 1)
      last = x
    }
  }

  // The vault room: a dark floor plate for the chests, with a rail of commits under them.
  {
    const v = at.vault
    const x0 = (v.c0 - 1) * TILE
    const w = (3 * (v.n - 1) + 4) * TILE
    P('#262522', x0 - 1, 54, w + 2, 43)
    P('#34332f', x0, 55, w, 41)
    P('#46443f', x0, 55, w, 1)
  }

  // Pipes between the furnace rows.
  const px0 = (at.f[0] - 1) * TILE
  const px1 = (at.vault.c0 - 1) * TILE
  P('#4a4a4a', px0, 12 * TILE + 1, px1 - px0, 4)
  P('#7b7b7b', px0, 12 * TILE + 1, px1 - px0, 3)
  P('#9c9c9c', px0, 12 * TILE + 1, px1 - px0, 1)
  for (let x = px0; x < px1; x += 12) P('#555555', x, 12 * TILE, 2, TILE)

  // Drills.
  for (const d of world.drills) {
    const x = d.col * TILE
    const y = d.row * TILE
    P('#2b2b2b', x, y, 12, 12)
    P('#6f6f6f', x + 1, y + 1, 10, 10)
    P('#9a9a9a', x + 1, y + 1, 10, 1)
    P('#3d3d3d', x + 3, y + 3, 6, 6)
  }

  // The railways that bring documents, each ending at a buffer stop by the answer machines.
  const rx = at.rail * TILE
  const sleepers = (y0, y1) => {
    for (let y = y0; y < y1; y += 4) P('#5a4632', rx, y, 12, 2)
    for (const r of [rx + 2, rx + 9]) {
      P('#6e6e6e', r + 1, y0, 1, y1 - y0)
      P('#a9a9a9', r, y0, 1, y1 - y0)
    }
  }
  sleepers(-top, 11 * TILE)
  sleepers(14 * TILE, H - top)
  P('#2b2b2b', rx + 1, 11 * TILE - 2, 10, 3)
  P('#d14a3a', rx + 2, 11 * TILE - 2, 8, 2)
  P('#2b2b2b', rx + 1, 14 * TILE - 1, 10, 3)
  P('#d14a3a', rx + 2, 14 * TILE, 8, 2)

  // Machines.
  for (const m of world.machines) {
    const { x, y, size: z } = m
    if (m.kind === 'furnace') {
      P('#3e3628', x, y, 12, 12)
      P('#8c7b62', x + 1, y + 1, 10, 10)
      P('#a8977c', x + 1, y + 1, 10, 2)
      P('#2a1f12', x + 3, y + 5, 6, 5)
    } else if (m.kind === 'silo') {
      P('#1f1f1f', x, y, z, z)
      P('#6a6a6a', x + 1, y + 1, z - 2, z - 2)
      P('#8e8e8e', x + 1, y + 1, z - 2, 3)
      P('#4a4a4a', x + 1, y + z - 4, z - 2, 3)
      P('#141414', x + 16, y + 14, 22, 22)
    } else {
      const body = m.kind === 'lab' ? '#7d7d7d' : m.kind === 'python' ? '#5f6f86' : '#8a8f93'
      const light = m.kind === 'lab' ? '#a3a3a3' : m.kind === 'python' ? '#8394ad' : '#b4b9bd'
      P('#2a2d30', x, y, z, z)
      P(body, x + 1, y + 1, z - 2, z - 2)
      P(light, x + 1, y + 1, z - 2, 1)
      P('#5a5e62', x + 1, y + z - 2, z - 2, 1)
      const h = z / 2
      P('#3a3e42', x + h - 6, y + h - 6, 12, 12)
      if (m.big) for (const [dx, dy] of [[3, 3], [z - 6, 3], [3, z - 6], [z - 6, z - 6]]) P('#3f4447', x + dx, y + dy, 3, 3)
    }
  }

  // The sandbox: the machines that run code the agent writes stand inside a wall of their own.
  const pyCol = at.stageCols[at.stages.findIndex(([name]) => name === 'python')]
  for (let row = 7; row <= 17; row++) {
    if (row === 12) continue
    wall(pyCol - 1, row)
    wall(pyCol + 3, row)
  }
  for (let col = pyCol; col <= pyCol + 2; col++) {
    wall(col, 7)
    wall(col, 17)
  }
}

function drawBelt(bt, t) {
  const y = top + bt.row * TILE
  // Left and right ends in x, whichever way the belt runs, and which way its stripes crawl.
  const left = bt.rev ? -bt.b : bt.a
  const right = bt.rev ? -bt.a : bt.b
  if (!seen(left, right)) return
  const phase = bt.rev ? 3 - (t % 4) : t % 4
  put(ctx, bt.rev ? '#4d1d18' : '#5a4513', left, y, right - left, 6)
  put(ctx, bt.rev ? '#9c3a2f' : '#a7832a', left, y + 1, right - left, 4)
  ctx.fillStyle = bt.rev ? '#e87a6c' : '#e2bd4f'
  // Only the stretch in the window, starting on the same stripe so the pattern does not move.
  let x = left - 4 + phase
  if (x < viewL) x += Math.ceil((viewL - x) / 4) * 4
  for (; x < Math.min(right, viewR); x += 4) {
    if (x + 1 >= left && x + 1 < right) {
      ctx.fillRect(x + 1, y + 1, 1, 1)
      ctx.fillRect(x + 1, y + 4, 1, 1)
    }
    if (x + 2 >= left && x + 2 < right) ctx.fillRect(x + 2, y + 2, 1, 2)
  }
}

// An arm: a base, and an arm that swings from where it picks up to where it drops.
function drawInserter(ins) {
  if (!seen(ins.x - 8, ins.x + 8)) return
  const f = ins.state === 0 ? 0 : ins.state === 1 ? ins.t / ins.speed : 1 - ins.t / ins.speed
  const e = f * f * (3 - 2 * f)
  const angle = ins.pick + (ins.drop - ins.pick) * e
  const bx = ins.x
  const by = top + ins.y
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  put(ctx, '#1a1a1a', bx - 2, by - 2, 4, 4)
  put(ctx, ins.color, bx - 1, by - 1, 2, 2)
  for (let r = 1; r <= 5; r++) put(ctx, r === 3 ? '#7a7a7a' : '#b8b8b8', bx + cos * r - 0.5, by + sin * r - 0.5)
  const hx = bx + cos * 6
  const hy = by + sin * 6
  put(ctx, ins.color, hx - 1, hy - 1, 2, 2)
  if (ins.holding) drawItem(ctx, ins.holding, hx, hy)
}

// The snapshot vault. Each chest is one version of the data, numbered like commits. Newer ones are
// added on the right, the older ones stay, and the pointer says which one the table is built from.
function drawVault(v, tableX) {
  const y0 = top
  const head = vaultX(v, v.head) + 6
  const color = v.back ? '#ff944d' : '#5eb663'
  for (let i = 0; i < v.n; i++) {
    const x = vaultX(v, i)
    const newer = i > v.head
    ctx.globalAlpha = newer ? 0.4 : 1
    // The chest: a lid, a body and a gold band, with a lifted lid on the newest while it is filled.
    put(ctx, '#3a2814', x, y0 + 76, 12, 11)
    put(ctx, '#9a7444', x + 1, y0 + 77, 10, 9)
    put(ctx, '#c49a62', x + 1, y0 + 77, 10, 2)
    put(ctx, '#6b4a2a', x + 1, y0 + 84, 10, 2)
    put(ctx, '#ffe48a', x + 5, y0 + 77, 2, 9)
    put(ctx, '#dba21c', x + 5, y0 + 82, 2, 2)
    if (i === v.n - 1 && v.flash > 0) {
      put(ctx, '#ffe48a', x + 3, y0 + 73, 6, 2)
      put(ctx, '#fff1b8', x + 4, y0 + 71 - (v.flash >> 2), 4, 2)
    }
    const num = String(((v.base + i - 1) % 99) + 1)
    drawText(ctx, num, x + 6 - textWidth(num) / 2, y0 + 67, i === v.head ? '#ffe27a' : '#cfcfcf')
    ctx.globalAlpha = 1
    if (i === v.head) {
      ctx.fillStyle = color
      ctx.fillRect(x - 1, y0 + 75, 14, 1)
      ctx.fillRect(x - 1, y0 + 87, 14, 1)
      ctx.fillRect(x - 1, y0 + 75, 1, 13)
      ctx.fillRect(x + 12, y0 + 75, 1, 13)
    }
  }
  // The history: a line through every version, with a dot for each.
  put(ctx, '#8a8a8a', vaultX(v, 0) + 6, y0 + 91, vaultX(v, v.n - 1) - vaultX(v, 0), 1)
  for (let i = 0; i < v.n; i++) put(ctx, i === v.head ? color : '#bdbdbd', vaultX(v, i) + 5, y0 + 90, 3, 3)
  // The pointer, called latest, rides above the chests.
  const px = Math.round(v.shown)
  put(ctx, '#1d1c1b', px - 12, y0 + 55, 24, 7)
  drawText(ctx, 'latest', px - textWidth('latest') / 2, y0 + 56, color)
  put(ctx, color, px - 2, y0 + 62, 5, 1)
  put(ctx, color, px - 1, y0 + 63, 3, 1)
  put(ctx, color, px, y0 + 64, 1, 1)
  // What the table is built from runs on a wire from the pointed chest.
  ctx.fillStyle = '#5b5040'
  for (let x = head; x < tableX - 3; x += 3) ctx.fillRect(x, y0 + 94, 1, 1)
  for (let y = y0 + 94; y > y0 + 75; y -= 3) ctx.fillRect(tableX - 3, y, 1, 1)
  const run = (v.dot / 24) * (tableX - 3 - head)
  put(ctx, '#ffe48a', head + run - 1, y0 + 93, 3, 3)
}

function badge(kind, x, y) {
  put(ctx, '#121212', x, y, 8, 8)
  put(ctx, '#2f2f2f', x + 1, y + 1, 6, 6)
  drawItem(ctx, kind, x + 4, y + 4)
}

function draw(now) {
  const t = world.tick
  // The canvas shows one window of the line, starting camX scene pixels in. Everything below is
  // drawn at its place on the whole line, and shifted into the window.
  viewL = camX - 40
  viewR = camX + scene.width + 40
  ctx.drawImage(base, camX, 0, scene.width, H, 0, 0, scene.width, H)
  ctx.save()
  ctx.translate(-camX, 0)
  for (const bt of world.belts) drawBelt(bt, t)
  for (const bt of world.belts) {
    for (const it of bt.items) {
      const x = bt.rev ? -it.pos : it.pos
      if (seen(x)) drawItem(ctx, it.kind, x, top + bt.row * TILE + 3)
    }
  }

  // Drills turn while they dig.
  for (const d of world.drills) {
    if (!seen(d.col * TILE, d.col * TILE + 12)) continue
    const x = d.col * TILE + 6
    const y = top + d.row * TILE + 6
    ctx.fillStyle = '#d08a2a'
    if (d.t < d.every && (t >> 1) % 2) {
      for (let kk = -2; kk <= 2; kk++) {
        ctx.fillRect(x + kk, y + kk, 1, 1)
        ctx.fillRect(x + kk, y - kk, 1, 1)
      }
    } else {
      ctx.fillRect(x - 2, y, 5, 1)
      ctx.fillRect(x, y - 2, 1, 5)
    }
  }

  // Machines show when they are working, and what they make, the way Factorio's alt mode does.
  for (const m of world.machines) {
    if (!seen(m.x, m.x + m.size)) continue
    const x = m.x
    const y = top + m.y
    const z = m.size
    const busy = m.craft > 0
    if (m.kind === 'furnace') {
      put(ctx, busy ? (t % 4 < 2 ? '#ff8a1f' : '#ffd36b') : '#4a2410', x + 4, y + 6, 4, 3)
      if (m.badgeY !== undefined) {
        badge(m.makes, x + 2, top + m.badgeY)
        if (busy) {
          const puff = (t + x) % 16
          ctx.globalAlpha = 0.4 - puff / 44
          put(ctx, '#9a948a', x + 10 + puff / 3, m.badgeY < 70 ? y - 2 - puff / 2 : y + 13 + puff / 2, 3, 3)
          ctx.globalAlpha = 1
        }
      }
    } else if (m.kind === 'silo') {
      put(ctx, '#1b1b1b', x + 6, y + z - 9, z - 12, 3)
      put(ctx, '#5eb663', x + 6, y + z - 9, Math.round((z - 12) * progress), 3)
    } else {
      const h = z / 2
      const lit = busy ? '#6fd36f' : '#34443a'
      for (const [dx, dy] of [[2, 2], [z - 3, 2], [2, z - 3], [z - 3, z - 3]]) put(ctx, lit, x + dx, y + dy)
      if (busy) {
        // A spark runs around the badge while the machine works.
        const ring = 40
        const p = (t * 2 + x) % ring
        const side = Math.floor(p / 10)
        const along = p % 10
        const sx = side === 0 ? along : side === 1 ? 10 : side === 2 ? 10 - along : 0
        const sy = side === 0 ? 0 : side === 1 ? along : side === 2 ? 10 : 10 - along
        put(ctx, m.kind === 'lab' ? '#9fdcff' : '#ffe27a', x + h - 5 + sx, y + h - 5 + sy)
        put(ctx, '#6fd36f', x + 3, y + z - 3, Math.round((z - 6) * (1 - m.craft / m.time)), 1)
      }
      badge(m.makes, x + h - 4, y + h - 4)
    }
    if (m.flash) put(ctx, '#ffe27a', x + 1, y + 1, 2, 2)
  }

  // The trains: a wagon of documents, pushed by a locomotive, at the end of each track.
  const rx = world.at.rail * TILE
  for (const tr of world.trains) {
    if (!seen(rx, rx + 12)) break
    const wy = top + tr.y
    put(ctx, '#2b2b2b', rx + 1, wy, 10, 18)
    put(ctx, '#7b7b7b', rx + 2, wy + 1, 8, 16)
    for (let kk = 0; kk < Math.min(4, Math.ceil(tr.cargo / 4)); kk++) put(ctx, '#9a7444', rx + 2 + (kk % 2) * 4, wy + 2 + Math.floor(kk / 2) * 7, 4, 6)
    const ly = tr.dir > 0 ? wy - 24 : wy + 20
    put(ctx, '#2b1410', rx + 1, ly, 10, 22)
    put(ctx, '#b5432f', rx + 2, ly + 1, 8, 20)
    put(ctx, '#d4664f', rx + 2, ly + 1, 2, 20)
    put(ctx, '#1d2a33', rx + 3, tr.dir > 0 ? ly + 3 : ly + 15, 6, 4)
  }

  if (seen(vaultX(world.vault, 0) - 10, vaultX(world.vault, world.vault.n) + 10)) drawVault(world.vault, world.at.t * TILE)

  for (const ins of world.inserters) drawInserter(ins)

  // Biters come at the walls, and the turrets answer.
  world.turrets.forEach((x, i) => {
    if (!seen(x - 4, x + 4)) return
    const wig = (t + i) % 4 < 2 ? 0 : 1
    const wallTop = top - TILE * aisle
    const above = wallTop - 9 + ((t * 0.2 + i * 5) % 6)
    put(ctx, '#7a3b22', x - 3 + wig, above, 6, 3)
    put(ctx, '#c0392b', x - 2 + wig, above - 1, 4, 1)
    if ((t + i * 3) % 7 === 0) put(ctx, '#ffe27a', x, above + 3, 1, Math.max(1, wallTop + 4 - above - 3))
    const below = top + BAND + 4 + ((t * 0.2 + i * 3) % 6)
    put(ctx, '#7a3b22', x - 3 + wig, below, 6, 3)
    put(ctx, '#c0392b', x - 2 + wig, below + 3, 4, 1)
    if ((t + i * 5) % 7 === 0) put(ctx, '#ffe27a', x, top + BAND - 4, 1, Math.max(1, below - top - BAND + 4))
  })

  // The rocket waits in the silo until the end of the page, then goes up.
  const silo = world.silo
  const rx2 = silo.x + 24
  const sy = top + silo.y + 16
  if (launchAt === null) {
    put(ctx, '#e8e8e8', rx2, sy + 5, 6, 10)
    put(ctx, '#c0392b', rx2 + 2, sy + 8, 2, 2)
  } else {
    const e = (now - launchAt) / 1000
    const rise = e < 0.8 ? 0 : 30 * (e - 0.8) * (e - 0.8)
    const ry = sy - 18 - rise
    if (ry > -top - 60) {
      put(ctx, '#c0392b', rx2 + 2, ry - 3, 2, 2)
      put(ctx, '#e8e8e8', rx2 + 1, ry - 1, 4, 2)
      put(ctx, '#e8e8e8', rx2, ry + 1, 6, 26)
      put(ctx, '#3e6d93', rx2 + 1, ry + 8, 4, 2)
      put(ctx, '#c0392b', rx2 - 2, ry + 21, 2, 6)
      put(ctx, '#c0392b', rx2 + 6, ry + 21, 2, 6)
      put(ctx, t % 2 ? '#ffd36b' : '#fff1b8', rx2 + 1, ry + 27, 4, 4)
      put(ctx, '#ff8a1f', rx2, ry + 31, 6, 4)
      put(ctx, '#ff5a1f', rx2 + 1, ry + 35, 4, 3)
    }
    ctx.globalAlpha = 0.55
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const r = Math.min(34, e * 18) + (i % 3)
      put(ctx, '#b5b0a8', rx2 + 3 + Math.cos(a) * r - 2, sy + 12 + Math.sin(a) * r * 0.6 - 2, 5, 4)
    }
    ctx.globalAlpha = 1
  }
  ctx.restore()
}

// ---- The masthead: a concrete floor, with a belt of gold plates and anchovies along the bottom.
const mast = document.getElementById('mast')
const mctx = mast.getContext('2d')
function drawMast(t) {
  const w = mast.width
  const h = mast.height
  const p = (color, x, y, ww = 1, hh = 1) => put(mctx, color, x, y, ww, hh)
  p('#3e3d3a', 0, 0, w, h)
  for (let x = 0; x < w; x += 10) p('#363532', x, 0, 1, h)
  for (let y = 0; y < h; y += 10) p('#363532', 0, y, w, 1)
  const by = h - 9
  p('#5a4513', 0, by, w, 6)
  p('#a7832a', 0, by + 1, w, 4)
  mctx.fillStyle = '#e2bd4f'
  for (let x = -4 + (t % 4); x < w; x += 4) {
    mctx.fillRect(x + 1, by + 1, 1, 1)
    mctx.fillRect(x + 2, by + 2, 1, 2)
    mctx.fillRect(x + 1, by + 4, 1, 1)
  }
  // Every item has a number and keeps it as it rides: item n is at 12n + t, and its kind depends
  // only on n. (Wrapping the position every 12 pixels while the kinds repeat every 36 makes the
  // whole line jump back a step each time.)
  for (let n = Math.floor((-12 - t) / 12); n * 12 + t < w; n++) {
    const x = n * 12 + t
    if (((n % 3) + 3) % 3 === 0) {
      p('#3e6d93', x + 1, by + 1, 4, 1)
      p('#8fb7d6', x, by + 2, 6, 1)
      p('#c9dceb', x + 1, by + 3, 4, 1)
      p('#8fb7d6', x + 6, by + 1, 1, 3)
      p('#111', x + 1, by + 2, 1, 1)
    } else {
      drawItem(mctx, 'gold', x + 2, by + 2)
    }
  }
}

// ---- A key to the chain, in a box beside the notes.
const key = document.getElementById('chain-key')
const chain = [
  ['oreBlue', 'raw data'],
  ['bronze', 'bronze'],
  ['silver', 'silver'],
  ['gold', 'gold'],
  ['table', 'build_table'],
  ['realTable', 'deflate'],
  ['indexTable', 'index'],
  ['pyTable', 'python, walled in'],
  ['chart', 'plot'],
  ['causal', 'lead and lag'],
  ['crate', '+ documents by train'],
  ['answer', 'answer'],
  ['checked', 'checked'],
  ['wrong', 'rejected, sent back to be rewritten'],
]
chain.forEach(([kind, label]) => {
  const li = document.createElement('li')
  const c = document.createElement('canvas')
  c.width = 6
  c.height = 6
  const kc = c.getContext('2d')
  put(kc, '#2f2f2f', 0, 0, 6, 6)
  drawItem(kc, kind, 3, 3)
  li.append(c, label)
  key.append(li)
})

// ---- Captions: what each part of the factory is, just below it. They live in the same sliding
// layer as the picture, so they travel with their machines.
const CAPTIONS = {
  evds: ['TCMB EVDS', 'the central bank: a catalog of 53,842 series'],
  bddk: ['BDDK', 'the banking regulator\'s bulletins'],
  bronze: ['Bronze', 'raw files, exactly as they land'],
  silver: ['Silver', 'clean, typed series'],
  gold: ['Gold', 'coverage tables, published as a read-only DuckDB snapshot'],
  build_table: ['build_table', 'pulls the chosen series from the lakehouse into one table'],
  deflate: ['deflate', 'turns nominal lira into real lira'],
  index: ['index', 'puts every column on the same base year'],
  python: ['python, walled in', 'runs the code the agent writes in a sandbox with no network'],
  plot: ['plot', 'draws the chart, so no number is typed by hand'],
  causal: ['analyze_causality', 'tests which series leads and which lags'],
  answer: ['answer', 'writes the Turkish answer with its sources; documents arrive by train, and rejected answers come back here'],
  lab: ['check', 'guards catch made-up numbers, wrong dates and English, and send those answers back on the red belts'],
  vault: ['Snapshots', 'every version is kept; latest is only a pointer you can move back'],
  silo: ['The rocket', 'launches as you reach it, with a checked answer'],
}

function paintLabels(w) {
  labelsEl.textContent = ''
  const at = w.at
  const items = []
  const make = (name, x, cls = '') => {
    const [title, text] = CAPTIONS[name]
    const el = document.createElement('div')
    el.className = `tag ${cls}`
    const b = document.createElement('b')
    b.textContent = title
    const span = document.createElement('span')
    span.textContent = text
    el.append(b, span)
    el.style.left = `${x * scale}px`
    labelsEl.append(el)
    return el
  }
  // Each caption is a place in the band (rel is pixels below the top of the factory).
  const fixed = (name, x, y) => {
    const el = make(name, x)
    el.style.left = `${Math.max(el.offsetWidth / 2 + 4, x * scale)}px`
    items.push({ el, rel: y * scale })
  }

  // The ore fields have free ground just below them.
  fixed('evds', 46, 58)

  // Everything along the main line hangs below the floor of its machine. Neighbours are close, so
  // a caption that would run into the one before it drops to the next row down.
  const row = [
    ['bddk', 46, 128],
    // The furnaces of the lower line, whose belt is the second of the two.
    ...['bronze', 'silver', 'gold'].map((name, i) => [name, (at.f[i] + 1) * TILE, 120]),
    ['vault', (at.vault.c0 + (3 * (at.vault.n - 1)) / 2 + 1) * TILE, 104],
    ['build_table', at.t * TILE + 15, 90],
    // The red belts run just under the answer and check machines, so their lines start below them.
    ...at.stages.map(([name], i) => [name, at.stageCols[i] * TILE + 9, name === 'answer' || name === 'lab' ? 120 : 102]),
    ['silo', w.silo.x + 27, 102],
  ]
  const lanes = []
  const gap = 10
  const placed = []
  for (const [name, x, bottom] of row) {
    const el = make(name, x, 'under')
    const w = el.offsetWidth
    const left = Math.max(w / 2 + 4, x * scale)
    let lane = lanes.findIndex((right) => right + gap <= left - w / 2)
    if (lane < 0) lane = lanes.length < 3 ? lanes.length : lanes.indexOf(Math.min(...lanes))
    lanes[lane] = left + w / 2
    el.style.left = `${left}px`
    placed.push({ el, lane, bottom })
  }
  const laneH = Math.max(...placed.map(({ el }) => el.offsetHeight)) + 8
  for (const { el, lane, bottom } of placed) {
    const rel = 124 * scale + lane * laneH
    const from = bottom * scale
    const stem = document.createElement('i')
    stem.className = 'stem'
    stem.style.left = el.style.left
    stem.style.height = `${Math.max(0, rel - from)}px`
    labelsEl.prepend(stem)
    items.push({ el, rel, from, stem })
  }
  const depth = Math.max(...items.map((c) => c.rel + c.el.offsetHeight))
  return { items, depth }
}

// ---- Walking along the line.

const tabEls = [...bar.querySelectorAll('.tabs a[data-card]')]

let currentTab = null
function place() {
  const off = clamp(window.scrollY, 0, travel)
  progress = travel > 0 ? off / travel : 0
  // The notes and captions slide as one layer. The picture is a canvas the size of the window, so it
  // is drawn from the right place on the line, and slid by the part of a pixel that is left over.
  slide.style.transform = `translate3d(${-Math.round(off)}px, 0, 0)`
  const cam = Math.floor(off / scale)
  scene.style.transform = `translate3d(${-Math.round(off - cam * scale)}px, 0, 0)`
  if (cam !== camX) dirty = true
  camX = cam
  // The rocket goes when the silo comes into view, and waits again when you walk back.
  const siloX = (world.silo.x + 27) * scale - off
  if (siloX < viewW * 0.78 && launchAt === null) launchAt = performance.now()
  if (siloX > viewW * 0.96) launchAt = null
  // Which tab the note in the middle of the window belongs to.
  const mid = off + viewW * 0.35
  let current = cardEls[0]
  cardEls.forEach((el, i) => {
    if (lefts[i] <= mid) current = el
  })
  if (current !== currentTab) {
    currentTab = current
    for (const a of tabEls) {
      if (a.dataset.card === current.dataset.tab) a.setAttribute('aria-current', 'true')
      else a.removeAttribute('aria-current')
    }
  }
  if (reduced) paint(performance.now())
}

function goTo(id, smooth = true) {
  const i = cardEls.findIndex((el) => el.id === id)
  if (i < 0) return false
  const to = clamp(lefts[i] + cardWidths[i] / 2 - stage.clientWidth / 2, 0, travel)
  window.scrollTo({ top: to, behavior: smooth && !reduced ? 'smooth' : 'auto' })
  return true
}

function paint(now) {
  draw(now)
  drawMast(world.tick)
}

let last = 0
// The factory ticks about twelve times a second, but the picture is also drawn whenever you scroll,
// so that it keeps up with the notes.
function loop(now) {
  requestAnimationFrame(loop)
  const tick = now - last >= 80
  if (tick) {
    last = now
    step()
    if (world.vault.base !== chestBase) labelChests()
  }
  if (tick || dirty) {
    draw(now)
    dirty = false
  }
  if (tick) drawMast(world.tick)
}

layout()
if (reduced) {
  // No motion: let the factory run for a while, then show it as it stands.
  for (let i = 0; i < 400; i++) step()
} else {
  requestAnimationFrame(loop)
}
place()
if (location.hash) goTo(location.hash.slice(1), false)

window.addEventListener('scroll', place, { passive: true })
// A sideways swipe or wheel walks along the line too. This listener must not be able to cancel the
// wheel: a cancelable one makes the browser wait for this page before every scroll step. The
// browser's own sideways gesture (going back a page) is switched off in the style sheet instead.
window.addEventListener(
  'wheel',
  (event) => {
    if (event.ctrlKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
    window.scrollBy(0, event.deltaX)
  },
  { passive: true },
)
for (const a of tabEls) {
  a.addEventListener('click', (event) => {
    event.preventDefault()
    goTo(a.dataset.card)
  })
}
// Tabbing into a note that is off to the side brings it into view.
stage.addEventListener('focusin', (event) => {
  const el = event.target.closest?.('.k-card')
  const i = cardEls.indexOf(el)
  if (i < 0) return
  const off = window.scrollY
  if (lefts[i] < off + 8 || lefts[i] + cardWidths[i] > off + stage.clientWidth - 8) goTo(el.id, false)
})

// A phone's address bar slides away as you scroll and changes the height a little; that is not
// a reason to lay everything out again.
const touch = window.matchMedia('(pointer: coarse)').matches
let sized = [stage.clientWidth, stage.clientHeight]
new ResizeObserver(() => {
  const now = [stage.clientWidth, stage.clientHeight]
  if (now[0] === sized[0] && (now[1] === sized[1] || (touch && Math.abs(now[1] - sized[1]) < 140))) return
  sized = now
  layout()
  place()
}).observe(stage)
// The captions and notes are measured, so measure them again once the fonts are in.
document.fonts?.ready.then(() => {
  layout()
  place()
})
