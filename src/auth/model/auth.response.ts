import { ApiProperty } from '@nestjs/swagger';

export class SignInResponse {
  @ApiProperty()
  isAlready: boolean;
  @ApiProperty()
  accessToken: string;
  @ApiProperty()
  refreshToken: string;
  @ApiProperty()
  kakaoMemberId: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
}
