import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './entites/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
}
