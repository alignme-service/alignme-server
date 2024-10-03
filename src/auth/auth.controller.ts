import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, ReturnValidateUser } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/guard/JwtAuthGuard';
import { Public } from 'src/public.decorator';
import { UtilsService } from '../utils/utils.service';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetAccessToken } from '../decorators/get-access-token.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly utilsService: UtilsService,
  ) {}

  @Get('/user/login/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth(@Req() _req: Request) {}

  @ApiOperation({
    description: '카톡 소셜 로그인 인증 + 유저 가입처리',
  })
  @ApiQuery({
    name: 'code',
    description: '클라이언트에서 redirect uri에 포함된 code',
  })
  @ApiResponse({ status: 200, description: 'isAleradyUser: false -> 신규유저' })
  @Get('/user/login/kakao/access')
  async kakaoAuth2(@Query('code') code: string, @Res() res: Response) {
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
      const authUser: ReturnValidateUser =
        await this.authService.validateUser(authPayload);

      // JWT 토큰 생성
      const access_token = await this.authService.generateAccessToken(
        userInfo.id,
        userInfo.kakao_account.email,
        userInfo.kakao_account.name,
      );
      const refresh_token = await this.authService.generateRefreshToken(data);

      // 유저 객체에 refresh-token 데이터 저장
      await this.authService.setCurrentRefreshToken(userInfo.id, refresh_token);

      res.setHeader('Authorization', 'Bearer ' + [access_token, refresh_token]);
      res.cookie('access_token', access_token, {
        httpOnly: true,
      });
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
      });

      res.status(200).json({
        message: 'Kakao login successful',
        data: {
          isAleradyUser: authUser.isAleradyUser,
          accessToken: access_token,
          refreshToken: refresh_token,
          kakaoMemberId: userInfo.id,
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
    try {
      const tokens = await this.authService.refreshToken(
        refreshToken,
        accessToken,
      );
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @ApiOperation({
    description: '로그아웃',
  })
  @ApiBody({
    description: '로그아웃할 유저의 kakaoMemberId',
    schema: {
      type: 'object',
      properties: {
        kakaoMemberId: {
          type: 'string',
        },
      },
    },
    type: String,
  })
  @Post('logout')
  async logout(@Req() request: Request) {
    const accessToken = request.cookies['accessToken'];

    await this.authService.logout(+accessToken);
    return { message: 'Logout successful' };
  }
}
