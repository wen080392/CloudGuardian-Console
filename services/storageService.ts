import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

// Check if AWS is configured
const isAWSConfigured = () => {
  return !!(process.env.AWS_REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
};

const getS3Client = () => {
  if (!isAWSConfigured()) {
    throw new Error('AWS credentials are not configured.');
  }
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
};

// Local storage directory
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'reports');

// Ensure local uploads directory exists
const ensureLocalDir = () => {
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
  }
};

export const uploadPDF = async (key: string, buffer: Buffer): Promise<string> => {
  // Try AWS S3 first
  if (isAWSConfigured()) {
    try {
      const s3 = getS3Client();
      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || 'cloudguardian-reports',
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      });
      await s3.send(command);
      console.log(`[Storage] PDF uploaded to S3: ${key}`);
      return `s3://${key}`;
    } catch (error) {
      console.error('[Storage] S3 upload failed, falling back to local:', error);
    }
  }

  // Fallback: save locally
  ensureLocalDir();
  const sanitizedKey = key.replace(/\//g, '_');
  const localPath = path.join(LOCAL_UPLOADS_DIR, sanitizedKey);
  fs.writeFileSync(localPath, buffer);
  console.log(`[Storage] PDF saved locally: ${localPath}`);
  return `local://${sanitizedKey}`;
};

export const getPDFUrl = async (key: string): Promise<string> => {
  // Handle S3 keys
  if (key.startsWith('s3://')) {
    const s3Key = key.replace('s3://', '');
    try {
      const s3 = getS3Client();
      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || 'cloudguardian-reports',
        Key: s3Key,
      });
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      return url;
    } catch (error) {
      console.error('[Storage] Error getting S3 URL:', error);
      return '#';
    }
  }

  // Handle local keys
  if (key.startsWith('local://')) {
    const filename = key.replace('local://', '');
    return `/api/v1/reports/download/${filename}`;
  }

  // Legacy keys (backward compatibility)
  if (key.startsWith('mock-s3-key/')) {
    return '#';
  }

  return '#';
};
