/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    // Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          code: 400,
          status: false,
          data: null,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !["jpg", "jpeg", "png"].includes(fileExtension)) {
      return NextResponse.json(
        {
          code: 400,
          status: false,
          data: null,
          message: "Invalid file type. Only JPG and PNG are allowed",
        },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          code: 400,
          status: false,
          data: null,
          message: "Image size must be less than 5MB",
        },
        { status: 400 }
      );
    }

    const region = process.env.AWS_REGION;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!region || !bucketName) {
      console.error("Missing environment variables", {
        region: !!region,
        bucketName: !!bucketName,
      });
      return NextResponse.json(
        {
          code: 500,
          status: false,
          data: null,
          message: "Server configuration error: Missing AWS_REGION or AWS_S3_BUCKET_NAME",
        },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      endpoint: `https://s3.${region}.amazonaws.com`,
    });

    const fileName = `product-${uuidv4()}.${fileExtension}`;
    const fileBuffer = await file.arrayBuffer();

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: fileName,
        Body: Buffer.from(fileBuffer),
        ContentType: file.type,
        // Removed ACL: "public-read" to avoid error with ACL-disabled buckets
      },
    });

    await upload.done();

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

    return NextResponse.json(
      {
        code: 200,
        status: true,
        data: { publicUrl },
        message: "Image uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Upload error:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
    });
    return NextResponse.json(
      {
        code: 500,
        status: false,
        data: null,
        message: `Failed to upload image: ${error.message}`,
      },
      { status: 500 }
    );
  }
}