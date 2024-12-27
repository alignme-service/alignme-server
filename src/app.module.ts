import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { AwsModule } from './aws/aws.module';
import { UtilsModule } from './utils/utils.module';
import { ContentModule } from './content/content.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StudioModule } from './studio/studio.module';
import { PoseModule } from './pose/pose.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `src/configs/.env.${process.env.NODE_ENV}`,
      isGlobal: true, // 환경 변수를 글로벌로 사용
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      // ssl: {
      //   rejectUnauthorized: false,
      // },
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // 파일 저장 위치
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 파일 크기 제한: 5MB
      },
      fileFilter: (req, file, callback) => {
        // 파일 타입 필터링
        if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          callback(null, true);
        } else {
          callback(new Error('지원되지 않는 파일 형식입니다.'), false);
        }
      },
    }),

    AuthModule,
    UserModule,
    StudioModule,
    ProfileModule,
    AwsModule,
    UtilsModule,
    ContentModule,
    PoseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
