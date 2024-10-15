import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Instructor } from './instructor.entity';
import { JoinStatus } from '../constant/join-status.enum';

@Entity()
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JoinStatus, default: JoinStatus.PENDING })
  joinStatus: JoinStatus;

  @OneToOne(() => User, (user) => user.member, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(() => Instructor, (instructor) => instructor.members)
  instructor: Instructor;
}
