import { useEffect, useRef, useState } from 'react'
import { GRAPH_HEIGHT, GRAPH_WIDTH, MAP_SIZE, graphColumns, startNetView, type NetControls, type NetStatus } from './netView'
import { prefersReducedMotion } from './pixels'
import { PUZZLES } from './tinyNet'

const START: NetStatus = { puzzle: PUZZLES[0].name, steps: 0, loss: null, accuracy: null, learned: false }
const LAYER_NAMES = ['input', 'hidden', 'hidden', 'output']

// A real neural network, learning in the visitor's browser while they read.
export default function TinyNet() {
  const map = useRef<HTMLCanvasElement>(null)
  const graph = useRef<HTMLCanvasElement>(null)
  const controls = useRef<NetControls | null>(null)
  const [status, setStatus] = useState(START)
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)

  useEffect(() => {
    if (!map.current || !graph.current) return
    const reduced = prefersReducedMotion()
    setStill(reduced)
    const view = startNetView(map.current, graph.current, { animate: !reduced, onStatus: setStatus })
    controls.current = view
    return () => {
      view.stop()
      controls.current = null
    }
  }, [])

  const togglePause = () => {
    setPaused(!paused)
    controls.current?.setPaused(!paused)
  }

  const state = status.learned ? 'Learned it!' : paused ? 'Paused on' : 'Learning'

  return (
    <section className="box net-box" aria-labelledby="net-title">
      <h2 id="net-title">A tiny net, learning live</h2>
      <canvas
        ref={map}
        className="net-map"
        width={MAP_SIZE}
        height={MAP_SIZE}
        role="img"
        aria-label="The network's guesses so far: the map is blue where it thinks blue dots belong and orange where it thinks orange dots belong, with the training dots on top."
      />
      <p className="net-state">
        <span className={status.learned ? 'net-glow is-learned' : 'net-glow'}>{state}</span> {status.puzzle}
      </p>
      <dl className="net-numbers">
        <div>
          <dt>Step</dt>
          <dd>{status.steps.toLocaleString('en')}</dd>
        </div>
        <div>
          <dt>Loss</dt>
          <dd>{status.loss === null ? '–' : status.loss.toFixed(3)}</dd>
        </div>
        <div>
          <dt>Right</dt>
          <dd>{status.accuracy === null ? '–' : `${Math.round(status.accuracy * 100)}%`}</dd>
        </div>
      </dl>
      <p className="net-caption">
        This is a real neural network, training in your browser as you read. It only knows where
        each dot is, and learns to color the map: blue where blue dots belong, orange where orange
        ones do. Once it gets them right, it moves on to a harder puzzle.
      </p>
      <div className="net-graph-wrap">
        <canvas ref={graph} className="net-graph" width={GRAPH_WIDTH} height={GRAPH_HEIGHT} aria-hidden="true" />
        <p className="net-layers" aria-hidden="true">
          {graphColumns().map((center, layer) => (
            <span key={layer} style={{ left: `${center * 100}%` }}>
              {LAYER_NAMES[layer]}
            </span>
          ))}
        </p>
      </div>
      <p className="net-caption">
        Each square is one neuron, showing which parts of the map make it fire. The lines are the
        weights between them: blue ones add, orange ones subtract, and brighter ones count for more.
      </p>
      <div className="net-controls">
        {!still && (
          <button type="button" onClick={togglePause}>
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
        <button type="button" onClick={() => controls.current?.nextPuzzle()}>
          Next puzzle
        </button>
      </div>
    </section>
  )
}
