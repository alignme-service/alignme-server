import { User } from 'src/user/entites/user.entity';
import { UserType } from 'src/user/types/userType';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  studioName: string;

  @Column({ nullable: true })
  studioRegioinName: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserType,
  })
  userType: UserType;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;
}
