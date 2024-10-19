import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ContentLevelEnum } from '../constant/content.enum';
import { Instructor } from '../../user/entites/instructor.entity';
import { Manager } from '../../user/entites/manager.entity';

@Entity()
@Check(`
  ("instructorId" IS NULL AND "managerId" IS NULL) OR
  ("instructorId" IS NOT NULL AND "managerId" IS NULL) OR
  ("instructorId" IS NULL AND "managerId" IS NOT NULL)
`)
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

  @ManyToOne(() => Manager, (manager) => manager.contents)
  manager: Manager;
}
