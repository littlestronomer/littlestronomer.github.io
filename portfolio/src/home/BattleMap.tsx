import { useEffect, useRef, useState } from 'react'
import { BATTLES } from './battles'
import { BATTLE_MAP, startBattleView, type BattleControls, type BattleStatus } from './battleView'
import { prefersReducedMotion } from './pixels'

// In the Turkish theme this takes the tiny network's place: a small map that replays famous
// battles step by step, with each dot standing for a body of soldiers.
export default function BattleMap() {
  const map = useRef<HTMLCanvasElement>(null)
  const controls = useRef<BattleControls | null>(null)
  const [status, setStatus] = useState<BattleStatus>({ battle: 0, phase: 0 })
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)

  useEffect(() => {
    if (!map.current) return
    const reduced = prefersReducedMotion()
    setStill(reduced)
    const view = startBattleView(map.current, { animate: !reduced, onStatus: setStatus })
    controls.current = view
    return () => {
      view.stop()
      controls.current = null
    }
  }, [])

  const pause = (value: boolean) => {
    setPaused(value)
    controls.current?.setPaused(value)
  }

  /** Puts a battle on the map and plays it from its start. */
  const show = (battle: number) => {
    pause(false)
    controls.current?.show(battle)
  }

  const battle = BATTLES[status.battle]
  const phase = Math.max(0, status.phase)

  return (
    <section className="box net-box battle-box" id="turk-battle" aria-labelledby="battle-title">
      <h2 id="battle-title">How the battle went</h2>
      <ol className="battle-picks" aria-label="Battles, oldest first">
        {BATTLES.map((each, i) => (
          <li key={each.name}>
            <button
              type="button"
              aria-pressed={i === status.battle}
              aria-label={`${each.name}, ${each.when}`}
              title={each.name}
              onClick={() => show(i)}
            >
              {each.tag}
            </button>
          </li>
        ))}
      </ol>
      <canvas
        ref={map}
        className="net-map"
        width={BATTLE_MAP}
        height={BATTLE_MAP}
        role="img"
        aria-label={`A map of ${battle.name}. White dots: ${battle.turks}. Dark dots: ${battle.foes}.`}
      />
      <p className="net-state">
        <span className="net-glow">{battle.name}</span> {battle.when}
      </p>
      <ol className="battle-picks battle-steps" aria-label="Steps of this battle">
        {battle.phases.map((says, i) => (
          <li key={says}>
            <button
              type="button"
              aria-current={i === phase ? 'step' : undefined}
              aria-label={`Step ${i + 1} of ${battle.phases.length}`}
              onClick={() => controls.current?.toPhase(i)}
            >
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <p className="battle-phase" aria-live="polite">
        {battle.phases[phase]}
      </p>
      <dl className="battle-sides">
        <dt>
          <span className="battle-dot is-turk" aria-hidden="true" />
          White
        </dt>
        <dd>{battle.turks}</dd>
        <dt>
          <span className="battle-dot is-foe" aria-hidden="true" />
          Dark
        </dt>
        <dd>{battle.foes}</dd>
        <dt>Where</dt>
        <dd>{battle.where}</dd>
      </dl>
      <p className="net-caption">{battle.story}</p>
      <p className="net-caption">
        Each dot stands for a body of soldiers, and a day of fighting passes in seconds. Blue-green is
        water, darker ground is high, and the sand-colored marks are walls, wagons, stakes, tents and
        guns. The maps are sketches, not to scale; they follow the accounts of each battle in
        Wikipedia.
      </p>
      <div className="net-controls">
        {!still && (
          <button type="button" onClick={() => pause(!paused)}>
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
        <button type="button" onClick={() => show(status.battle + 1)}>
          Next battle
        </button>
      </div>
    </section>
  )
}
