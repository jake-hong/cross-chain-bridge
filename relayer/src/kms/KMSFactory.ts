import { KMSProvider, KMSConfig } from './types';
import { VaultKMSProvider } from './VaultKMSProvider';
import { LocalKMSProvider } from './LocalKMSProvider';
import { AWSKMSProvider } from './AWSKMSProvider';

export class KMSFactory {
  /**
   * Create a KMS provider based on configuration
   */
  static create(config: KMSConfig): KMSProvider {
    switch (config.provider) {
      case 'vault':
        if (!config.vault) {
          throw new Error('Vault configuration is required for Vault KMS provider');
        }
        return new VaultKMSProvider(config.vault);

      case 'aws':
        if (!config.aws) {
          throw new Error('AWS configuration is required for AWS KMS provider');
        }
        return new AWSKMSProvider(config.aws);

      case 'local':
        console.warn('Using LocalKMSProvider - NOT SECURE FOR PRODUCTION!');
        return new LocalKMSProvider();

      default:
        throw new Error(`Unknown KMS provider: ${config.provider}`);
    }
  }

  /**
   * Create a KMS provider from environment variables
   */
  static fromEnv(): KMSProvider {
    const provider = (process.env.KMS_PROVIDER || 'local') as 'vault' | 'aws' | 'local';

    const config: KMSConfig = {
      provider,
    };

    if (provider === 'vault') {
      config.vault = {
        address: process.env.VAULT_ADDR || 'http://localhost:8200',
        token: process.env.VAULT_TOKEN || '',
        namespace: process.env.VAULT_NAMESPACE,
      };

      if (!config.vault.token) {
        throw new Error('VAULT_TOKEN is required when using Vault KMS provider');
      }
    }

    if (provider === 'aws') {
      config.aws = {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        kmsKeyId: process.env.AWS_KMS_KEY_ID,
      };

      if (!config.aws.region) {
        throw new Error('AWS_REGION is required when using AWS KMS provider');
      }
    }

    return KMSFactory.create(config);
  }
}
