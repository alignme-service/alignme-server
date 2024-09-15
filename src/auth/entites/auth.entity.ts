import { User } from 'src/user/entites/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Auth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('bigint')
  kakaoMemberId: number;

  @Column({ nullable: true })
  refreshToken: string;

  // @Column({ type: 'timestamp' })
  // expiresAt: Date;

  // @CreateDateColumn()
  // createdAt: Date;

  // @Column({ nullable: true })
  // lastUsedAt: Date;

  // @Column({ default: false })
  // isRevoked: boolean;

  @OneToOne(() => User, (user) => user.authTokens)
  @JoinColumn()
  user: User;
}
