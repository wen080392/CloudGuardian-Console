import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

const DEV_PREFIX = 'dev-unencrypted-';

/**
 * Envelope encryption for customer cloud credentials via AWS KMS.
 *
 * Fail-closed policy: if KMS is unavailable or errors out, we THROW.
 * Secrets must never be silently persisted as plaintext. The base64
 * fallback exists only for local development and is refused in production.
 */
export class EncryptionService {
  private kms: KMSClient | null = null;
  private keyId: string;

  constructor() {
    this.keyId = process.env.AWS_KMS_KEY_ID || '';
    if (process.env.AWS_REGION && this.keyId) {
      this.kms = new KMSClient({ region: process.env.AWS_REGION });
    }
  }

  isConfigured(): boolean {
    return this.kms !== null;
  }

  async encrypt(plaintext: string): Promise<string> {
    if (!this.kms || !this.keyId) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'KMS não configurado (AWS_REGION/AWS_KMS_KEY_ID). Recusando armazenar segredo sem criptografia em produção.'
        );
      }
      // Local development only — clearly labeled as NOT encrypted
      return DEV_PREFIX + Buffer.from(plaintext, 'utf-8').toString('base64');
    }

    const command = new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: Buffer.from(plaintext, 'utf-8'),
    });
    const response = await this.kms.send(command);
    if (!response.CiphertextBlob) {
      throw new Error('KMS Encrypt não retornou CiphertextBlob');
    }
    return Buffer.from(response.CiphertextBlob).toString('base64');
  }

  async decrypt(ciphertextBase64: string): Promise<string> {
    // 'aws-kms-encrypted-' is the legacy dev-fallback prefix — despite the
    // name those values were only base64-encoded, never sent to KMS
    const devPrefix = [DEV_PREFIX, 'aws-kms-encrypted-'].find(p => ciphertextBase64.startsWith(p));
    if (devPrefix) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Segredo armazenado sem criptografia detectado em produção. Rotacione esta credencial.');
      }
      return Buffer.from(ciphertextBase64.slice(devPrefix.length), 'base64').toString('utf-8');
    }

    if (!this.kms || !this.keyId) {
      throw new Error('KMS não configurado — impossível descriptografar credencial.');
    }

    const command = new DecryptCommand({
      CiphertextBlob: Buffer.from(ciphertextBase64, 'base64'),
    });
    const response = await this.kms.send(command);
    if (!response.Plaintext) {
      throw new Error('KMS Decrypt não retornou Plaintext');
    }
    return Buffer.from(response.Plaintext).toString('utf-8');
  }
}

export const encryptionService = new EncryptionService();
