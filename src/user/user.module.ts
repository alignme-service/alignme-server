import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entites/user.entity';
import { UserController } from './user.controller';
import { Instructor } from './entites/instructor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Instructor])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
