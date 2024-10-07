import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContentLevelEnum } from '../constant/content.enum';
import { Instructor } from '../../user/entites/instructor.entity';

@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  imageUrl: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: 'enum',
    enum: ContentLevelEnum,
    default: ContentLevelEnum.EASY,
  })
  level: ContentLevelEnum;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Instructor, (instructor) => instructor.contents)
  instructor: Instructor;
}
