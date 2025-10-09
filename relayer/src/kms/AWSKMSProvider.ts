import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  ListSecretsCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { KMSProvider } from './types';

export interface AWSKMSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  kmsKeyId?: string; // KMS key for encryption
}

export class AWSKMSProvider implements KMSProvider {
  private kmsClient: KMSClient;
  private secretsClient: SecretsManagerClient;
  private kmsKeyId?: string;
  private secretPrefix: string;

  constructor(config: AWSKMSConfig) {
    const clientConfig = {
      region: config.region,
      ...(config.accessKeyId &&
        config.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }),
    };

    this.kmsClient = new KMSClient(clientConfig);
    this.secretsClient = new SecretsManagerClient(clientConfig);
    this.kmsKeyId = config.kmsKeyId;
    this.secretPrefix = 'relayer/keys/';
  }

  /**
   * Get a private key from AWS Secrets Manager
   */
  async getKey(keyId: string): Promise<string> {
    try {
      const secretName = `${this.secretPrefix}${keyId}`;

      const command = new GetSecretValueCommand({
        SecretId: secretName,
      });

      const response = await this.secretsClient.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} has no string value`);
      }

      const secret = JSON.parse(response.SecretString);

      if (!secret.privateKey) {
        throw new Error(`Secret ${secretName} does not contain privateKey field`);
      }

      console.log(`Retrieved key from AWS Secrets Manager: ${keyId}`);
      return secret.privateKey;
    } catch (error: any) {
      console.error(`Error retrieving key from AWS Secrets Manager: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Store a private key in AWS Secrets Manager
   */
  async storeKey(keyId: string, privateKey: string): Promise<void> {
    try {
      const secretName = `${this.secretPrefix}${keyId}`;
      const secretValue = JSON.stringify({
        privateKey,
        createdAt: new Date().toISOString(),
      });

      // Try to update if exists, otherwise create
      try {
        const updateCommand = new UpdateSecretCommand({
          SecretId: secretName,
          SecretString: secretValue,
        });

        await this.secretsClient.send(updateCommand);
        console.log(`Updated key in AWS Secrets Manager: ${keyId}`);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          // Secret doesn't exist, create it
          const createCommand = new CreateSecretCommand({
            Name: secretName,
            SecretString: secretValue,
            Description: `Relayer private key for ${keyId}`,
            ...(this.kmsKeyId && { KmsKeyId: this.kmsKeyId }),
          });

          await this.secretsClient.send(createCommand);
          console.log(`Created key in AWS Secrets Manager: ${keyId}`);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error(`Error storing key in AWS Secrets Manager: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Delete a key from AWS Secrets Manager
   */
  async deleteKey(keyId: string): Promise<void> {
    try {
      const secretName = `${this.secretPrefix}${keyId}`;

      const command = new DeleteSecretCommand({
        SecretId: secretName,
        ForceDeleteWithoutRecovery: true,
      });

      await this.secretsClient.send(command);
      console.log(`Deleted key from AWS Secrets Manager: ${keyId}`);
    } catch (error: any) {
      console.error(`Error deleting key from AWS Secrets Manager: ${keyId}`, error.message);
      throw error;
    }
  }

  /**
   * Check if a key exists in AWS Secrets Manager
   */
  async keyExists(keyId: string): Promise<boolean> {
    try {
      const secretName = `${this.secretPrefix}${keyId}`;

      const command = new DescribeSecretCommand({
        SecretId: secretName,
      });

      await this.secretsClient.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  }

  /**
   * List all key IDs in AWS Secrets Manager
   */
  async listKeys(): Promise<string[]> {
    try {
      const command = new ListSecretsCommand({
        Filters: [
          {
            Key: 'name',
            Values: [this.secretPrefix],
          },
        ],
      });

      const response = await this.secretsClient.send(command);

      if (!response.SecretList) {
        return [];
      }

      return response.SecretList.filter((secret) => secret.Name)
        .map((secret) => secret.Name!.replace(this.secretPrefix, ''))
        .sort();
    } catch (error: any) {
      console.error('Error listing keys from AWS Secrets Manager:', error.message);
      throw error;
    }
  }
}
