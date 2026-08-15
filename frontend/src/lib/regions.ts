export interface AWSRegion {
  id: string;
  name: string;
}

export const AWS_REGIONS: AWSRegion[] = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'Europe (Ireland)' },
  { id: 'eu-central-1', name: 'Europe (Frankfurt)' },
  { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
  { id: 'ap-northeast-1', name: 'Asia Pacific (Tokyo)' },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
];
