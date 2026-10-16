import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import type { Env } from '../../shared/config/env.validation.js';

/**
 * Private storage for report PDFs (ADR-005). Keys are `<tenantId>/<reportId>.pdf`; files
 * are only served through the API, after the tenant check.
 */
export abstract class ReportStorage {
  abstract put(key: string, body: Buffer): Promise<void>;
  abstract get(key: string): Promise<Buffer>;
}

/** A folder on disk: development and tests. */
export class LocalReportStorage extends ReportStorage {
  private readonly root: string;

  constructor(dir: string) {
    super();
    this.root = resolve(dir);
  }

  private path(key: string): string {
    const full = resolve(join(this.root, key));
    if (!full.startsWith(this.root + sep)) throw new Error(`Invalid storage key ${key}`);
    return full;
  }

  async put(key: string, body: Buffer): Promise<void> {
    const full = this.path(key);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, body);
  }

  get(key: string): Promise<Buffer> {
    return readFile(this.path(key));
  }
}

/** S3, or the docker-compose MinIO (path-style addressing). */
export class S3ReportStorage extends ReportStorage {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    options: { endpoint?: string; region: string; accessKeyId: string; secretAccessKey: string },
  ) {
    super();
    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: !!options.endpoint,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    });
  }

  async put(key: string, body: Buffer): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: 'application/pdf',
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    if (!res.Body) throw new Error(`Empty object ${key}`);
    return Buffer.from(await res.Body.transformToByteArray());
  }
}

export function createReportStorage(
  env: Pick<
    Env,
    | 'REPORT_STORAGE_DRIVER'
    | 'REPORT_STORAGE_DIR'
    | 'S3_ENDPOINT'
    | 'S3_REGION'
    | 'S3_BUCKET'
    | 'S3_ACCESS_KEY_ID'
    | 'S3_SECRET_ACCESS_KEY'
  >,
): ReportStorage {
  if (env.REPORT_STORAGE_DRIVER === 's3') {
    return new S3ReportStorage(env.S3_BUCKET as string, {
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      accessKeyId: env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY as string,
    });
  }
  return new LocalReportStorage(env.REPORT_STORAGE_DIR);
}
