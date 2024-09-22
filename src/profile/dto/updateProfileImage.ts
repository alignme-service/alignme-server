import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class updateProfileImageDto {
  @ApiProperty({
    description: '프로필 이미지',
    example: '파일 첨부',
  })
  file: Express.Multer.File;

  @IsString()
  @ApiProperty({
    description: 'userId',
  })
  userId: string;
}
