import { Injectable, Logger } from '@nestjs/common';
import * as maxmind from 'maxmind';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { GeoIPResponse } from './geoip.interface';
import { GEOIP_API_KEY, GEOIP_DATABASE_PATH } from './constants/geoip.constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeoIPService {
  private readonly logger = new Logger(GeoIPService.name);
  private lookup: maxmind.Reader<maxmind.CityResponse> | null = null;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.loadDatabase();
  }

  private async loadDatabase() {
    try {
      this.logger.log(`Loading MaxMind database from: ${GEOIP_DATABASE_PATH}`);
      this.lookup = await maxmind.open<maxmind.CityResponse>(GEOIP_DATABASE_PATH);
      this.logger.log('MaxMind GeoLite2 database loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load MaxMind GeoLite2 database:', error);
    }
  }

  async getLocationFromApi(ip: string): Promise<GeoIPResponse | null> {
    try {
      const api_key = this.configService.get<string>('GEOIP_API_KEY');
      const response = await axios.get(`https://ipinfo.io/${ip}?token=${api_key}`);
      const { city, region, country } = response.data;

      // Country must always be valid
      if (!country) {
        this.logger.warn(`Invalid country in database response for IP: ${ip}`);
        return null;
      }

      // At least two fields must be valid
      const validFields = [city, region, country].filter(Boolean).length;
      if (validFields < 2) {
        this.logger.warn(`Incomplete location data from database for IP: ${ip}`);
        return null;
      }

      // return { city, region, country };

      // Return only valid fields
      const validLocation: GeoIPResponse = { country };
      if (city) {
        validLocation.city = city;
      } else if(region) {
        validLocation.region = region;
      }

      this.logger.log(`Location from API: ${JSON.stringify(validLocation)}`);
      return validLocation;
    } catch (error) {
      // this.logger.error('Failed to fetch location from API:', error);
      return null;
    }
  }

  async getLocationFromDatabase(ip: string): Promise<GeoIPResponse | null> {
    if (!this.lookup) {
      this.logger.error('MaxMind GeoLite2 database not loaded');
      return null;
    }

    this.logger.log(`Fetching location from MaxMind database for IP: ${ip}`);
    const result = this.lookup.get(ip);
    if (!result) {
      this.logger.warn(`No location data found for IP: ${ip}`);
      return null;
    }

    const city = result.city?.names?.en;
    const region = result.subdivisions?.[0]?.names?.en;
    const country = result.country?.names?.en;

    // Country must always be valid
    if (!country) {
      this.logger.warn(`Invalid country in database response for IP: ${ip}`);
      return null;
    }

    // At least two fields must be valid
    const validFields = [city, region, country].filter(Boolean).length;
    if (validFields < 2) {
      this.logger.warn(`Incomplete location data from database for IP: ${ip}`);
      return null;
    }

    // Return only valid fields
    const validLocation: GeoIPResponse = { country };
    if (city) {
      validLocation.city = city;
    }else if (region) {
      validLocation.region = region;
    }

    this.logger.log(`From Database: Location found: ${JSON.stringify(validLocation)}`);
    return validLocation;
  }

  async getLocation(ips: string): Promise<string> {
    const ip = '8.8.8.8'
    // Try fetching location from API first
    const apiLocation = await this.getLocationFromApi(ip);
    if (apiLocation) {
      return `${apiLocation.city || apiLocation.region}, ${apiLocation.country}`;
    }

    // Fallback to MaxMind database
    const dbLocation = await this.getLocationFromDatabase(ip);
    if (dbLocation) {
      return `${dbLocation.city || dbLocation.region}, ${dbLocation.country}`;
    }

    // If both fail, throw an error
    throw new Error('Unable to determine location');
  }
}