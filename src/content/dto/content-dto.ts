import { ContentLevelEnum } from '../constant/content.enum';

export class CreateContentDto {
  title: string;
  level: ContentLevelEnum;
  instructorId: string;
  description: string;
}

export class ResponseSignupDto {
  message: string;
  data: {
    isAleradyUser: boolean;
    accessToken: string;
    refreshToken: string;
    kakaoMemberId: string;
    email: string;
    name: string;
  };
}
