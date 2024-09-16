import { Auth } from 'src/auth/entites/auth.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../types/userRole';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint', { unique: true })
  kakaoMemberId: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true })
  studioName: string;

  @Column({ nullable: true })
  studioRegionName: string;

  @CreateDateColumn({ nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: Object.values(UserRole),
    default: UserRole.MEMEBER,
  })
  role: UserRole;

  @OneToOne(() => Auth, (auth) => auth.user)
  auth: Auth;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
