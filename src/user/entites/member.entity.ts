import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Instructor } from './instructor.entity';

@Entity()
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.member)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Instructor, (instructor) => instructor.members)
  instructor: Instructor;
}
