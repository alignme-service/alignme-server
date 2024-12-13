import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContentLevelEnum } from '../constant/content.enum';
import { Instructor } from '../../user/entites/instructor.entity';
import { Pose } from '../../pose/entities/pose.entity';

@Entity()
export class Content {
  @PrimaryGeneratedColumn()
  id: number;

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

  @OneToOne(() => Pose, (pose) => pose.content, {
    cascade: true,
  })
  @JoinColumn()
  pose: Pose;
}
