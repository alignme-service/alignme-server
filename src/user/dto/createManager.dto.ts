import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { BaseCreateUserDto } from './baseCreateUser.dto';

export class CreateManagerDto extends BaseCreateUserDto {
  @ApiProperty({
    description: '스튜디오 지역 지점 이름',
    example: '수원점',
  })
  @IsString()
  studioRegionName: string;
}
