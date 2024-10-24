import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entites/user.entity';
import { Instructor } from '../../user/entites/instructor.entity';

@Entity()
export class Studio {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  studioName: string;

  @Column({ nullable: true })
  studioRegionName: string;

  @OneToMany(() => User, (user) => user.studio, { onDelete: 'CASCADE' })
  users: User[];

  // @OneToOne(() => Instructor, (instructor) => instructor.studio)
  // @JoinColumn()
  // mainInstructor: Instructor;
}
