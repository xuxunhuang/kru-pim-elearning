const APPS_SCRIPT_UPLOAD_URL =
  "https://script.google.com/macros/s/AKfycbz3sp2kD8AZdVHwMIioI7xcbesogVRxajrF9tQiMnjLsF1hvJhkz8IUITwxFNelxgIv_Q/exec";

type FolderType = "student" | "video" | "pdf";

export async function startDriveUpload(input: {
  folderType: FolderType;
  fileName: string;
  mimeType: string;
  size: number;
}) {
  const secret = process.env.GOOGLE_APPS_SCRIPT_UPLOAD_SECRET;
  if (!secret) throw new Error("ระบบอัปโหลด Google Drive ยังไม่ได้ตั้งค่ารหัสลับ");

  const response = await fetch(APPS_SCRIPT_UPLOAD_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, action: "init", ...input }),
    redirect: "follow",
  });
  const data = (await response.json()) as {
    ok?: boolean;
    uploadUrl?: string;
    error?: string;
  };
  if (!response.ok || !data.ok || !data.uploadUrl) {
    console.error("Apps Script upload init failed", response.status, data);
    throw new Error(
      data.error === "UNAUTHORIZED"
        ? "รหัสลับ Apps Script และ Cloudflare ไม่ตรงกัน"
        : "เริ่มอัปโหลดเข้า Google Drive ไม่สำเร็จ",
    );
  }
  return validateUploadSession(data.uploadUrl);
}

export function validateUploadSession(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "www.googleapis.com" ||
    !url.pathname.startsWith("/upload/drive/v3/files")
  ) {
    throw new Error("Upload session ไม่ถูกต้อง");
  }
  return url.toString();
}

export async function forwardUploadChunk(request: Request) {
  const session = validateUploadSession(
    request.headers.get("x-upload-session") || "",
  );
  const range = request.headers.get("content-range");
  if (!range) throw new Error("ไม่พบช่วงข้อมูลไฟล์");
  const response = await fetch(session, {
    method: "PUT",
    headers: {
      "content-type":
        request.headers.get("content-type") || "application/octet-stream",
      "content-range": range,
    },
    body: request.body,
  });
  if (response.status === 308) return { done: false as const };
  if (!response.ok) {
    const detail = await response.text();
    console.error("Drive resumable upload failed", response.status, detail.slice(0, 500));
    throw new Error("อัปโหลดช่วงไฟล์ไม่สำเร็จ");
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error("Google Drive ไม่ส่งรหัสไฟล์กลับมา");
  return { done: true as const, fileId: data.id };
}
