import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateManagerDto } from './dto/createManager.dto';
import { BaseCreateUserDto } from './dto/baseCreateUser.dto';
import { CreateMemberDto } from './dto/createMember.dto';
import { GetAccessToken } from '../decorators/get-access-token.decorator';
import { JoinStatus } from './constant/join-status.enum';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '멤버 회원가입',
    description: '멤버 회원가입',
  })
  @ApiBody({ type: CreateMemberDto })
  @UseGuards(JwtAuthGuard)
  @Post('/signup-member')
  createMember(
    @Body() createMemberDto: CreateMemberDto,
    @GetAccessToken() accessToken: string,
  ) {
    // const accessToken = request.cookies['accessToken'];

    // const extractAccessToken = request.headers['authorization'];
    // const accessToken = extractAccessToken.split(' ')[1];

    return this.userService.createMember(accessToken, createMemberDto);
  }

  @ApiOperation({
    summary: '강사 회원가입',
    description: '강사 회원가입',
  })
  @ApiBody({ type: BaseCreateUserDto })
  @UseGuards(JwtAuthGuard)
  @Post('/signup-instructor')
  createInstructor(
    @Body() createInstructor: BaseCreateUserDto,
    @GetAccessToken() accessToken: string,
  ) {
    // const accessToken = request.cookies['accessToken'];
    // const extractAccessToken = request.headers['authorization'];
    // const accessToken = extractAccessToken.split(' ')[1];

    return this.userService.createInstructor(accessToken, createInstructor);
  }

  @ApiOperation({
    summary: '매니저 회원가입',
    description: '매니저 회원가입',
  })
  @ApiBody({ type: CreateManagerDto })
  @UseGuards(JwtAuthGuard)
  @Post('/signup-manager')
  createManager(
    @Body() cereateManager: CreateManagerDto,
    @GetAccessToken() accessToken: string,
  ) {
    // const accessToken = request.cookies['accessToken'];
    // const accessToken = '';
    return this.userService.createManager(accessToken, cereateManager);
  }

  @Get('instructor/:instructorId/members')
  @ApiOperation({ summary: '강사 소속 회원 목록 조회' })
  @ApiResponse({ status: 200, description: '회원 목록 반환함' })
  @ApiResponse({ status: 404, description: '강사를 찾을 수 없음' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @UseGuards(JwtAuthGuard)
  // 강사 하위 회원 목록
  getUsers(
    @Query('instructorId') instructorId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.userService.getMembersFromInstructor(
      instructorId,
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 5 : parsedLimit,
    );
  }

  @Get('instructors')
  @ApiOperation({ summary: '전체 강사 목록 조회' })
  @ApiResponse({ status: 200, description: '강사 목록을 반환함' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getInstructors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.userService.getInstructors(
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 10 : parsedLimit,
    );
  }

  @Get('join-requests')
  @ApiOperation({ summary: '가입 대기 중인 사용자 목록 조회' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'offset',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'max 10',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
  })
  @Get('join-requests')
  async getJoinRequests(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getJoinRequests(page, limit);
  }

  @Post('approve-join-request')
  @ApiOperation({ summary: '가입 요청 승인' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async approveJoinRequest(
    @Query('userId') userId: number,
    @GetAccessToken() accessToken: string,
    @Body('isApprove') isApprove: JoinStatus,
  ) {
    return this.userService.approveJoinRequest(accessToken, isApprove);
  }

  // 유저 내보내기
  @Delete('leave-user')
  @ApiOperation({ summary: '유저 내보내기' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async leaveUser(@GetAccessToken() accessToken: string) {
    return this.userService.leaveUser(accessToken);
  }

  // 소속강사 변경하기
  @Post('change-instructor')
  @ApiOperation({ summary: '소속강사 변경하기' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async changeInstructor(
    @GetAccessToken() accessToken: string,
    @Body('instructorId') instructorId: string,
    @Body('memberId') memberId: string,
  ) {
    return this.userService.changeInstructor(
      accessToken,
      instructorId,
      memberId,
    );
  }
}
