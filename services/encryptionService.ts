// In production (Docker), @aws-sdk/client-kms is installed.
// For local bypass on Windows, we use require conditionally.
let KMSClient: any, EncryptCommand: any, DecryptCommand: any;
try {
  const aws = require('@aws-sdk/client-kms');
  KMSClient = aws.KMSClient;
  EncryptCommand = aws.EncryptCommand;
  DecryptCommand = aws.DecryptCommand;
} catch (e) {
  // Silent fallback
}

export class EncryptionService {
  private kms: any = null;
  private keyId: string;

  constructor() {
    this.keyId = process.env.AWS_KMS_KEY_ID || '';
    if (KMSClient && process.env.AWS_REGION && this.keyId) {
      this.kms = new KMSClient({
        region: process.env.AWS_REGION
      });
    }
  }

  async encrypt(plaintext: string): Promise<string> {
    if (!this.kms || !this.keyId) {
      // Local Bypass Simulation
      return 'aws-kms-encrypted-' + Buffer.from(plaintext, 'utf-8').toString('base64');
    }
    
    try {
        const command = new EncryptCommand({
          KeyId: this.keyId,
          Plaintext: Buffer.from(plaintext, 'utf-8'),
        });
        const response = await this.kms.send(command);
        if (response.CiphertextBlob) {
            return Buffer.from(response.CiphertextBlob).toString('base64');
        }
    } catch(e) {
        console.error("KMS Encrypt Error", e);
    }
    return plaintext;
  }

  async decrypt(ciphertextBase64: string): Promise<string> {
    if (!this.kms || !this.keyId) {
      // Local Bypass Simulation
      if (ciphertextBase64.startsWith('aws-kms-encrypted-')) {
         return Buffer.from(ciphertextBase64.replace('aws-kms-encrypted-', ''), 'base64').toString('utf-8');
      }
      return ciphertextBase64;
    }

    try {
        const command = new DecryptCommand({
          CiphertextBlob: Buffer.from(ciphertextBase64, 'base64'),
        });
        const response = await this.kms.send(command);
        if (response.Plaintext) {
            return Buffer.from(response.Plaintext).toString('utf-8');
        }
    } catch(e) {
        console.error("KMS Decrypt Error", e);
    }
    return ciphertextBase64;
  }
}

export const encryptionService = new EncryptionService();
