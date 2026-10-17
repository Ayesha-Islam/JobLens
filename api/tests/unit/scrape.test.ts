import { describe, it, expect, vi, beforeEach } from 'vitest';

const scrapeMocks = vi.hoisted(() => ({
  createLog: vi.fn(),
  processJobs: vi.fn(),
}));

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn(),
  },
}));

vi.mock('../../src/lib/prisma', () => ({
  db: { scrapeLog: { create: scrapeMocks.createLog } },
}));

vi.mock('../../src/container', () => ({
  default: {},
}));

vi.mock('../../src/services/job.processor', () => ({
  JobProcessor: vi.fn(function MockJobProcessor() {
    return { process: scrapeMocks.processJobs };
  }),
}));

import {
  cleanHtml,
  cleanDescription,
  standardizePostedDate,
  isUSOrRemoteJob,
  extractTechStack,
  extractBulletSection,
  toDbJob,
  ScraperManager,
  type Job,
} from '../../src/scrape';

function createScraperResult() {
  return {
    source: 'Test Source',
    jobs: [],
    scrapedAt: new Date().toISOString(),
    durationMs: 125,
    errors: [],
    filtered: 0,
  };
}

function createProcessedResult() {
  return {
    found: 0,
    enriched: 0,
    enrichmentFailed: 0,
    avgDescriptionChars: 0,
    added: 0,
    duplicates: 0,
    skipped: 0,
    filtered: 0,
    descriptionUpdated: 0,
    skipReasons: {},
    extractionMethods: {},
    warnings: [],
    dbErrors: 0,
    quality: {
      badDescriptions: 0,
      missingCompany: 0,
      missingLocation: 0,
      enrichmentFailures: 0,
      warningRate: 0,
      rejectionRate: 0,
      duplicateRate: 0,
    },
  };
}

function createManager(scrape: ReturnType<typeof vi.fn>) {
  const scraper = { scrape };
  return new (class extends ScraperManager {
    protected getScrapeJobs() {
      return [{
        source: 'Test Source',
        scraper: scraper as never,
        query: 'developer',
      }];
    }
  })(null, null, {} as never);
}

describe('scrape pure helpers', () => {
  it('removes raw HTML safely', () => {
    const result = cleanHtml('<h2>Role</h2><p>Hello <strong>React</strong></p><script>x</script>');

    expect(result).toContain('## Role');
    expect(result).toContain('Hello React');
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<script>');
  });

  it('cleans RemoteHub navigation noise', () => {
    const result = cleanDescription([
      'Home',
      'General',
      'Jobs',
      'About the role',
      'You will build backend services for a remote engineering team.',
      'Similar jobs',
      'Post a job',
    ].join('\n'));

    expect(result).toContain('About the role');
    expect(result).not.toContain('Similar jobs');
  });

  it('converts "2 weeks ago" into valid ISO date', () => {
    const fallback = new Date('2026-06-22T00:00:00.000Z');

    const result = standardizePostedDate('2 weeks ago', fallback);

    expect(result).toBe('2026-06-08T00:00:00.000Z');
  });

  it('filters non-US locations', () => {
    expect(isUSOrRemoteJob('Remote - United States')).toBe(true);
    expect(isUSOrRemoteJob('New York, NY')).toBe(true);
    expect(isUSOrRemoteJob('Remote - Europe')).toBe(false);
    expect(isUSOrRemoteJob('Pakistan')).toBe(false);
  });

  it('extracts tech stack keywords', () => {
    const result = extractTechStack('We use React, TypeScript, Node.js, PostgreSQL, Redis, Docker and AWS.');

    expect(result).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'])
    );
  });

  it('extracts bullet sections', () => {
    const result = extractBulletSection(
      [
        'Requirements:',
        '- 3+ years building production backend services',
        '- Strong TypeScript and PostgreSQL experience',
        '',
        'Benefits:',
        '- Remote work',
      ].join('\n'),
      ['Requirements']
    );

    expect(result).toEqual([
      '3+ years building production backend services',
      'Strong TypeScript and PostgreSQL experience',
    ]);
  });

  it('converts scraper job into Prisma JobCreateInput', () => {
    const job: Job = {
      id: '1',
      title: 'Senior Backend Engineer',
      company: 'Acme Inc',
      location: 'Remote - United States',
      isRemote: true,
      salary: '$120k - $150k',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
      categories: [],
      description: 'You will build APIs and backend services for our engineering team.',
      requirements: [],
      responsibilities: [],
      techStack: ['TypeScript'],
      benefits: [],
      url: 'https://example.com/jobs/1',
      source: 'RemoteOK',
      postedAt: '2026-06-20T00:00:00.000Z',
      scrapedAt: '2026-06-22T00:00:00.000Z',
      isActive: true,
    };

    const result = toDbJob(job);

    expect(result).toMatchObject({
      position: 'Senior Backend Engineer',
      company: 'Acme Inc',
      location: 'Remote - United States',
      salary: '$120k - $150k',
      type: 'FULL_TIME',
      url: 'https://example.com/jobs/1',
      source: 'RemoteOK',
      companyKey: 'acme inc',
      positionKey: 'senior backend engineer',
      locationKey: 'remote',
    });

    expect(result.postedAt).toBeInstanceOf(Date);
  });
});

describe('ScraperManager scrape logging', () => {
  beforeEach(() => {
    scrapeMocks.createLog.mockReset().mockResolvedValue({});
    scrapeMocks.processJobs.mockReset().mockResolvedValue(createProcessedResult());
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('persists logs for full runs and single-source runs', async () => {
    const scrape = vi.fn().mockResolvedValue(createScraperResult());
    const manager = createManager(scrape);

    await manager.runAll();
    await manager.runOne('Test Source');

    expect(scrapeMocks.createLog).toHaveBeenCalledTimes(2);
    expect(scrapeMocks.createLog).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        source: 'Test Source',
        status: 'SUCCESS',
        jobsFound: 0,
        jobsAdded: 0,
        durationMs: 125,
      }),
    });
  });

  it('persists failed scraper runs', async () => {
    const scrape = vi.fn().mockRejectedValue(new Error('provider unavailable'));
    const manager = createManager(scrape);

    const [result] = await manager.runAll();

    expect(result.status).toBe('FAILED');
    expect(scrapeMocks.createLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: 'Test Source',
        status: 'FAILED',
        errorMessage: 'provider unavailable',
      }),
    });
  });

  it('surfaces log-write failures as degraded run warnings', async () => {
    scrapeMocks.createLog.mockRejectedValueOnce(new Error('database unavailable'));
    const manager = createManager(vi.fn().mockResolvedValue(createScraperResult()));

    const [result] = await manager.runAll();

    expect(result.health).toBe('DEGRADED');
    expect(result.warnings).toContain('scrape_log_write_failed: database unavailable');
  });
});