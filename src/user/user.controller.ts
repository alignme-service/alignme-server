import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../guard/JwtAuthGuard';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import {
  BaseCreateUserDto,
  MainInstructorCreateDto,
} from './dto/baseCreateUser.dto';
import { GetAccessToken } from '../decorators/get-access-token.decorator';
import { JoinStatus } from './constant/join-status.enum';
import { PendingUserDto } from './dto/user-dto';
import { UserRole } from './types/userRole';
import { RolesGuard } from '../guard/role.guard';
import { GetUserResponse } from './model/user.response';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '멤버 회원가입',
    description: '멤버 회원가입',
  })
  // @ApiBody({ type:  })
  @Post('/signup-member')
  createMember(
    @Body('studioId') studioId: string,
    @Body('instructorId') instructorId: string,
    @GetAccessToken() accessToken: string,
  ) {
    return this.userService.createMember(accessToken, studioId, instructorId);
  }

  @ApiOperation({
    summary: '강사 회원가입',
    description: '강사 회원가입',
  })
  @ApiBody({ type: BaseCreateUserDto })
  @ApiResponse({
    status: 200,
    description: '강사 생성 성공',
    schema: {
      type: 'object',
      properties: {
        instructorId: { type: 'string' },
      },
    },
  })
  @Post('/signup-instructor')
  createInstructor(
    @Body() createInstructor: MainInstructorCreateDto,
    @GetAccessToken() accessToken: string,
  ) {
    return this.userService.createInstructor(accessToken, createInstructor);
  }

  @Get('instructor/members')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '스튜디오 회원 목록 조회' })
  @ApiQuery({ name: 'instructorId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  // 강사 하위 회원 목록
  getUsers(
    @Query('instructorId') instructorId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 5,
    @GetAccessToken() accessToken: string,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.userService.getMembers(
      instructorId,
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 5 : parsedLimit,
      accessToken,
    );
  }

  @Get('instructors')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '스튜디오 내 강사 목록 조회' })
  @ApiResponse({
    status: 200,
    description: '강사 목록을 반환함',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            joinStatus: { type: 'string', enum: Object.values(JoinStatus) },
          },
        },
      },
    },
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getInstructors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetAccessToken() accessToken: string,
    @Query('studioId') studioId?: string,
  ) {
    const parsedPage = parseInt(page as any, 10);
    const parsedLimit = parseInt(limit as any, 10);

    return this.userService.getInstructorsOnStudio(
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedLimit) ? 10 : parsedLimit,
      accessToken,
      studioId,
    );
  }

  @Get('join-requests')
  @UseGuards(RolesGuard)
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
  @ApiOkResponse({
    type: PendingUserDto,
  })
  @Get('join-requests')
  async getJoinRequests(
    @Query('type') type: UserRole,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @GetAccessToken() accessToken: string,
  ) {
    return this.userService.getJoinRequests(type, page, limit, accessToken);
  }

  @Post('approve-join-request')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '가입 요청 승인/거절' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async approveJoinRequest(
    @Body('userId') selectUserId: string,
    @Body('isApprove') isApprove: JoinStatus,
  ) {
    return this.userService.approveJoinRequest(selectUserId, isApprove);
  }

  // 유저 내보내기
  @Delete('leave-user')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '유저 내보내기' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async leaveUser(@Query('userId') userId: string) {
    return this.userService.leaveUser(userId);
  }

  // 소속강사 변경하기
  @Post('change-instructor')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: '소속강사 변경하기' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        instructorId: {
          type: 'string',
        },
        memberId: {
          type: 'string',
        },
      },
    },
  })
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

  // 유저정보 조회
  @Get('user-info')
  @ApiOperation({ summary: '로그인 시 유저 정보 조회' })
  @ApiResponse({ status: 200, description: '성공', type: GetUserResponse })
  @ApiResponse({ status: 404, description: 'ERR_11 유효 하지 않은 유저 정보' })
  async getUserInfo(@GetAccessToken() accessToken: string) {
    return this.userService.getUserInfo(accessToken);
  }

  // 멤버의 스튜디오/강사 조회
  @Get('memberOfStudioInfo')
  @ApiOperation({ summary: '멤버의 스튜디오/강사 조회' })
  async getMemberOfStudioInfo(@GetAccessToken() accessToken: string) {
    return this.userService.getMemberOfStudioInfo(accessToken);
  }

  // 가입 대기중인 유저의 강사와 스튜디오
  @Get('signup-pending-info')
  @ApiOperation({ summary: '가입 대기중인 멤버의 스튜디오/강사 조회' })
  async getSiginupPendingInfo(@GetAccessToken() accessToken: string) {
    return this.userService.getSiginupPendingInfo(accessToken);
  }
}
