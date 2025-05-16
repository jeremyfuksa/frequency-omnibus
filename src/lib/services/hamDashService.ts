import { DatabaseService } from '../db/database';
import { Frequency } from '../../types/database';

interface RadioDisplayConfig {
  wpsdUrl: string;
  brandmeisterUrl: string;
  checkInterval: number;
  selectedTalkgroups: string[];
  statusIndicators: {
    enabled: boolean;
    color: string;
    threshold: number;
  }[];
}

interface FrequencyActivity {
  frequency: number;
  lastHeard: string;
  priority: number;
  activityLevel: number;
  emergency: boolean;
}

export class HamDashService {
  private db: DatabaseService;
  private config: RadioDisplayConfig;
  private activityFeed: FrequencyActivity[];

  constructor() {
    this.db = DatabaseService.getInstance();
    this.config = {
      wpsdUrl: '',
      brandmeisterUrl: '',
      checkInterval: 5000,
      selectedTalkgroups: [],
      statusIndicators: [
        {
          enabled: true,
          color: '#00ff00',
          threshold: 0.5
        }
      ]
    };
    this.activityFeed = [];
  }

  public async getRadioDisplayConfig(): Promise<RadioDisplayConfig> {
    return this.config;
  }

  public async updateRadioDisplayConfig(config: Partial<RadioDisplayConfig>): Promise<RadioDisplayConfig> {
    this.config = { ...this.config, ...config };
    return this.config;
  }

  public async checkWpsdStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.wpsdUrl}/status`);
      return response.ok;
    } catch (error) {
      console.error('Failed to check WPSD status:', error);
      return false;
    }
  }

  public async getActiveFrequencies(): Promise<Frequency[]> {
    return this.db.query<Frequency>(
      `SELECT * FROM frequencies 
       WHERE active = 1 
       AND (export_sdrtrunk = 1 OR export_sdrplus = 1)
       ORDER BY frequency ASC`
    );
  }

  public async exportHamDashConfig(): Promise<any> {
    const frequencies = await this.getActiveFrequencies();
    const wpsdStatus = await this.checkWpsdStatus();

    return {
      config: this.config,
      frequencies: frequencies.map(freq => ({
        frequency: freq.frequency,
        name: freq.name,
        mode: freq.mode,
        tone: freq.tone_freq,
        priority: freq.service_type === 'Emergency' ? 1 : 0
      })),
      wpsdStatus,
      activityFeed: this.activityFeed
    };
  }

  public async updateActivityFeed(activity: FrequencyActivity): Promise<void> {
    const existingIndex = this.activityFeed.findIndex(
      a => a.frequency === activity.frequency
    );

    if (existingIndex >= 0) {
      this.activityFeed[existingIndex] = activity;
    } else {
      this.activityFeed.push(activity);
    }

    // Keep only the last 100 activities
    if (this.activityFeed.length > 100) {
      this.activityFeed = this.activityFeed.slice(-100);
    }
  }

  public async getActivityFeed(): Promise<FrequencyActivity[]> {
    return this.activityFeed;
  }

  public async clearActivityFeed(): Promise<void> {
    this.activityFeed = [];
  }

  public async getEmergencyFrequencies(): Promise<Frequency[]> {
    return this.db.query<Frequency>(
      `SELECT * FROM frequencies 
       WHERE active = 1 
       AND service_type = 'Emergency'
       ORDER BY frequency ASC`
    );
  }

  public async getPriorityFrequencies(): Promise<Frequency[]> {
    return this.db.query<Frequency>(
      `SELECT * FROM frequencies 
       WHERE active = 1 
       AND service_type IN ('Public Safety', 'Emergency')
       ORDER BY frequency ASC`
    );
  }

  public async getMonitoringFrequencies(): Promise<Frequency[]> {
    return this.db.query<Frequency>(
      `SELECT * FROM frequencies 
       WHERE active = 1 
       AND service_type IN ('Public Safety', 'Emergency', 'Business')
       ORDER BY frequency ASC`
    );
  }

  public async getLastHeardInfo(frequency: number): Promise<FrequencyActivity | null> {
    return this.activityFeed.find(a => a.frequency === frequency) || null;
  }

  public async getActivityLevel(frequency: number): Promise<number> {
    const activity = await this.getLastHeardInfo(frequency);
    return activity ? activity.activityLevel : 0;
  }

  public async isEmergencyActive(frequency: number): Promise<boolean> {
    const activity = await this.getLastHeardInfo(frequency);
    return activity ? activity.emergency : false;
  }
} 
