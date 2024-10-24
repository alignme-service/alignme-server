import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import axios from 'axios';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService, ReturnValidateUser } from './auth.service';
import { JwtAuthGuard } from 'src/guard/JwtAuthGuard';
import { Public } from 'src/public.decorator';
import { UtilsService } from '../utils/utils.service';
import {
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { GetAccessToken } from '../decorators/get-access-token.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {}

  @ApiExcludeEndpoint()
  @Get('/user/login/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth() {}

  @Post('auto-login')
  @ApiOperation({
    description: '자동로그인 처리 토큰 확인',
  })
  @ApiBody({
    description: 'accessToken',
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
  async autoLogin(
    @Body('refreshToken') refreshToken: string,
    @GetAccessToken() accessToken: string,
  ) {
    const { isExpired, user, isMainInstructor } =
      await this.authService.autoLogin(accessToken, refreshToken);
    return { isExpired, user, isMainInstructor };
  }

  @ApiOperation({
    description: '카톡 소셜 로그인 인증 + 유저 가입처리',
  })
  @ApiQuery({
    name: 'code',
    description: '클라이언트에서 redirect uri에 포함된 code',
  })
  @ApiResponse({
    status: 200,
    description: 'isAlerady: false -> 신규유저',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            isAlready: { type: 'boolean' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            kakaoMemberId: { type: 'string' },
            email: { type: 'string' },
            name: { type: 'string' },
          },
        },
      },
    },
  })
  @Get('/user/login')
  async login(@Query('code') code: string, @Res() res: Response) {
    const GET_TOKEN_URL = this.configService.get('GET_TOKEN_URL');
    const GET_USER_INFO_URL = this.configService.get('GET_USER_INFO_URL');
    const GRANT_TYPE = this.configService.get('GRANT_TYPE');
    const CLIENT_ID = this.configService.get('KAKAO_ID');
    const REDIRECT_URI = this.configService.get('KAKAO_REDIRECT_URI');

    const requestBody = this.utilsService.formUrlEncoded({
      grant_type: GRANT_TYPE,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
    });

    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new HttpException(
        'Kakao credentials are not properly configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // 1. 토큰 받기
      const { data } = await axios.post(GET_TOKEN_URL, requestBody);
      // 2. 받은 토큰으로 유저 정보 받기
      const { data: userInfo } = await axios.get(GET_USER_INFO_URL, {
        headers: {
          Authorization: 'Bearer ' + data.access_token,
        },
      });

      const authPayload = {
        kakaoMemberId: userInfo.id,
        email: userInfo.kakao_account.email,
        name: userInfo.kakao_account.name,
        // profile_image: userInfo.kakao_account.profile.profile_image_url,
      };

      // 기존 유저있는지 확인
      const { isAlready, accessToken, refreshToken }: ReturnValidateUser =
        await this.authService.validateUser(authPayload);

      res.setHeader('Authorization', 'Bearer ' + [accessToken, refreshToken]);
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
      });
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
      });

      res.status(200).json({
        message: 'Kakao login successful',
        data: {
          isAlready,
          accessToken,
          refreshToken,
          ...authPayload,
        },
      });
    } catch (error) {
      console.log('error', error);
      // return res.status(404).json({ message: 'Login failed' });
      throw new NotFoundException('Login failed');
    }
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
  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
    @GetAccessToken() accessToken: string,
  ) {
    const tokens = await this.authService.refreshToken(
      refreshToken,
      accessToken,
    );
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
