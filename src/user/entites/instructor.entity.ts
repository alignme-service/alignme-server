// Instructor 엔티티
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Member } from './member.entity';
import { JoinStatus } from '../constant/join-status.enum';

@Entity()
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JoinStatus, default: JoinStatus.PENDING })
  joinStatus: JoinStatus;

  @OneToOne(() => User, (user) => user.instructor)
  @JoinColumn()
  user: User;

  @OneToMany(() => Member, (member) => member.instructor)
  members: Member[];
}
