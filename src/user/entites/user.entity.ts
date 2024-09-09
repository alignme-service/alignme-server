import { Profile } from 'src/profile/entities/profile.entity';
import { Entity, Column, PrimaryColumn, OneToOne } from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Profile;
}
