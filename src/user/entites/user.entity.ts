import { Auth } from 'src/auth/entites/auth.entity';
import { Profile } from 'src/profile/entities/profile.entity';
import {
  Entity,
  Column,
  CreateDateColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../types/userRole';
import { Studio } from '../../studio/entites/studio.entity';
import { Member } from './member.entity';
import { Instructor } from './instructor.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint', { unique: true })
  kakaoMemberId: number;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn({ nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: Object.values(UserRole),
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @OneToOne(() => Auth, (auth) => auth.user, { cascade: true })
  auth: Auth;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @ManyToOne(() => Studio, (studio) => studio.users, { cascade: true })
  @JoinColumn()
  studio: Studio;

  @OneToOne(() => Instructor, (instructor) => instructor.user, {
    cascade: true,
  })
  instructor: Instructor;

  @OneToOne(() => Member, (member) => member.user, { cascade: true })
  member: Member;
}
