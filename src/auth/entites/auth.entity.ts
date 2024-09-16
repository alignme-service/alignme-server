import { User } from 'src/user/entites/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Auth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  refreshToken: string;

  // @Column()
  // expiresAt: Date;

  // @UpdateDateColumn()
  // updatedAt: Date;

  @OneToOne(() => User, (user) => user.auth)
  @JoinColumn()
  user: User;
}
