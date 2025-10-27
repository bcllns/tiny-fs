'use server';

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { Resend } from "resend";

import { buildShareToken } from "@/lib/share-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ShareLinkEmail from "@/emails/share-link-email";

const STORAGE_BUCKET = "files";

export async function uploadFileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to upload files.");
  }

  const file = formData.get("file");
  const makePublic = formData.get("makePublic") === "on";

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Select a file before uploading.");
  }

  const safeName = file.name.replace(/[^a-z0-9\-.]/gi, "_").toLowerCase();
  const objectPath = `${user.id}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  let publicUrl: string | null = null;
  if (makePublic) {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(objectPath, {
        download: false,
      });
    publicUrl = data?.publicUrl ?? null;
  }

  const { error: insertError } = await supabase.from("files").insert({
    owner_id: user.id,
    name: file.name,
    path: objectPath,
    size: file.size,
    is_public: makePublic,
    public_url: publicUrl,
    mime_type: file.type,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/dashboard");
}

export async function toggleFileVisibility(fileId: string, makePublic: boolean) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: fileRow, error: fetchError } = await supabase
    .from("files")
    .select("path")
    .eq("id", fileId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !fileRow) {
    throw new Error(fetchError?.message ?? "File not found");
  }

  let publicUrl: string | null = null;
  if (makePublic) {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileRow.path);
    publicUrl = data?.publicUrl ?? null;
  }

  const { error } = await supabase
    .from("files")
    .update({
      is_public: makePublic,
      public_url: publicUrl,
    })
    .eq("id", fileId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function deleteFile(fileId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: fileRow, error: fetchError } = await supabase
    .from("files")
    .select("path")
    .eq("id", fileId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !fileRow) {
    throw new Error(fetchError?.message ?? "File not found");
  }

  await supabase.from("file_shares").delete().eq("file_id", fileId).eq("owner_id", user.id);

  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([fileRow.path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error } = await supabase.from("files").delete().eq("id", fileId).eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function createShareLink({
  fileId,
  shareEmail,
  neverExpire,
}: {
  fileId: string;
  shareEmail?: string;
  neverExpire?: boolean;
}) {
  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const origin = headerList.get("origin");
  const baseUrl = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const token = buildShareToken(nanoid(24), Boolean(neverExpire));
  const payload = {
    file_id: fileId,
    owner_id: user.id,
    token,
    share_email: shareEmail ?? null,
  };

  const userEmail = typeof user.email === "string" ? user.email : null;
  const rawMetadata = user.user_metadata ?? {};
  const ownerName =
    (typeof rawMetadata.full_name === "string" && rawMetadata.full_name.trim()) ||
    (typeof rawMetadata.name === "string" && rawMetadata.name.trim()) ||
    (typeof rawMetadata.display_name === "string" && rawMetadata.display_name.trim()) ||
    null;

  let insertError = null;
  if (userEmail || ownerName) {
    const { error } = await supabase.from("file_shares").insert({
      ...payload,
      owner_email: userEmail,
      owner_name: ownerName,
    });
    insertError = error;
  } else {
    const { error } = await supabase.from("file_shares").insert(payload);
    insertError = error;
  }

  if (insertError?.message && /owner_(email|name)/i.test(insertError.message)) {
    const { error } = await supabase.from("file_shares").insert(payload);
    insertError = error;
  }

  if (insertError) {
    throw new Error(insertError.message);
  }

  revalidatePath("/dashboard");

  return {
    url: `${baseUrl}/share/${token}`,
  };
}

export async function deleteShareLink(shareId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { error } = await supabase
    .from("file_shares")
    .delete()
    .eq("id", shareId)
    .eq("owner_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function sendShareLinkEmail(shareId: string) {
  const supabase = await createSupabaseServerClient();
  const headerList = await headers();
  const origin = headerList.get("origin");
  const baseUrl = origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: share, error: shareError } = await supabase
    .from("file_shares")
    .select("id, token, file_id, owner_id, owner_email, owner_name, share_email")
    .eq("id", shareId)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (shareError || !share) {
    throw new Error(shareError?.message ?? "Share link not found.");
  }

  if (!share.share_email) {
    throw new Error("Add a recipient email before sending this link.");
  }

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("name")
    .eq("id", share.file_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (fileError || !file) {
    throw new Error(fileError?.message ?? "File not found for this share link.");
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !resendFrom) {
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.");
  }

  const resend = new Resend(resendApiKey);
  const shareUrl = `${baseUrl}/share/${share.token}`;

  const metadata = (user.user_metadata as Record<string, unknown> | null) ?? {};
  const fallbackName =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (typeof metadata.display_name === "string" && metadata.display_name.trim()) ||
    null;

  const ownerEmail = share.owner_email ?? user.email ?? "";
  if (!ownerEmail) {
    throw new Error("Your account needs an email address before you can send messages.");
  }

  const ownerName = share.owner_name?.trim() || fallbackName || ownerEmail;

  const { error: sendError } = await resend.emails.send({
    from: resendFrom,
    to: [share.share_email],
    subject: `${ownerName} shared "${file.name}" with you`,
    react: ShareLinkEmail({
      ownerName,
      ownerEmail,
      fileName: file.name,
      shareUrl,
    }),
  });

  if (sendError) {
    throw new Error(sendError.message);
  }
}
