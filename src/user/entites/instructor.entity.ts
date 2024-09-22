// Instructor 엔티티
import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Member } from './member.entity';

@Entity()
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.instructor)
  @JoinColumn()
  user: User;

  @OneToMany(() => Member, (member) => member.instructor)
  members: Member[];
}
