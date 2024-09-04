import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-kakao';

@Injectable()
export class JwtKakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private readonly configService: ConfigService) {
    super({
      clientID: configService.get('KAKAO_ID'),
      clientSecret: configService.get('KAKAO_SECRET'),
      callbackURL: configService.get('KAKAO_REDIRECT_URI'),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ) {
    try {
      console.log(profile);
      const { _json } = profile;
      const user = {
        email: _json.kakao_account.email,
        nickname: _json.properties.nickname,
        photo: _json.properties.profile_image,
      };
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
