import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BaseCreateUserDto {
  @ApiProperty({
    description: '스튜디오 이름',
    example: '최강스튜디오',
  })
  @IsString()
  studioName: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  @IsString()
  name: string;
}
