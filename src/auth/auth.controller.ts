import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthService, ReturnValidateUser } from './auth.service';
import { Public } from 'src/public.decorator';
import { UtilsService } from '../utils/utils.service';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { SignInResponse } from './model/auth.response';
import { UserType } from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiOperation({
    description: '카톡 소셜 로그인 인증 + 유저 가입처리',
  })
  @ApiQuery({
    name: 'type',
    description: '어드민 로그인 인지 앱 로그인 인지',
  })
  @ApiQuery({
    name: 'code',
    description: '클라이언트에서 redirect uri에 포함된 code',
  })
  @ApiCreatedResponse({
    description:
      'isAlready: true => 이미 회원가입단계 끝낸 유저, false => ~ 안끝낸유저',
    type: SignInResponse,
  })
  @Get('/user/login')
  async login(
    @Query('type') type: UserType,
    @Query('code') code: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { isAlready, accessToken, refreshToken, authPayload } =
      await this.authService.oauthValidate(type, code);

    res.cookie('refreshToken', refreshToken, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      domain: 'localhost',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.status(200).json({
      message: 'login successful',
      data: {
        isAlready,
        accessToken,
        ...authPayload,
      },
    });
  }

  @ApiOperation({
    description: 'refresh token 갱신',
  })
  @ApiBody({
    description: '호출시 refresh token body에 포함',
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
        },
      },
    },
    type: String,
  })
  @Public()
  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies['refreshToken'];
    const tokens = await this.authService.refreshToken(refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // @ApiOperation({
  //   description: '로그아웃',
  // })
  // @ApiBody({
  //   description: '로그아웃할 유저의 kakaoMemberId',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       kakaoMemberId: {
  //         type: 'string',
  //       },
  //     },
  //   },
  //   type: String,
  // })
  // @Post('logout')
  // async logout(@Req() request: Request) {
  //   const accessToken = request.cookies['accessToken'];
  //
  //   await this.authService.logout(+accessToken);
  //   return { message: 'Logout successful' };
  // }
}
