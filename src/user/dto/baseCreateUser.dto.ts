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

  @ApiProperty({
    description: '대표강사 가입 여부',
    example: true,
  })
  isMainInstructor: boolean;

  @ApiProperty({
    description: '스튜디오 지역 이름',
    example: true,
  })
  studioRegionName?: string;
}

export class MainInstructorCreateDto extends BaseCreateUserDto {
  @ApiProperty({
    description: '스튜디오 지역 이름',
    example: true,
  })
  studioRegionName?: string;
}
