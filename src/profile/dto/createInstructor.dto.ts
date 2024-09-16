import { UserRole } from '../../user/types/userRole';

export interface CreateInstructorDto {
  kakaoMemberId: number;
  studioName: string;
  name: string;
  userRole: UserRole;
}
