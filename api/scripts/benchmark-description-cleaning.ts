import { createHash } from 'node:crypto';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { cleanDescription } from '../src/services/job.processor';

const messyHtml = `
  <div class="description" style="color:#333">
    <style>.hidden{display:none}</style>
    <script>window.__DATA__ = {"id": 123, "tracking": "abc"};</script>
    <p><b>Senior Backend Engineer</b> &amp; Platform Team &nbsp;|&nbsp; Remote</p>
    <div><div><div><span>Responsibilities</span></div></div></div>
    <ul>
      <li>Design &amp; build REST APIs in TypeScript</li>
      <li>Own PostgreSQL schema changes &amp; query tuning</li>
      <li>Mentor engineers&nbsp;&nbsp;and review pull requests</li>
    </ul>
    <a href="https://example.com/apply?utm_source=x&amp;utm_medium=y">Apply now</a>
    <p>Equal opportunity employer. Cookie settings. Share this job on Facebook, X, LinkedIn.</p>
  </div>
`;

const samples = [
  `
    <main>
      <h2>About the role</h2>
      <p>We are looking for a backend engineer to build TypeScript APIs,
      improve PostgreSQL queries, write automated tests, and collaborate with
      product managers.</p>
      <h3>Requirements</h3>
      <ul><li>Node.js</li><li>PostgreSQL</li><li>Docker</li></ul>
    </main>
  `,
  `
    Close Home General Jobs Companies Post a job Sign in Log in Menu.
    Similar jobs Related jobs Recommended jobs.
    We are hiring a software engineer to design services, review code, and
    improve system reliability for a distributed remote team.
  `,
  `
    Join or sign in to find your next job. Email or phone. Forgot password?
    New to LinkedIn? Join now. By clicking continue to join or sign in, you
    agree to the User Agreement, Privacy Policy, and Cookie Policy.
  `,
  `
    About this role\u00a0\u00a0
    You will build APIs, maintain data pipelines, investigate failures, and
    document engineering decisions.\u200b

    What you will bring
    TypeScript, Node.js, SQL, testing, and clear written communication.
  `,
  messyHtml,
  Array.from({ length: 40 }, () => messyHtml).join('\n'), // large input
];

const iterationsPerRound = 6_000; // multiple of samples.length so the mix is even
const measuredRounds = 8;

function runRound(iterations: number): { elapsedMs: number; checksum: number } {
  let checksum = 0;
  const start = performance.now();

  for (let index = 0; index < iterations; index += 1) {
    checksum += cleanDescription(samples[index % samples.length]).length;
  }

  return { elapsedMs: performance.now() - start, checksum };
}

// Warm up the JIT before collecting timings.
runRound(1_200);

const rounds = Array.from({ length: measuredRounds }, () =>
  runRound(iterationsPerRound)
);

if (new Set(rounds.map((round) => round.checksum)).size !== 1) {
  throw new Error('cleanDescription is non-deterministic: checksums differ between rounds');
}

// Hash of the actual cleaned output (computed once, outside the timed loop).
const outputHash = createHash('sha256')
  .update(samples.map((sample) => cleanDescription(sample)).join('\u0000'))
  .digest('hex')
  .slice(0, 16);

const sortedMs = rounds.map((round) => round.elapsedMs).sort((a, b) => a - b);
const medianMs =
  (sortedMs[measuredRounds / 2 - 1] + sortedMs[measuredRounds / 2]) / 2;
const minMs = sortedMs[0];
const maxMs = sortedMs[sortedMs.length - 1];
const operationsPerSecond = Math.round(iterationsPerRound / (medianMs / 1_000));

console.log(
  JSON.stringify(
    {
      benchmark: 'cleanDescription',
      measuredAt: new Date().toISOString(),
      runtime: process.version,
      platform: `${process.platform}/${process.arch}`,
      cpu: os.cpus()[0]?.model ?? 'unknown',
      samples: samples.length,
      iterationsPerRound,
      measuredRounds,
      medianRoundMs: Number(medianMs.toFixed(2)),
      minRoundMs: Number(minMs.toFixed(2)),
      maxRoundMs: Number(maxMs.toFixed(2)),
      spreadPct: Number((((maxMs - minMs) / medianMs) * 100).toFixed(1)),
      operationsPerSecond,
      checksum: rounds[0].checksum,
      outputHash,
      scope:
        'CPU-only description cleanup; excludes network, browser, database, and cache latency',
    },
    null,
    2
  )
);