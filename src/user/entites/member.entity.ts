import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Instructor } from './instructor.entity';
import { JoinStatus } from '../constant/join-status.enum';
import { Manager } from './manager.entity';

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

  // @OneToMany(() => Member, (member) => member.manager, {
  //   onDelete: 'CASCADE',
  // })
  // members: Member[];

  @ManyToOne(() => Manager, (manager) => manager.members)
  manager: Manager;
}
