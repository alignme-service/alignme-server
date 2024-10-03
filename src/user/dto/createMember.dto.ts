import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { BaseCreateUserDto } from './baseCreateUser.dto';

export class CreateMemberDto extends BaseCreateUserDto {
  @ApiProperty({
    description: '스튜디오 강사 선택',
    example: '강사의 UUID',
  })
  @IsString()
  instructorId: string;
}
