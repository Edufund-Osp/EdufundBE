import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './campaign.dto';
import { Types } from 'mongoose';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto) {
    return this.campaignService.createCampaign(createCampaignDto);
  }

  @Get()
  async findAll() {
    return this.campaignService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.campaignService.findById(new Types.ObjectId(id));
  }
}
