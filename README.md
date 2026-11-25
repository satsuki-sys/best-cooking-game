# The Golden Skillet

[![Make the best cooking game](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Rank](https://make.fun/badge/best-cooking-game-20261125-0137/satsuki-sys/best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![Reward](https://make.fun/badge/best-cooking-game-20261125-0137/satsuki-sys/best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A one-chef cooking game for the [make.fun "Make the best cooking game" bounty](https://make.fun/bounty/best-cooking-game-20261125-0137). Run the kitchen, cook the orders, and serve them before the customers walk out. Two and a half minutes on the clock, a service rush at the end, and stars for a golden day.

## How to play

Open `game/index.html` in a desktop browser (or serve `game/` with any static server). No network, no build step, no downloads — every sound is synthesized in the browser.

- **WASD or arrow keys** — walk the chef. **E or Space, or click a station** — use it. **P** — pause. **M** — mute. **R** — run another day after the day ends.
- **Pantry** — grab raw ingredients (stand by the bin you want). **Chopping board** — chop lettuce, tomato or onion (press E three times). **Grill and fryer** — cook patties and fries; golden is ready, black is burnt, and burnt food only belongs in the trash.
- **Sauce pot** — a ladle of sauce, free. **Plating counter** — build the dish on a plate, then pick the plate up with empty hands. **Serving window** — serve the plate that matches a ticket.
- Serve fast for a tip, chain serves for a combo multiplier, and mind the clock: in the last 30 seconds the rush brings tickets faster.

Five recipes on the order board: Sunrise Stack, Garden Melt, Crispy Basket, Golden Double, Morning Melt.

## Layout

- `game/` — the game itself: `index.html` plus `src/` (one file per job: `config.js` facts, `kitchen.js` the working kitchen, `orders.js` the order board, `render.js` the drawing, `input.js` keyboard and mouse, `audio.js` synthesized sound, `game.js` the day, `main.js` the loop, `shots.js` the screenshot scenes).
- `screenshots/` — four screenshots, real renders of the game's own code (`?shot=cover|play|rush|end`).
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.
- `vendor/makefun-game.ts` — the kit's library, unchanged.

## Referral

Built with [make.fun](https://make.fun/r/27qytqes) — referral code `27qytqes`.

## License

MIT — see [LICENSE](LICENSE).
