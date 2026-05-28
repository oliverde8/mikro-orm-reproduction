# MikroORM snapshot inconsistency repro

`migration:create` writes `.snapshot-<db>.json` from entity metadata.
`migration:up` rewrites it from MySQL `information_schema`. The two forms
differ (FK rules, `comment`, text/timestamp `length`, decimal default
trailing zeros, `extra` casing), so `migration:create` keeps emitting a no-op
migration forever even when nothing changed.

Tested on **7.0.17** with #7235 and #7608 already in. Same behaviour on 7.1.1.

## Run

```bash
npm install
./repro.sh
```

Spins up `mysql:8` on port 3399. `docker compose down -v` to stop.

The script saves snapshot copies after each step to `src/migrations/snapshot-N-after-*.json`. Odd numbers are entity-form, even are DB-form — open any pair in VSCode and "Compare Selected" to see the flip.
