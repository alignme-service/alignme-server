import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
// import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    // exposedHeaders: ['Set-Cookie'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // app.use(cookieParser());

  // JSON 파싱 설정 (기본 크기 제한: 100kb)
  app.use(express.json({ limit: '100kb' }));

  // URL-encoded 파싱 설정
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // 원시 본문 파싱 설정 (필요한 경우)
  app.use(express.raw({ type: 'application/octet-stream', limit: '100kb' }));

  // 텍스트 본문 파싱 설정 (필요한 경우)
  app.use(express.text({ type: 'text/plain', limit: '100kb' }));

  const config = new DocumentBuilder()
    .setTitle('API 문서')
    .setDescription('API 문서입니다.')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(4000);
}
bootstrap();
