import { ApiProperty } from '@nestjs/swagger';

export class AuthAutoLoginDto {
  @ApiProperty({
    description: 'refreshToken',
    type: String,
  })
  refreshToken: string;
}
