import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { User } from 'src/user/entites/user.entity';
import { Studio } from '../studio/entites/studio.entity';
import { AwsModule } from '../aws/aws.module';
import { UtilsService } from '../utils/utils.service';
import { Instructor } from '../user/entites/instructor.entity';
import { Manager } from '../user/entites/manager.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Studio, Instructor, Manager]),
    AwsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, UtilsService],
  exports: [ProfileService],
})
export class ProfileModule {}
