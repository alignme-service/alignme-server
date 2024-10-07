import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entites/content.entity';
import { User } from '../user/entites/user.entity';
import { UtilsService } from '../utils/utils.service';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Content, User]), AwsModule, AuthModule],
  controllers: [ContentController],
  providers: [ContentService, UtilsService],
})
export class ContentModule {}
