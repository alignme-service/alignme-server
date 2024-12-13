import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entites/content.entity';
import { User } from '../user/entites/user.entity';
import { UtilsService } from '../utils/utils.service';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';
import { Instructor } from '../user/entites/instructor.entity';
import { Member } from '../user/entites/member.entity';
import { Pose } from '../pose/entities/pose.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, User, Instructor, Member, Pose]),
    AwsModule,
    AuthModule,
  ],
  controllers: [ContentController],
  providers: [ContentService, UtilsService],
})
export class ContentModule {}
