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
import { Content } from '../../content/entites/content.entity';

@Entity()
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: JoinStatus, default: JoinStatus.PENDING })
  joinStatus: JoinStatus;

  @OneToOne(() => User, (user) => user.instructor, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => Member, (member) => member.instructor, {
    onDelete: 'CASCADE',
  })
  members: Member[];

  @OneToMany(() => Content, (content) => content.instructor)
  contents: Content[];
}
