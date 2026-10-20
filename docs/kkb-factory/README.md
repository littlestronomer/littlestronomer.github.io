# KKB project page: factory mockup

Notes on the project page about the KKB Hackathon: Agentic Data Analytics, where Uçan Hamsiler
(Ahmet Selim Özel, Alihan Esen and me) took 1st place. The page is live at `/kkb/` and its source
is in `portfolio/kkb/` (`index.html`, `kkb.css`, `factory.js`). The throwaway mockup this grew
from is in git history (commit a4d175d). The site's build does not use this folder.

## The idea so far

- The project gets a page of its own. It is one long line that you walk along: scrolling slides the
  whole page sideways, notes and factory together. The notes are part of the pipeline: each one
  stands on the factory floor above the machines it is about, and the factory is as big as the
  tallest note leaves room for (3x on a 1000px-tall window, 2x on a phone).
- The order along the line: the intro over the mines, with the engineers and the recipe right beside
  it so they are on the first screen, the brief and the data over a long conveyor, the lakehouse over
  the furnaces, the agent over the tools, the trains over the rails, trust over the check machines
  and their red belts, the result over the silo, and the production statistics past the end.
- "What rides the belt" is a contents title in the bottom corner of the window, always there. It is
  only the title until you click it, and then the list opens upward.
  A pixel masthead and tabs stay on top, and the tabs jump along the line.
- The factory is the project. Ore fields are the EVDS and BDDK data, and furnaces are the
  lakehouse (bronze, silver, gold). One big assembler is build_table. After it, a pair of machines
  for each tool stands along one belt: deflate, index, python (walled in, for the sandbox), plot,
  lead and lag, answer and lab. A rocket silo at the end launches when the page reaches its bottom.
- Inserters really move the items, and each machine turns what it gets into the next item. Two
  trains bring documents straight into the answer machines.
- Feedback that shaped it: it should look like a working factory, with arms operating and items
  changing along the way, and it should be tidy. Every machine stands on the line, on one concrete
  floor, on a grid of 6-pixel tiles.

## Done

- The page is at `/kkb/`. The portfolio links to it from Projects, from Competitions and from the
  highlights at the top, and it is in the sitemap and `llms.txt`.
- Arms take turns at random, so both machines of a pair work. In a fixed order the first arm won
  every belt slot and its neighbour sat dark.
- The check machines reject about one answer in five. A red belt carries it back, over the top or
  under the bottom of the line, to the answer machines, which write it again.
- The lakehouse has a snapshot vault between the gold furnaces and the table: six numbered chests in a
  row, one per version, joined by a line like a commit history. A green `latest` pointer sits over
  one of them and feeds the table. New snapshots arrive on the right, and about every fourth time
  the pointer goes back to an older chest (it turns orange, and the newer chests dim, but none is
  deleted) and then comes forward again. That is the git-like versioning: a name is a pointer.
  Each chest is also a button: clicking (or tabbing to and pressing Enter on) one moves the pointer
  there and holds it for about twelve seconds. It does nothing else; it is only there to play with.
- Each part of the factory has a caption just below it, in the layer that slides with the picture.
- The page is horizontal, with no second layer: an earlier version slid the factory at its own pace
  behind the notes, which kept the factory small. The factory stretches (the gaps between machines,
  and the conveyor from the mines) until every note has room above its machines.

## Performance notes

- The picture is a canvas as wide as the window, drawn from wherever you are on the line (and again
  whenever you scroll), not a canvas as long as the whole line. The long version was redrawn in full
  twelve times a second and made the browser repaint everything on top of it.
- The sideways-wheel listener is passive. A listener that can cancel the wheel makes the browser
  wait for the page before every scroll step.
- Sizes are read once per layout, not every frame, and the tab highlight only changes when it has to.
- Measured in headless Chrome with the GPU switched off (1440x900): 60 fps through a five-second
  scroll with no slow frame, and the main thread busy about 13% of the time (3% when idle).

## Not decided yet

- The final words. The Coderspace post went up on 17 October 2026, the day of the final.
- Whether to link the code. github.com/littlestronomer/ucan_hamsiler_kkb26_hackathon answered 404,
  so it is probably private.
- How big the pixels get on wide screens. The mockup draws each pixel 3 to 6 screen pixels wide,
  by window height, and the factory is about 600 pixels long.
- Whether the note colors stay Factorio grey and orange or keep the main page's indigo.

## Sources

- Hackathon repo: `~/Documents/Projects/ucan_hamsiler_kkb26_hackathon`
- Announcement: https://www.linkedin.com/posts/kkb-hackathon-agentic-data-analytics-tamamland%C4%B1-share-7517233459103404032-Q97m/
