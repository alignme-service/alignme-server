import { Module } from '@nestjs/common';
import { StudioService } from './studio.service';
import { StudioController } from './studio.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Studio } from './entites/studio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Studio])],
  controllers: [StudioController],
  providers: [StudioService],
})
export class StudioModule {}
