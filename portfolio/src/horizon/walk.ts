// Where the walk is right now. The scroll code, the paper boat and the painted sky all
// read and write this object every frame, so it is plain mutable data, never React state.
// Screen positions are in CSS pixels, measured from the stage's bottom left corner.
export type Walk = {
  /** 0 at the first note, 1 at the last. */
  progress: number
  /** How far the painting has slid left. */
  skyX: number
  /** The paper boat's middle. */
  boatX: number
  /** The calm water level the boat floats on. */
  boatLevel: number
  /** The boat's drawing size, including the part under water. */
  boatWidth: number
  boatHeight: number
  /** How far the boat has bobbed above its resting waterline. */
  boatBob: number
  /** How far the boat leans, in radians, clockwise. */
  boatTilt: number
  /** How much the boat stirs the water, from 0 (none) to 1 (sailing fast). */
  boatStir: number
}

// The boat drawing's waterline, as a fraction of its height up from the bottom edge.
export const BOAT_WATERLINE = 0.14

export function createWalk(): Walk {
  return {
    progress: 0,
    skyX: 0,
    boatX: -1000,
    boatLevel: 0,
    boatWidth: 1,
    boatHeight: 1,
    boatBob: 0,
    boatTilt: 0,
    boatStir: 0,
  }
}
