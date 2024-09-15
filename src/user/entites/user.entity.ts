import { Auth } from 'src/auth/entites/auth.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserType } from '../types/userType';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint', { nullable: true })
  kakaoMemberId: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  nickname: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  userType: UserType;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;

  @OneToOne(() => Auth, (auth) => auth.user)
  authTokens: Auth;
}
