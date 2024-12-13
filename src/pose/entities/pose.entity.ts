import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Landmark } from '../dto/pose-dto';
import { Content } from '../../content/entites/content.entity';

@Entity()
export class Pose {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('jsonb')
  poseData: string;

  @OneToOne(() => Content, (content) => content.pose, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  content: Content;
}
