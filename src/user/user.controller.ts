import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';
import { Request } from 'express';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  // 강사 하위 회원 목록
  getUsers(@Req() request: Request) {
    const accessToken = request.cookies['accessToken'];

    if (!accessToken) {
      throw new Error('No access token provided');
    }

    return this.userService.getUsersFromInstructor(accessToken);
  }
}
