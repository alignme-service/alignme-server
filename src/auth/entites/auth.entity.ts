import { User } from 'src/user/entites/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Auth {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  profile_image: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToOne(() => User, (user) => user.auth)
  user: User;
}
