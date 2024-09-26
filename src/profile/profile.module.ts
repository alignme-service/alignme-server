import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entites/user.entity';
import { Profile } from './entities/profile.entity';
import { Studio } from '../studio/entites/studio.entity';
import { Instructor } from '../user/entites/instructor.entity';
import { Manager } from '../user/entites/manager.entity';
import { AwsModule } from '../aws/aws.module';
import { AuthModule } from '../auth/auth.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UtilsService } from '../utils/utils.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Studio, Instructor, Manager]),
    AwsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, UtilsService],
  exports: [ProfileService],
})
export class ProfileModule {}
