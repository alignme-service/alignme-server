import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsEnum } from 'class-validator';
import { UserRole } from 'src/user/types/userRole';

// export interface CreateManagerDto {
//   kakaoMemberId: number;
//   studioName: string;
//   studioRegionName: string;
//   name: string;
//   userRole: UserRole;
// }

export class CreateManagerDto {
  @ApiProperty({
    description: 'userId',
    example: 12345678,
  })
  @IsNumber()
  kakaoMemberId: number;

  @ApiProperty({
    description: '스튜디오 이름',
    example: '최강스튜디오',
  })
  @IsString()
  studioName: string;

  @ApiProperty({
    description: '스튜디오 지역 지점 이름',
    example: '수원점',
  })
  @IsString()
  studioRegionName: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '유저 역할',
    enum: UserRole,
    example: UserRole.MANAGER,
  })
  @IsEnum(UserRole)
  userRole: UserRole;
}
