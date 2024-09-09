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
  instructorName: string;

  @Column({ nullable: true })
  studioRegioinName: string;

  @Column({ nullable: true })
  managerName: string;

  @Column({
    type: 'enum',
    enum: UserType,
  })
  userType: UserType;

  @Column({ nullable: true })
  prifleImage: string | null;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User;
}
