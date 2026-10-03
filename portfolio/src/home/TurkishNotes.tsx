import type { ReactNode } from 'react'
import TeaGlass from './TeaGlass'

// What the page says in the Turkish theme. No engineering here: food, tea, customs, words and
// memes, and a little about where I am from.

/** A small pixel picture from public/images/turk, drawn by scripts/make_pixel_assets.py. */
function Picture({ of }: { of: string }) {
  return <img className="turk-picture" src={`/images/turk/${of}.png`} width={48} height={48} alt="" loading="lazy" />
}

type PicturedProps = {
  /** Which picture stands beside the words. */
  picture: string
  title: string
  children: ReactNode
}

/** One dish or custom: its picture, its name and a few words about it. */
function Pictured({ picture, title, children }: PicturedProps) {
  return (
    <div className="turk-item">
      <Picture of={picture} />
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  )
}

type TurkHelloProps = {
  /** Puts the site back in its night colors, with the engineering. */
  onLeave: () => void
}

export function TurkHello({ onLeave }: TurkHelloProps) {
  return (
    <article className="note note-hello" id="turk-hello" tabIndex={-1} aria-labelledby="turk-hello-title">
      <h1 id="turk-hello-title">Göktürk Batın Dervişoğlu</h1>
      <p className="note-lead">
        A Turk was mentioned. While this mode is on there is no engineering on this page: only
        food, tea, horses and history. Hoş geldiniz, welcome.
      </p>
      <ul className="note-highlights">
        <li>
          <strong>Battles</strong>: the oldest trick of the steppe, and ten battles replayed step by
          step, from Malazgirt to the Great Offensive
        </li>
        <li>
          <strong>Sofra</strong>: what goes on a Turkish table, from breakfast to baklava
        </li>
        <li>
          <strong>Memes</strong>: what cCc means, and why a man with a hand in his pocket is a hero
        </li>
      </ul>
      <p className="note-links">
        <button type="button" className="word-switch" onClick={onLeave}>
          Back to the engineering
        </button>
      </p>
    </article>
  )
}

