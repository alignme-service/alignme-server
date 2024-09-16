import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService, ReturnValidateUser } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/guard/JwtAuthGuard';
import { Public } from 'src/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/user/login/kakao')
  @UseGuards(AuthGuard('kakao'))
  async kakaoAuth(@Req() _req: Request) {}

  @Get('/user/login/kakao/access')
  async kakaoAuth2(@Query('code') code: string, @Res() res: Response) {
    const formUrlEncoded = (x) =>
      Object.keys(x).reduce(
        (p, c) => p + `&${c}=${encodeURIComponent(x[c])}`,
        '',
      );

    const GET_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
    const GET_USER_INFO_URL = 'https://kapi.kakao.com/v2/user/me';
    const GRANT_TYPE = 'authorization_code';
    const CLIENT_ID = this.configService.get('KAKAO_ID');
    // const CLIENT_SECRET = this.configService.get('KAKAO_SECRET');
    const REDIRECT_URI = this.configService.get('KAKAO_REDIRECT_URI');

    const requestBody = formUrlEncoded({
      grant_type: GRANT_TYPE,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code,
      // client_secret: CLIENT_SECRET,
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
        nickname: userInfo.kakao_account.profile.nickname,
        createdAt: new Date(),
        // profile_image: userInfo.kakao_account.profile.profile_image_url,
      };

      // 기존 유저있는지 확인
      const authUser: ReturnValidateUser =
        await this.authService.validateUser(authPayload);

      // JWT 토큰 생성
      const access_token = await this.authService.generateAccessToken(data);
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

  @Public()
  @Post('refresh')
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    try {
      const tokens = await this.authService.refreshToken(refreshToken);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  // @UseGuards(JwtAuthGuard)
  async logout(@Body('kakaoMemberId') kakaoMemberid: string) {
    await this.authService.logout(+kakaoMemberid);
    return { message: 'Logout successful' };
  }

  /* Get kakao Auth Callback */
  // @Get('/kakao/callback')
  // @UseGuards(AuthGuard('kakao'))
  // async kakaoAuthCallback(
  //   @Req() req,
  //   @Res() res: Response, // : Promise<KakaoLoginAuthOutputDto>
  // ) {
  //   const { user } = req;
  //   // console.log(user);

  //   return res.send(user);
  //   // return this.authService.kakaoLogin(req, res);
  // }
}
