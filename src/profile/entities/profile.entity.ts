import { User } from 'src/user/entites/user.entity';
import { UserType } from 'src/user/types/userType';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  studioName: string;

  @Column({ nullable: true })
  studioRegioinName: string;

  @Column({ nullable: true })
  profile_image: string;

  @UpdateDateColumn({ nullable: true })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: UserType,
    nullable: true,
  })
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;
}
