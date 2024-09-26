import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './entites/user.entity';
import { Instructor } from './entites/instructor.entity';

@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(User)
    // private userRepository: Repository<User>,
    @InjectRepository(Instructor)
    private InstructorRepository: Repository<Instructor>,
  ) {}

  async getUsersFromInstructor(accessToken: string) {
    // const users = await this.InstructorRepository.findOne({
    //   where: { user: { id: instructorId } },
    //   relations: ['members'],
    // });
    // console.log('d', users);
    // return users.members;
    // if (!users) {
    //   throw new NotFoundException('Not Found Users');
    // }
    // return user.instructor.members;
  }
}