export function TurkNotes() {
  return (
    <>
      <article className="note" id="turk-sofra" tabIndex={-1} aria-labelledby="turk-sofra-title">
        <h2 id="turk-sofra-title">Sofra: the table</h2>
        <Pictured picture="simit" title="Kahvaltı">
          Breakfast. The word means &quot;before coffee&quot;, and it is less a meal than an event:
          cheeses, olives, tomatoes, cucumbers, eggs, honey with clotted cream (kaymak), sesame
          rings (simit) and tea without end.
        </Pictured>
        <Pictured picture="kuymak" title="Kuymak">
          From my side of the country, the Black Sea: cornmeal cooked in butter with a stringy
          mountain cheese, eaten hot from the pan with bread. Also called muhlama.
        </Pictured>
        <Pictured picture="hamsi" title="Hamsi">
          The Black Sea anchovy, and in Trabzon close to a religion. Fried in cornmeal, baked into
          rice, even put in bread.
        </Pictured>
        <Pictured picture="kofte" title="Akçaabat köftesi">
          Grilled meatballs from Akçaabat, the town next to Trabzon. The name is protected, like a
          wine region&apos;s.
        </Pictured>
        <Pictured picture="doner" title="Kebap">
          A family, not a dish. Döner turns on its spit; İskender, from Bursa, lays it over bread
          with tomato sauce and browned butter; Adana is minced by hand and hot.
        </Pictured>
        <Pictured picture="manti" title="Mantı">
          Tiny dumplings under garlic yogurt and butter with red pepper. In Kayseri they say forty
          should fit on one spoon.
        </Pictured>
        <Pictured picture="lahmacun" title="Lahmacun and pide">
          Lahmacun is a thin round of dough with spiced minced meat, rolled up with parsley and
          lemon. Pide is its thicker, boat-shaped cousin.
        </Pictured>
        <Pictured picture="baklava" title="Baklava and künefe">
          Baklava is paper-thin layers with pistachio, at its best in Gaziantep. Künefe, from
          Hatay, is shredded pastry over melted cheese, served hot. Both swim in syrup.
        </Pictured>
        <Pictured picture="fasulye" title="Kuru fasulye">
          White beans and rice. Plain, cheap, and loved enough to be called the national dish.
        </Pictured>
      </article>

      <article className="note" id="turk-cay" tabIndex={-1} aria-labelledby="turk-cay-title">
        <h2 id="turk-cay-title">Çay: tea</h2>
        <div className="turk-item">
          <Picture of="caydanlik" />
          <div>
            <p>
              Tea grows on the hills of Rize, an hour east of Trabzon, and is drunk everywhere, all
              day. It is brewed strong in the top of a two-storey pot (çaydanlık), poured into a
              small tulip-shaped glass and thinned with hot water from the pot below. By most
              counts no country drinks more tea per person.
            </p>
            <p>
              The glass has no handle, so you hold it by the rim. A good glass has the color of
              rabbit&apos;s blood (tavşan kanı), and nobody asks whether you want one.
            </p>
          </div>
        </div>
      </article>

      <article className="note has-cat" id="turk-culture" tabIndex={-1} aria-labelledby="turk-culture-title">
        <h2 id="turk-culture-title">How things are done</h2>
        <Pictured picture="guest" title="The guest">
          A guest is &quot;a guest from God&quot; (Tanrı misafiri). You will be fed, and then fed
          again.
        </Pictured>
        <Pictured picture="nazar" title="Nazar boncuğu">
          The blue glass eye on doors, cars and babies&apos; clothes. It stares back at the evil eye.
        </Pictured>
        <Pictured picture="kahve" title="Coffee and fortunes">
          Turkish coffee is boiled in a small pot (cezve) and served with its grounds. When the cup
          is empty it is turned upside down, and a friend reads your fortune in what is left.
        </Pictured>
        <Pictured picture="kolonya" title="Kolonya">
          Lemon cologne, poured into your hands when you arrive, after dinner, and on every long bus
          ride.
        </Pictured>
        <Pictured picture="kemence" title="Horon">
          The dance of the Black Sea: a fast line dance with shaking shoulders, to the kemençe, a
          small three-stringed fiddle.
        </Pictured>
        <Pictured picture="tavla" title="Tavla">
          Backgammon, played fast and loud in tea houses. The dice are still called by their
          Persian names.
        </Pictured>
        <Pictured picture="cat" title="Cats">
          Street cats belong to everyone. Shops put out water and food, and a cat asleep on your
          chair has the right of way.
        </Pictured>
        {/* One of them, asleep on top of this box. */}
        <span className="sleeping-cat" aria-hidden="true" />
      </article>

      <article className="note" id="turk-memes" tabIndex={-1} aria-labelledby="turk-memes-title">
        <h2 id="turk-memes-title">Memes, explained</h2>
        <h3>cCc</h3>
        <p>
          Three crescents, an old Ottoman emblem. Online it goes on both sides of anything Turkish,
          half pride and half joke.
        </p>
        <h3>TURKEY MENTIONED</h3>
        <p>
          The reply posted whenever Turkey turns up anywhere at all: a film, a map, a recipe, a
          footnote. This page did it to itself.
        </p>
        <h3>The man with his hand in his pocket</h3>
        <p>
          At the Paris Olympics in 2024, Yusuf Dikeç won silver in the mixed team air pistol in a
          T-shirt and ordinary glasses, with one hand in his pocket. The whole world copied the
          pose.
        </p>
        <h3>The ice cream man</h3>
        <p>
          Maraş ice cream is thick enough to hang from a pole, and its sellers tease you with the
          cone until you stop reaching for it.
        </p>
        <h3>Turkish Hairlines</h3>
        <p>
          Flights out of Istanbul are full of men with freshly bandaged heads, because the city is
          the world&apos;s capital of hair transplants. The internet renamed the airline.
        </p>
        <h3>Yok artık!</h3>
        <p>
          &quot;No way!&quot; A Turkish basketball commentator once screamed &quot;Yok artık LeBron
          James!&quot; at a last-second shot, and the line outlived the game.
        </p>
      </article>

      <article className="note" id="turk-words" tabIndex={-1} aria-labelledby="turk-words-title">
        <h2 id="turk-words-title">Words worth knowing</h2>
        <dl className="turk-words">
          <dt>Kolay gelsin</dt>
          <dd>&quot;May it come easy.&quot; Said to anyone who is working.</dd>
          <dt>Eline sağlık</dt>
          <dd>&quot;Health to your hands.&quot; Said to whoever cooked.</dd>
          <dt>Afiyet olsun</dt>
          <dd>&quot;May it do you good.&quot; Said before, during and after a meal.</dd>
          <dt>Yarasın</dt>
          <dd>&quot;May it serve you well.&quot; Said to someone who is enjoying a drink.</dd>
          <dt>Çok yaşa</dt>
          <dd>
            &quot;Live long.&quot; For a sneeze. The answer is &quot;Sen de gör&quot;: may you see
            it too.
          </dd>
          <dt>Geçmiş olsun</dt>
          <dd>&quot;May it be past.&quot; For illness or any trouble.</dd>
          <dt>Güle güle</dt>
          <dd>&quot;Go smiling.&quot; Goodbye, said by the one who stays.</dd>
          <dt>Hadi</dt>
          <dd>&quot;Come on.&quot; By its tone it means let&apos;s go, hurry up, no way, or goodbye.</dd>
        </dl>
      </article>
    </>
  )
}

export function TurkSide() {
  return (
    <>
      <TeaGlass />

      <section className="box" id="turk-trabzon" aria-labelledby="turk-trabzon-title">
        <h2 id="turk-trabzon-title">Made in Trabzon</h2>
        <p>
          I&apos;m from Trabzon, a city squeezed between the Black Sea and mountains that climb
          straight into the clouds.
        </p>
        <ul className="turk-list">
          <li>Sumela Monastery hangs on a cliff in the forest, an hour inland.</li>
          <li>Uzungöl is a mountain lake with a village and a mosque on its shore.</li>
          <li>
            Trabzonspor, in claret and blue, was the first club outside Istanbul to win the league,
            in 1976.
          </li>
          <li>The bread comes in loaves the size of a wheel.</li>
          <li>It is the home of the horon, the kemençe and the anchovy.</li>
        </ul>
      </section>
    </>
  )
}
