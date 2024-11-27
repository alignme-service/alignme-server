import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Studio } from './entites/studio.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class StudioService {
  constructor(
    @InjectRepository(Studio)
    private studioRepository: Repository<Studio>,
  ) {}
  async searchStudios(query: string) {
    return await this.studioRepository
      .createQueryBuilder('studio')
      .where('studio.studioName like :query', { query: `%${query}%` })
      .getMany();
  }
}
