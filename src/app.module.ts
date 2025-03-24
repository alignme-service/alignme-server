import { Module } from '@nestjs/common';
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
import { DatabaseModule } from './database/database.module';
import Joi from '@hapi/joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        KAKAO_ID: Joi.string().required(),
        KAKAO_SECRET: Joi.string().required(),
        KAKAO_REDIRECT_URI_ADMIN: Joi.string().required(),
        KAKAO_REDIRECT_URI_USER: Joi.string().required(),
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRATION_TIME: Joi.number().required(),
        JWT_REFRESH_EXPIRATION_TIME: Joi.number().required(),
        JWT_SECRET: Joi.string().required(),
        GET_TOKEN_URL: Joi.string().required(),
        GET_USER_INFO_URL: Joi.string().required(),
        GRANT_TYPE: Joi.string().required(),
        AWS_S3_BUCKET_NAME: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        AWS_ACCESS_KEY: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
      }),
      // envFilePath: `./src/configs/--env.${process.env.NODE_ENV}`,
      isGlobal: true,
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
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
