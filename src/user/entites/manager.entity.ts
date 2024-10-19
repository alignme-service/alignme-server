import {
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Member } from './member.entity';
import { Content } from '../../content/entites/content.entity';

@Entity()
export class Manager {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.manager, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(() => Member, (member) => member.manager, {
    onDelete: 'CASCADE',
  })
  members: Member[];

  @OneToMany(() => Content, (content) => content.instructor)
  contents: Content[];
}
