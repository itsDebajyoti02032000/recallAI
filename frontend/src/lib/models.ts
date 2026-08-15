export interface BedrockModel {
  id: string;
  name: string;
  provider: string;
}

export const BEDROCK_MODELS: BedrockModel[] = [
  { id: 'anthropic.claude-sonnet-4-20250514-v1:0', name: 'Claude Sonnet 4', provider: 'Anthropic' },
  { id: 'anthropic.claude-haiku-4-20250514-v1:0', name: 'Claude Haiku 4', provider: 'Anthropic' },
  { id: 'anthropic.claude-3-5-sonnet-20241022-v2:0', name: 'Claude 3.5 Sonnet v2', provider: 'Anthropic' },
  { id: 'anthropic.claude-3-5-haiku-20241022-v1:0', name: 'Claude 3.5 Haiku', provider: 'Anthropic' },
  { id: 'amazon.nova-pro-v1:0', name: 'Amazon Nova Pro', provider: 'Amazon' },
  { id: 'amazon.nova-lite-v1:0', name: 'Amazon Nova Lite', provider: 'Amazon' },
  { id: 'amazon.nova-micro-v1:0', name: 'Amazon Nova Micro', provider: 'Amazon' },
  { id: 'meta.llama3-3-70b-instruct-v1:0', name: 'Llama 3.3 70B', provider: 'Meta' },
  { id: 'mistral.mistral-large-2411-v1:0', name: 'Mistral Large', provider: 'Mistral' },
];
