import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Campaign, CampaignDocument } from './campaign.schema';
import { CreateCampaignDto } from './campaign.dto';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    private readonly walletService: WalletService,
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignDto): Promise<Campaign> {
    const campaign = new this.campaignModel(createCampaignDto);
    await campaign.save();

    // Automatically create a wallet when a campaign is created
    await this.walletService.createWallet({
        campaignId: campaign._id,
        balance: 0,
        frozen: false
    });

    return campaign;
  }

  async findAll(): Promise<Campaign[]> {
    return this.campaignModel.find().populate('organizerId').exec();
  }

  async findById(id: Types.ObjectId): Promise<Campaign> {
    const campaign = await this.campaignModel.findById(id).populate('organizerId').exec();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }
}
