import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "Only image and video uploads are allowed." },
        { status: 400 }
      );
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 400 }
      );
    }

    if (isVideo && file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Video must be 30MB or smaller." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = path.extname(file.name) || (isImage ? ".jpg" : ".mp4");
    const safeName = `${crypto.randomUUID()}${extension}`;

    const folder = isImage ? "review-images" : "review-videos";
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, safeName);

    await writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${folder}/${safeName}`,
    });
  } catch (error) {
    console.error("UPLOAD_ERROR", error);

    return NextResponse.json(
      { error: "Unable to upload file." },
      { status: 500 }
    );
  }
}