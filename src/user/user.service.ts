import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entites/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(userData);

    return this.userRepository.save(newUser);
  }

  async setCurrentRefreshToken(
    refreshToken: string,
    userId: number,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async findById(id: string): Promise<User | undefined> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
    try {
      await this.userRepository.update(userId, { refreshToken });
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw new Error('Failed to update refresh token');
    }
  }

  async removeRefreshToken(userId: number): Promise<void> {
    try {
      await this.userRepository.update(userId, { refreshToken: null });
    } catch (error) {
      console.error('Error removing refresh token:', error);
      throw new Error('Failed to remove refresh token');
    }
  }
}
