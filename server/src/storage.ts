import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config";

const s3 =
  config.awsS3Bucket.length > 0
    ? new S3Client({
        region: config.awsRegion,
      })
    : null;

export async function getUploadSignedUrl(key: string, contentType: string) {
  if (!s3 || !config.awsS3Bucket) {
    return {
      enabled: false,
      url: "",
      key,
      expiresInSeconds: 0,
      message: "S3 is not configured.",
    };
  }
  const command = new PutObjectCommand({
    Bucket: config.awsS3Bucket,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 300 });
  return {
    enabled: true,
    url,
    key,
    expiresInSeconds: 300,
  };
}
