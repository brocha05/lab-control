import {
  Body,
  Controller,
  Get,
  INestApplication,
  NotFoundException,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import type { Server } from 'http';
import request from 'supertest';
import { GlobalExceptionFilter } from './global-exception.filter.js';
import { ResponseInterceptor } from './response.interceptor.js';

class CreateThingDto {
  @IsString()
  name!: string;
}

@Controller('things')
class ThingsController {
  @Get('one')
  one() {
    return { id: 'a' };
  }

  @Get('page')
  page() {
    return { data: [{ id: 'a' }], total: 1, page: 1, limit: 20, pages: 1 };
  }

  @Get('missing')
  missing() {
    throw new NotFoundException('Thing not found');
  }

  @Get('boom')
  boom() {
    throw new Error('secret internal detail');
  }

  @Post()
  create(@Body() dto: CreateThingDto) {
    return dto;
  }
}

describe('HTTP envelope (docs/api/conventions.md)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [ThingsController] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    // Same global setup as main.ts. Request IDs come from pino-http there; absent here.
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('wraps success bodies', async () => {
    const res = await request(server).get('/things/one').expect(200);
    expect(res.body).toEqual({ success: true, data: { id: 'a' }, meta: { requestId: '' } });
  });

  it('reshapes paginated results', async () => {
    const res = await request(server).get('/things/page').expect(200);
    expect(res.body.data).toEqual({ items: [{ id: 'a' }], total: 1, page: 1, limit: 20, pages: 1 });
  });

  it('maps HttpExceptions to the error envelope', async () => {
    const res = await request(server).get('/things/missing').expect(404);
    expect(res.body).toEqual({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Thing not found' },
      meta: { requestId: '' },
    });
  });

  it('never leaks unknown error details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = await request(server).get('/things/boom').expect(500);
    expect(res.body.error).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  it('rejects unknown fields and lists validation details', async () => {
    const res = await request(server).post('/things').send({ name: 1, extra: true }).expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.message).toBe('Validation failed');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining(['property extra should not exist', 'name must be a string']),
    );
  });
});
