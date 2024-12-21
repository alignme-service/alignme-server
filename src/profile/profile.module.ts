import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entites/user.entity';
import { Profile } from './entities/profile.entity';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UtilsService } from '../utils/utils.service';
import { Instructor } from '../user/entites/instructor.entity';
import { Member } from '../user/entites/member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Instructor, Member]),
    AwsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, UtilsService],
  exports: [ProfileService],
})
export class ProfileModule {}
