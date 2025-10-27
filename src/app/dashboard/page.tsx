import { redirect } from "next/navigation";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { FileUploader } from "@/components/dashboard/file-uploader";
import { FilesTable, type FileRecord } from "@/components/dashboard/files-table";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  uploadFileAction,
  toggleFileVisibility,
  deleteFile,
  createShareLink,
  deleteShareLink,
  sendShareLinkEmail,
} from "./actions";

type SupabaseFileRow = {
  id: string;
  name: string;
  size: number;
  created_at: string;
  is_public: boolean;
  public_url: string | null;
  mime_type: string | null;
  file_shares: Array<{
    id: string;
    token: string;
    share_email: string | null;
    created_at: string;
  }> | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?redirect=/dashboard");
  }

  const { data: filesData, error } = await supabase
    .from("files")
    .select(
      `id, name, size, created_at, is_public, public_url, mime_type, file_shares ( id, token, share_email, created_at )`
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const files: FileRecord[] = (filesData as SupabaseFileRow[] | null)?.map((file) => ({
    id: file.id,
    name: file.name,
    size: file.size,
    created_at: file.created_at,
    is_public: file.is_public,
    public_url: file.public_url,
    mime_type: file.mime_type,
    share_links: file.file_shares ?? [],
  })) ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-[#4c1d95]">Tiny Box</h1>
            <p className="text-sm text-[#6b21a8]">
              Store, manage, and share files securely with Supabase Storage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="border-[#e2d9ff] text-[#4c1d95] hover:bg-[#f5f0ff]">
              <Link href="/">Home</Link>
            </Button>
            <SignOutButton />
          </div>
        </header>

        <FileUploader onUpload={uploadFileAction} />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#4c1d95]">Your files</h2>
            <p className="text-sm text-[#6b21a8]">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          </div>
          <FilesTable
            files={files}
            onToggleVisibility={toggleFileVisibility}
            onDelete={deleteFile}
            onCreateShare={createShareLink}
            onDeleteShare={deleteShareLink}
            onSendShareEmail={sendShareLinkEmail}
          />
        </section>
      </div>
    </main>
  );
}
