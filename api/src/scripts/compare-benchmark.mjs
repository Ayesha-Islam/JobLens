import { readFileSync } from "node:fs";

const [baselinePath, currentPath, thresholdArg] = process.argv.slice(2);
const maxDropPct = Number(thresholdArg ?? 15);

const base = JSON.parse(readFileSync(baselinePath, "utf8"));
const cur = JSON.parse(readFileSync(currentPath, "utf8"));

let failed = false;

// 1. Correctness: did the cleaned output change?
if (base.outputHash !== cur.outputHash || base.checksum !== cur.checksum) {
  console.error(`FAIL: output changed (hash ${base.outputHash} -> ${cur.outputHash}).`);
  failed = true;
}

// 2. Speed: compare the fastest round, which is least affected by noise.
const baseOps = base.iterationsPerRound / (base.minRoundMs / 1000);
const curOps = cur.iterationsPerRound / (cur.minRoundMs / 1000);
const changePct = ((curOps - baseOps) / baseOps) * 100;
console.log(`best-round ops/sec: ${Math.round(baseOps)} -> ${Math.round(curOps)} (${changePct.toFixed(1)}%)`);

if (changePct < -maxDropPct) {
  console.error(`FAIL: slowed down by more than ${maxDropPct}%.`);
  failed = true;
}

// 3. Environment sanity checks.
if (base.cpu !== cur.cpu || base.runtime !== cur.runtime) {
  console.warn("WARN: CPU or Node version differs from the baseline, so the speed comparison may be meaningless.");
}
if (base.samples !== cur.samples || base.iterationsPerRound !== cur.iterationsPerRound) {
  console.warn("WARN: benchmark settings differ from the baseline. Re-save the baseline.");
}
if (Math.max(base.spreadPct, cur.spreadPct) > 40) {
  console.warn("WARN: round-to-round spread is over 40%, so this run is very noisy. Re-run before trusting it.");
}

console.log(failed ? "RESULT: FAIL" : "RESULT: PASS");
process.exit(failed ? 1 : 0);
