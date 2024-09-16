import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entites/user.entity';

@Entity()
export class Studio {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  studioName: string;

  @Column({ nullable: true })
  studioRegionName: string;

  @OneToMany(() => User, (user) => user.studio)
  users: User[];
}
