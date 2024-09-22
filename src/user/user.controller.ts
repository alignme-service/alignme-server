import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  // 회원 목록
  getUsers(@Query('instructorId') instructorId: string) {
    return this.userService.getUsersFromInstructor(instructorId);
  }
}
