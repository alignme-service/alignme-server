import { UserRole } from '../types/userRole';
import { JoinStatus } from '../constant/join-status.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeInstructorDto {
  instructorId: string;
  memberId: string;
}

export class PendingUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({
    type: 'object',
    properties: {
      instructorId: { type: 'string' },
      isJoined: { enum: Object.values(JoinStatus) },
    },
  })
  instructor: {
    instructorId: string;
    isJoined: JoinStatus;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      memberId: { type: 'string' },
      isJoined: { enum: Object.values(JoinStatus) },
    },
  })
  member: {
    memberId: string;
    isJoined: JoinStatus;
  };
}
