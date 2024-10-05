import { User } from 'src/user/entites/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
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

  @OneToOne(() => User, (user) => user.auth, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
}
