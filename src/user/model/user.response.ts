import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../types/userRole';

export class GetUserResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  kakaoMemberId: number;
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: UserRole })
  role: UserRole;
  @ApiProperty()
  isMainInstructor: boolean;
}
