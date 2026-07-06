import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// We use the AWS SDK because Cloudflare R2 is fully S3-compatible.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: import.meta.env.VITE_R2_ENDPOINT,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = "anurag";

/**
 * Saves JSON data to a specific file (key) in your R2 bucket.
 */
export const saveToCloudflare = async (key: string, data: any) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    });
    
    await r2Client.send(command);
    console.log(`Successfully saved ${key} to Cloudflare R2`);
  } catch (error) {
    console.error(`Error saving ${key} to Cloudflare:`, error);
  }
};

/**
 * Retrieves JSON data from a specific file (key) in your R2 bucket.
 */
export const getFromCloudflare = async (key: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${key}.json`,
    });
    
    const response = await r2Client.send(command);
    if (!response.Body) return null;
    
    const str = await response.Body.transformToString();
    return JSON.parse(str);
  } catch (error: any) {
    // If the file doesn't exist yet (e.g., first time), return null instead of throwing a big error
    if (error.name === 'NoSuchKey') {
      return null;
    }
    console.error(`Error fetching ${key} from Cloudflare:`, error);
    return null;
  }
};
