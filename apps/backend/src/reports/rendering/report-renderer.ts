import { Logger, OnModuleDestroy } from '@nestjs/common';
import { type Browser, chromium } from 'playwright-core';
import type { Env } from '../../shared/config/env.validation.js';

/** HTML → PDF (ADR-006). Synchronous in the API at the lab's volume (A-52). */
export abstract class ReportRenderer {
  abstract render(html: string): Promise<Buffer>;
}

const RENDER_TIMEOUT_MS = 30_000;

/** Headless Chromium, one shared browser started on first use. */
export class PlaywrightReportRenderer extends ReportRenderer implements OnModuleDestroy {
  private readonly logger = new Logger(PlaywrightReportRenderer.name);
  private browser: Promise<Browser> | null = null;

  constructor(private readonly executablePath?: string) {
    super();
  }

  private getBrowser(): Promise<Browser> {
    this.browser ??= chromium.launch({ executablePath: this.executablePath }).catch((error) => {
      this.browser = null;
      throw error;
    });
    return this.browser;
  }

  async render(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(RENDER_TIMEOUT_MS);
      await page.setContent(html, { waitUntil: 'load' });
      return await page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true });
    } finally {
      await context.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.browser) return;
    try {
      await (await this.browser).close();
    } catch (error) {
      this.logger.warn(`Closing the browser failed: ${String(error)}`);
    }
  }
}

/** Tests and machines without a browser: a valid one-page PDF that carries the HTML size. */
export class StubReportRenderer extends ReportRenderer {
  render(html: string): Promise<Buffer> {
    return Promise.resolve(
      Buffer.from(`%PDF-1.4\n% stub report, ${html.length} characters of HTML\n%%EOF\n`),
    );
  }
}

export function createReportRenderer(
  env: Pick<Env, 'PDF_RENDERER' | 'PDF_CHROMIUM_PATH'>,
): ReportRenderer {
  return env.PDF_RENDERER === 'stub'
    ? new StubReportRenderer()
    : new PlaywrightReportRenderer(env.PDF_CHROMIUM_PATH);
}
