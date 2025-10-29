'use client';

import { useState, useTransition } from "react";
import { Download, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatBytes } from "@/lib/format";

import { ShareDialog, type ShareRecord } from "./share-dialog";

export type FileRecord = {
  id: string;
  name: string;
  size: number;
  created_at: string;
  is_public: boolean;
  public_url: string | null;
  mime_type: string | null;
  share_links: ShareRecord[];
};

type FilesTableProps = {
  files: FileRecord[];
  onToggleVisibility: (fileId: string, makePublic: boolean) => Promise<void>;
  onDelete: (fileId: string) => Promise<void>;
  onCreateShare: (args: { fileId: string; shareEmail?: string; neverExpire?: boolean }) => Promise<{ url: string }>;
  onDeleteShare: (shareId: string) => Promise<void>;
  onSendShareEmail: (shareId: string) => Promise<void>;
  onUpdateShare: (args: { shareId: string; neverExpire?: boolean }) => Promise<{ url: string }>;
};

export const FilesTable = ({
  files,
  onToggleVisibility,
  onDelete,
  onCreateShare,
  onDeleteShare,
  onSendShareEmail,
  onUpdateShare,
}: FilesTableProps) => {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleVisibilityChange = (fileId: string, checked: boolean) => {
    startTransition(async () => {
      try {
        await onToggleVisibility(fileId, checked);
        toast.success(`File is now ${checked ? "public" : "private"}.`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update file visibility.";
        toast.error(message);
      }
    });
  };

  const handleDelete = (fileId: string) => {
    setDeletingId(fileId);
    startDeleteTransition(async () => {
      try {
        await onDelete(fileId);
        toast.success("File deleted");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to delete file.";
        toast.error(message);
      } finally {
        setDeletingId(null);
      }
    });
  };

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#c4b5fd] bg-[#faf5ff] p-10 text-center">
        <h3 className="text-lg font-semibold text-[#4c1d95]">No files yet</h3>
        <p className="mt-2 text-sm text-[#6b21a8]">Upload your first file to share it with your team.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e2d9ff] bg-white shadow-sm">
      <table className="w-full min-w-full divide-y divide-[#f2ecff]">
        <thead className="bg-[#f5f0ff]">
          <tr className="text-left text-sm text-[#4c1d95]">
            <th className="px-6 py-3 font-medium">File</th>
            <th className="px-6 py-3 font-medium">Size</th>
            <th className="px-6 py-3 font-medium">Visibility</th>
            <th className="px-6 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f2ecff]">
          {files.map((file) => (
            <tr key={file.id} className="text-sm text-[#4c1d95]">
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{file.name}</span>
                  <span className="text-xs text-[#6b21a8]">
                    Uploaded {new Date(file.created_at).toLocaleString()}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-[#6b21a8]">{formatBytes(file.size)}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={file.is_public}
                    onCheckedChange={(checked) => handleVisibilityChange(file.id, checked)}
                    disabled={isPending}
                  />
                  <span className="text-xs text-[#6b21a8]">
                    {file.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  {file.is_public && file.public_url ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={file.public_url} target="_blank" rel="noreferrer">
                        <Download className="mr-2 h-4 w-4" /> Open
                      </Link>
                    </Button>
                  ) : null}
                  <ShareDialog
                    fileId={file.id}
                    fileName={file.name}
                    isPublic={file.is_public}
                    publicUrl={file.public_url}
                    shares={file.share_links}
                    onCreateShare={onCreateShare}
                    onDeleteShare={onDeleteShare}
                    onSendShareEmail={onSendShareEmail}
                    onUpdateShare={onUpdateShare}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-[#b91c1c] hover:bg-[#fee2e2]"
                    onClick={() => handleDelete(file.id)}
                    disabled={isDeleting && deletingId === file.id}
                  >
                    {isDeleting && deletingId === file.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
