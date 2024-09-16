import { UserRole } from 'src/user/types/userRole';

export interface CreateManagerDto {
  kakaoMemberId: number;
  studioName: string;
  studioRegionName: string;
  name: string;
  userRole: UserRole;
}
