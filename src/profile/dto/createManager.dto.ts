import { UserType } from 'src/user/types/userType';

export interface CreateManagerDto {
  kakaoMemberId: number;
  studioName: string;
  studioRegioinName: string;
  name: string;
  userType: UserType;
}
