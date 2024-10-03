import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entites/user.entity';
import { UserController } from './user.controller';
import { Instructor } from './entites/instructor.entity';
import { AuthModule } from '../auth/auth.module';
import { Studio } from '../studio/entites/studio.entity';
import { Manager } from './entites/manager.entity';
import { Profile } from '../profile/entities/profile.entity';
import { Member } from './entites/member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      Studio,
      Instructor,
      Manager,
      Member,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
