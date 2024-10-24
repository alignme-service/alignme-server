import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entites/user.entity';
import { UserController } from './user.controller';
import { Instructor } from './entites/instructor.entity';
import { AuthModule } from '../auth/auth.module';
import { Studio } from '../studio/entites/studio.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Member } from './entites/member.entity';
import { RolesGuard } from '../guard/role.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Studio, Instructor, Member]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  exports: [UserService],
})
export class UserModule {}
