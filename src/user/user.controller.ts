import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  // 회원 목록
  getUsers(@Query('instructorId') instructorId: string) {
    return this.userService.getUsersFromInstructor(instructorId);
  }
}
