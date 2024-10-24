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
import { ApiProperty } from '@nestjs/swagger';
import { Studio } from '../../studio/entites/studio.entity';

@Entity()
export class Instructor {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ nullable: false, default: false })
  isMainInstructor: boolean;

  @ApiProperty({
    enum: Object.values(JoinStatus),
    default: JoinStatus.PENDING,
  })
  @Column({ type: 'enum', enum: JoinStatus, default: JoinStatus.PENDING })
  joinStatus: JoinStatus;

  @ApiProperty({
    type: User,
  })
  @OneToOne(() => User, (user) => user.instructor, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ApiProperty({
    type: [Member],
  })
  @OneToMany(() => Member, (member) => member.instructor, {
    onDelete: 'CASCADE',
  })
  members: Member[];

  @ApiProperty({
    type: [Content],
  })
  @OneToMany(() => Content, (content) => content.instructor)
  contents: Content[];

  // @OneToOne(() => Studio, (studio) => studio.mainInstructor)
  // studio: Studio;
}
