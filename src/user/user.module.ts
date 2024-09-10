import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entites/user.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import { Auth } from 'src/auth/entites/auth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Auth])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
