import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import {
  SHARE_LINK_TTL_SECONDS,
  calculateShareExpiry,
  isPermanentShareToken,
} from "@/lib/share-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { CloudDownload } from "lucide-react";

const STORAGE_BUCKET = "files";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

type ShareRow = {
  id: string;
  file_id: string;
  owner_id: string;
  owner_email?: string | null;
  owner_name?: string | null;
  share_email: string | null;
  created_at: string;
  token: string;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const serviceClient = createSupabaseServiceRoleClient();
  const supabase = serviceClient ?? (await createSupabaseServerClient());

  const shareColumns = "id, file_id, owner_id, owner_email, owner_name, share_email, created_at, token";

  let { data: share, error: shareError } = await supabase
    .from("file_shares")
    .select(shareColumns)
    .eq("token", token)
    .maybeSingle();

  if (shareError && shareError.message?.match(/owner_(email|name)/i)) {
    const fallback = await supabase
      .from("file_shares")
  .select("id, file_id, owner_id, share_email, created_at, token")
      .eq("token", token)
      .maybeSingle();
    share = fallback.data
      ? {
          ...fallback.data,
          owner_email: null,
          owner_name: null,
        }
      : null;
    shareError = fallback.error;
  }

  if (shareError || !share) {
    notFound();
  }

  const resolvedShare = share as ShareRow;

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("id, name, is_public, public_url, path, size, mime_type")
    .eq("id", resolvedShare.file_id)
    .eq("owner_id", resolvedShare.owner_id)
    .maybeSingle();

  if (fileError || !file) {
    notFound();
  }

  const shareNeverExpires = isPermanentShareToken(resolvedShare.token);
  const shareCreatedAt = new Date(resolvedShare.created_at);
  const shareExpiresAt = calculateShareExpiry(shareCreatedAt);
  const now = new Date();
  const hasShareExpired = !shareNeverExpires && shareExpiresAt.getTime() <= now.getTime();
  const shareExpiresDisplay = shareExpiresAt.toLocaleString();

  let downloadUrl = file.public_url;
  let downloadExpiresDisplay: string | null = null;
  if (!file.is_public && !hasShareExpired) {
    const { data: signed, error: signedError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(file.path, SHARE_LINK_TTL_SECONDS);

    if (signedError || !signed?.signedUrl) {
      throw new Error(signedError?.message ?? "Unable to create download link");
    }

    downloadUrl = signed.signedUrl;
    try {
      const expiresParam = new URL(signed.signedUrl).searchParams.get("Expires");
      if (expiresParam) {
        downloadExpiresDisplay = new Date(Number(expiresParam) * 1000).toLocaleString();
      }
    } catch (error) {
      console.error("Failed to parse signed URL expiry", error);
    }
  }

  const ownerDisplayName =
    resolvedShare.owner_name?.trim() || resolvedShare.owner_email || "Tiny Box user";
  const ownerEmail = resolvedShare.owner_email ?? "Email not provided";
  const sizeValue = typeof file.size === "number" ? file.size : Number(file.size ?? 0);
  const fileSizeLabel = Number.isFinite(sizeValue) && sizeValue >= 0 ? formatBytes(sizeValue) : "Unknown size";
  const fileTypeLabel = file.mime_type?.trim() || "Unknown type";

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16">
        <div className="flex items-center justify-between">
          {/* <Button asChild variant="ghost" className="text-[#4c1d95] hover:bg-[#f5f0ff]">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tiny Box
            </Link>
          </Button> */}
          <h1 className="text-3xl font-semibold text-[#4c1d95]">
            <CloudDownload className="inline-block h-6 w-6" /> Tiny FS
          </h1>
          <span className="text-xs text-[#6b21a8]">
            Shared {new Date(resolvedShare.created_at).toLocaleString()}
          </span>
        </div>
        <div className="space-y-6 rounded-2xl border border-[#e2d9ff] bg-white p-10 shadow-sm">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6b21a8]">Shared by</p>
            <div className="rounded-xl border border-[#e2d9ff] bg-[#f5f0ff] p-4">
              <p className="text-lg font-semibold text-[#4c1d95]">{ownerDisplayName}</p>
              <p className="text-sm text-[#6b21a8]">{ownerEmail}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#4c1d95]">{file.name}</h1>
            <p className="text-sm text-[#6b21a8]">
              {file.is_public
                ? "This file is public. Anyone with the link can download it."
                : shareNeverExpires
                  ? "This file is private. This share link stays active until the sender removes it."
                  : "This file is private. This share link grants temporary access."}
            </p>
            {resolvedShare.share_email ? (
              <p className="text-xs text-[#6b21a8]">
                Shared with <span className="font-medium">{resolvedShare.share_email}</span>
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-xl border border-[#e2d9ff] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6b21a8]">File name</p>
              <p className="break-words text-sm text-[#4c1d95]">{file.name}</p>
            </div>
            <div className="rounded-xl border border-[#e2d9ff] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6b21a8]">File type</p>
              <p className="text-sm text-[#4c1d95]">{fileTypeLabel}</p>
            </div>
            <div className="rounded-xl border border-[#e2d9ff] p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6b21a8]">File size</p>
              <p className="text-sm text-[#4c1d95]">{fileSizeLabel}</p>
            </div>
          </div>

          {hasShareExpired ? (
            <div className="rounded-xl border border-[#f5c6cb] bg-[#fff5f5] p-4 text-sm text-[#b91c1c]">
              This share link expired {shareExpiresDisplay}. Ask the sender to create a new link if you still
              need access.
            </div>
          ) : (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button asChild className="w-full md:w-auto">
                <Link href={downloadUrl ?? "#"} target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" /> Download file
                </Link>
              </Button>
              {!file.is_public ? (
                shareNeverExpires ? (
                  <span className="text-xs text-[#166534]">
                    This link stays active. The current download is valid until
                    {downloadExpiresDisplay ? ` ${downloadExpiresDisplay}.` : " it refreshes again."}
                  </span>
                ) : (
                  <span className="text-xs text-[#6b21a8]">
                    Link expires {shareExpiresDisplay}. Request another link if it stops working.
                  </span>
                )
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
