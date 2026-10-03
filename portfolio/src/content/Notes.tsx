import type { ReactNode } from 'react'
import { timeAgo, useLiveCommits, useNow } from './liveCommits'
import { LINKS } from './profile'

// The notes about me, shared by the portfolio and the walk; each lays them out its own way.
// Facts come from the résumé (October 2026).

type LatestCommitsProps = {
  title?: string
  /** The heading level, so the list can sit inside a note or stand on its own. */
  level?: 2 | 3
}

/** My latest public commits, kept current while the page is open. */
export function LatestCommits({ title = 'Lately on GitHub', level = 3 }: LatestCommitsProps) {
  const { commits, status, resumesAt } = useLiveCommits()
  const now = useNow(30_000)
  const Heading = level === 2 ? 'h2' : 'h3'
  const profile = <a href={LINKS.github}>my GitHub profile</a>

  // The build renders the page without a browser, before any commits are fetched.
  if (typeof window === 'undefined') {
    return (
      <>
        <Heading>{title}</Heading>
        <p>My latest commits are on {profile}.</p>
      </>
    )
  }

  return (
    <>
      <Heading>
        {title}
        {status === 'live' && <span className="live-dot" aria-hidden="true" />}
      </Heading>
      {status === 'loading' && <p>Checking GitHub for my latest commits…</p>}
      {commits.length > 0 && (
        <ul className="note-commits" aria-live="polite">
          {commits.map((commit) => (
            <li key={commit.sha} className={commit.isNew ? 'is-new' : undefined}>
              <a href={commit.url}>{commit.message}</a>
              <span className="note-meta">
                {commit.repo}, {timeAgo(commit.pushedAt, now)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {status === 'live' && commits.length > 0 && (
        <p className="note-meta">This list updates by itself while the page is open.</p>
      )}
      {status === 'live' && commits.length === 0 && (
        <p>No public pushes in the last 90 days. Everything I share is on {profile}.</p>
      )}
      {status === 'resting' && resumesAt !== null && (
        <p className="note-meta">
          GitHub asked for a pause, so this list next updates at{' '}
          {new Date(resumesAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
        </p>
      )}
      {status === 'failed' && commits.length === 0 && (
        <p>GitHub didn&apos;t answer, so I can&apos;t list my latest commits. Everything I share is on {profile}.</p>
      )}
    </>
  )
}

export function HelloNote() {
  return (
    <article className="note note-hello" id="note-hello" tabIndex={-1} aria-labelledby="note-hello-title">
      <h1 id="note-hello-title">Göktürk Batın Dervişoğlu</h1>
      <p className="note-lead">
        I&apos;m an AI engineering student at Istanbul Technical University, working on ML
        systems, speech AI and fast inference.
      </p>
      <ul className="note-highlights">
        <li>
          <strong>Paper accepted</strong> at Agenthon 2026, a NeurIPS workshop
        </li>
        <li>
          <strong>4th place</strong> in the NVIDIA MLSys Competition, 2026
        </li>
        <li>
          <strong>Kaggle silver medal</strong>, 97th of 3,677 teams
        </li>
        <li>
          <strong>5.33× faster</strong> prefill than FlashInfer, written in CUDA
        </li>
      </ul>
      <p className="note-links">
        <a href={LINKS.github}>GitHub</a>
        <a href={LINKS.kaggle}>Kaggle</a>
        <a href={LINKS.linkedin}>LinkedIn</a>
        <a href={LINKS.youtube}>YouTube</a>
        <a href={LINKS.email}>Email</a>
      </p>
    </article>
  )
}

export function NowNote() {
  return (
    <article className="note note-now" id="note-now" tabIndex={-1} aria-labelledby="note-now-title">
      <h2 id="note-now-title">Right now</h2>
      <p>
        I&apos;m building Waifu SpellForge, a card game about anime-style spellcasters. An LLM
        writes each spell card and a text-to-image model paints it.
      </p>
      <p>
        It runs on vLLM, Ollama and Stable Diffusion with quantized settings, so it fits on GPUs
        with little memory and deploys to Hugging Face Spaces. The game rules are still on the
        drawing board.
      </p>
    </article>
  )
}

export function PapersNote() {
  return (
    <article className="note note-papers" id="note-papers" tabIndex={-1} aria-labelledby="note-papers-title">
      <h2 id="note-papers-title">Papers</h2>
      <h3>Exact First, Then Fast: An Event-for-Event C++ Rebuild of the Agenthon ABIDES Market</h3>
      <p className="note-meta">
        Accepted as a poster at Agenthon 2026: Verifiable AI for Quantitative Finance, a NeurIPS 2026
        workshop in Atlanta, December 12, 2026. Written with co-authors.
      </p>
      <p>
        We rebuilt the Agenthon ABIDES market in C++ to match the original event for event, and only
        then made it fast.
      </p>
    </article>
  )
}

export function WorkNote() {
  return (
    <article className="note note-work" id="note-work" tabIndex={-1} aria-labelledby="note-work-title">
      <h2 id="note-work-title">Where I&apos;ve worked</h2>
      <h3>Mank Teknoloji</h3>
      <p className="note-meta">AI engineering intern, June to August 2025</p>
      <p>
        I built the preprocessing pipeline for 3.7 TB+ of speech audio, running 2 to 4 times faster
        than real time, and fixed broken metadata in 23% of a 500K-sample dataset. I fine-tuned XTTS
        for a single voice, improving both similarity and speed, and set up CosyVoice2 fine-tuning
        for multi-speaker voices.
      </p>
      <h3>Garanti BBVA AI Factory</h3>
      <p className="note-meta">AI research intern, July 2024</p>
      <p>
        I compared BERTurk and mT5 for predicting customer satisfaction from Turkish banking text,
        and tested Vision Transformers on financial documents.
      </p>
    </article>
  )
}

export function BuiltNote() {
  return (
    <article className="note note-built" id="note-built" tabIndex={-1} aria-labelledby="note-built-title">
      <h2 id="note-built-title">Things I&apos;ve built</h2>
      <h3>Gated DeltaNet on the GPU</h3>
      <p>
        Separate CUDA paths for decoding and prefill, 1.07× and 5.33× faster than FlashInfer. It
        placed 4th in the NVIDIA MLSys Competition.
      </p>
      <p className="note-links">
        <a href="https://github.com/littlestronomer/mlsys26-track-c-rf">Code</a>
      </p>
      <h3>Antimicrobial peptide design</h3>
      <p>
        My entry to the AMP Challenge 2027, an international competition on generative AI for new
        antimicrobial peptides. Two small autoregressive models, the main one with 10.7 million
        parameters, generate a library of 50,000 peptides, and a selector ranks the top 100.
      </p>
      <p className="note-links">
        <a href="https://github.com/littlestronomer/amp_challenge_2027">Code</a>
      </p>
      <h3>Live speaker diarization</h3>
      <p>
        Real-time transcription that tells speakers apart, sped up with quantization and PyTorch
        Dynamo.
      </p>
      <h3>Idiom detection</h3>
      <p>Finds idioms in Turkish and Italian sentences with BERT and RoBERTa, at an F1 of 0.92.</p>
      <p className="note-links">
        <a href="https://github.com/littlestronomer/YZV405_2425_150200311_150210307">Code</a>
      </p>
      <h3>Making diffusion models forget</h3>
      <p>Removes chosen people, objects and colors from a diffusion model, following Forget-Me-Not.</p>
      <p className="note-links">
        <a href="https://github.com/littlestronomer/AIzheimer">Code</a>
        <a href="https://www.youtube.com/watch?v=kRVybM5KQ3g">Intro video (a parody)</a>
      </p>
      <h3>Lang Segment Anything</h3>
      <p>
        My <a href="https://github.com/luca-medeiros/lang-segment-anything/pull/105">merged pull request</a>{' '}
        lets this 2.6K-star open-source project run fully offline.
      </p>
    </article>
  )
}

export function AwardsNote() {
  return (
    <article className="note note-awards" id="note-awards" tabIndex={-1} aria-labelledby="note-awards-title">
      <h2 id="note-awards-title">Competitions</h2>
      <h3>4th place</h3>
      <p className="note-meta">NVIDIA MLSys Competition, Gated DeltaNet track, 2026</p>
      <h3>Silver medal</h3>
      <p className="note-meta">Kaggle, Hull Tactical Market Prediction, 97th of 3,677 teams, 2026</p>
      <h3>Bronze medal</h3>
      <p className="note-meta">Kaggle, The Pokémon Company&apos;s PTCG AI Battle Challenge Playground, 2026</p>
      <h3>2nd of 11 teams</h3>
      <p className="note-meta">Doping Technology Edu-Tech AI Hackathon, 2025</p>
      <p>We turned the Turkish school curriculum into short narrated videos.</p>
      <p className="note-links">
        <a href="https://github.com/littlestronomer/RAGENGERS3">Code</a>
        <a href="https://youtu.be/w5ZT8bx56E0">Demo video</a>
      </p>
      <h3>3rd of 13 teams</h3>
      <p className="note-meta">T3 AI Hackathon, 2024</p>
      <p>Training only Llama 3&apos;s last 8 layers beat both LoRA and full fine-tuning.</p>
      <p className="note-kaggle">
        I&apos;m currently ranked 3,647th on Kaggle. <a href={LINKS.kaggle}>See my Kaggle profile</a>
      </p>
    </article>
  )
}

type StudyNoteProps = {
  /** The word "Turkish", for a page that wants to make something of it. */
  turkish?: ReactNode
}

export function StudyNote({ turkish = 'Turkish' }: StudyNoteProps) {
  return (
    <article className="note note-study" id="note-study" tabIndex={-1} aria-labelledby="note-study-title">
      <h2 id="note-study-title">Study and skills</h2>
      <h3>Istanbul Technical University</h3>
      <p className="note-meta">
        B.S. in AI and Data Engineering, 2022 to 2026, with the ITU Development Foundation
        scholarship
      </p>
      <h3>University of Waterloo</h3>
      <p className="note-meta">
        Exchange term in computer science, September 2025 to January 2026: operating systems,
        distributed computing, and concurrency
      </p>
      <dl className="note-toolbox-list">
        <dt>I write</dt>
        <dd>Python, C++, CUDA, Triton, Mojo, SQL</dd>
        <dt>I build with</dt>
        <dd>PyTorch, fine-tuning, RAG, MLOps</dd>
        <dt>I work on</dt>
        <dd>Speech, NLP, computer vision, generative AI</dd>
        <dt>I speed up</dt>
        <dd>Inference, concurrency, RDMA, on Linux</dd>
      </dl>
      <p>I speak {turkish} and English, and I&apos;m learning Japanese and Chinese.</p>
    </article>
  )
}

type ContactNoteProps = {
  /** Whether my latest commits are listed here, or somewhere else on the page. */
  commits?: boolean
}

export function ContactNote({ commits = true }: ContactNoteProps) {
  return (
    <article className="note note-contact" id="note-contact" tabIndex={-1} aria-labelledby="note-contact-title">
      <h2 id="note-contact-title">Write to me</h2>
      <p>
        I&apos;m open to research collaborations, internships and ML systems roles. Email is the
        fastest way to reach me.
      </p>
      <p className="note-links">
        <a href={LINKS.email}>dervisoglu21@itu.edu.tr</a>
        <a href={LINKS.linkedin}>LinkedIn</a>
        <a href={LINKS.github}>GitHub</a>
        <a href={LINKS.kaggle}>Kaggle</a>
        <a href={LINKS.youtube}>YouTube</a>
      </p>
      {commits && <LatestCommits />}
    </article>
  )
}

/** All the notes, in reading order. */
export default function Notes() {
  return (
    <>
      <HelloNote />
      <NowNote />
      <PapersNote />
      <WorkNote />
      <BuiltNote />
      <AwardsNote />
      <StudyNote />
      <ContactNote />
    </>
  )
}
