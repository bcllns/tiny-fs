'use client';

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Copy, Loader2, Mail, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateShareExpiry, isPermanentShareToken } from "@/lib/share-links";
import { cn } from "@/lib/utils";

export type ShareRecord = {
  id: string;
  token: string;
  share_email: string | null;
  created_at: string;
};

type ShareDialogProps = {
  fileId: string;
  fileName: string;
  isPublic: boolean;
  publicUrl: string | null;
  shares: ShareRecord[];
  onCreateShare: (input: { fileId: string; shareEmail?: string; neverExpire?: boolean }) => Promise<{ url: string }>;
  onDeleteShare: (shareId: string) => Promise<void>;
  onSendShareEmail: (shareId: string) => Promise<void>;
  onUpdateShare: (input: { shareId: string; neverExpire?: boolean }) => Promise<{ url: string }>;
};

export const ShareDialog = ({
  fileId,
  fileName,
  isPublic,
  publicUrl,
  shares,
  onCreateShare,
  onDeleteShare,
  onSendShareEmail,
  onUpdateShare,
}: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [neverExpire, setNeverExpire] = useState(false);
  const [isCreating, startCreating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const [isSending, startSending] = useTransition();
  const [sendingShareId, setSendingShareId] = useState<string | null>(null);
  const [isRenewing, startRenewing] = useTransition();
  const [renewingShareId, setRenewingShareId] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Link copied to clipboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Copy failed";
      toast.error(message);
    }
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const shareEmail = email.trim();

    startCreating(async () => {
      try {
        const { url } = await onCreateShare({
          fileId,
          shareEmail: shareEmail ? shareEmail : undefined,
          neverExpire,
        });
        setGeneratedUrl(url);
        setEmail("");
        toast.success("Share link created");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create share link. Please try again.";
        toast.error(message);
      }
    });
  };

  const handleDeleteShare = (shareId: string) => {
    setPendingShareId(shareId);
    startDeleting(async () => {
      try {
        await onDeleteShare(shareId);
        toast.success("Share link removed");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to delete share link. Please try again.";
        toast.error(message);
      } finally {
        setPendingShareId(null);
      }
    });
  };

  const handleRenewShare = (share: ShareRecord) => {
    setRenewingShareId(share.id);
    startRenewing(async () => {
      try {
        const { url } = await onUpdateShare({
          shareId: share.id,
          neverExpire: isPermanentShareToken(share.token),
        });
        setGeneratedUrl(url);
        toast.success("Share link updated with new expiration");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update share link. Please try again.";
        toast.error(message);
      } finally {
        setRenewingShareId(null);
      }
    });
  };

  const activeUrl = isPublic ? publicUrl : generatedUrl;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="text-[#4c1d95] hover:bg-[#f5f0ff]">
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#4c1d95]">Share &quot;{fileName}&quot;</DialogTitle>
          <DialogDescription className="text-[#6b21a8]">
            {isPublic
              ? "This file is public. Anyone with the link can access it."
              : "Generate unique share links for specific people when the file is private."}
          </DialogDescription>
        </DialogHeader>

        {isPublic ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#4c1d95]">Public link</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={publicUrl ?? ""} />
                <Button size="icon" variant="ghost" onClick={() => publicUrl && handleCopy(publicUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
                <Button
                  variant="outline"
                  className="w-full border-[#e2d9ff] text-[#4c1d95] hover:bg-[#f5f0ff]"
                  onClick={() => {
                    if (!publicUrl) return;
                    window.open(
                      `mailto:?subject=${encodeURIComponent("Shared file")}&body=${encodeURIComponent(
                        `Access ${fileName}: ${publicUrl}`
                      )}`,
                      "_blank"
                    );
                  }}
                >
              <Mail className="mr-2 h-4 w-4" /> Compose email
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="share-email" className="text-[#4c1d95]">
                  Email address (optional)
                </Label>
                <Input
                  id="share-email"
                  placeholder="recipient@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isCreating}
                />
                <p className="text-xs text-[#6b21a8]">
                  Provide an email to keep track of who received the link. Use the envelope button beside a share to
                  send it directly from Tiny Box.
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-[#e2d9ff] bg-[#f5f0ff]/60 p-3">
                <input
                  id="share-never-expire"
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-[#c4b5fd] text-[#4c1d95] focus-visible:ring-2 focus-visible:ring-[#4c1d95]"
                  checked={neverExpire}
                  onChange={(event) => setNeverExpire(event.target.checked)}
                  disabled={isCreating}
                />
                <div className="space-y-1">
                  <label htmlFor="share-never-expire" className="text-sm font-medium text-[#4c1d95]">
                    Keep this link active until I remove it
                  </label>
                  <p className="text-xs text-[#6b21a8]">
                    We&apos;ll refresh the download link on each visit so recipients can keep accessing the file.
                  </p>
                </div>
              </div>
              <Button className="w-full" disabled={isCreating} type="submit">
                {isCreating ? "Generating link..." : "Create share link"}
              </Button>
            </form>

            {activeUrl ? (
              <div className="space-y-2">
                <Label className="text-[#4c1d95]">Latest link</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={activeUrl} />
                  <Button size="icon" variant="ghost" onClick={() => handleCopy(activeUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#4c1d95]">Existing share links</h3>
              <div className="space-y-2">
                {shares.length === 0 ? (
                  <p className="text-sm text-[#6b21a8]">No share links yet. Create one to get started.</p>
                ) : (
                  shares.map((share) => {
                    const path = `/share/${share.token}`;
                    const shareNeverExpires = isPermanentShareToken(share.token);
                    const createdAt = new Date(share.created_at);
                    const shareExpiresAt = shareNeverExpires ? null : calculateShareExpiry(createdAt);
                    const expired = shareExpiresAt ? shareExpiresAt.getTime() <= Date.now() : false;
                    const expiresLabel = shareNeverExpires
                      ? "Does not expire"
                      : shareExpiresAt
                        ? `${expired ? "Expired" : "Expires"} ${shareExpiresAt.toLocaleString()}`
                        : "Expires soon";
                    const expiresLabelClass = shareNeverExpires
                      ? "text-[#166534]"
                      : expired
                        ? "text-[#b91c1c]"
                        : "text-[#6b21a8]";
                    const urlToCopy = origin ? `${origin}${path}` : path;
                    const isSendingCurrent = isSending && sendingShareId === share.id;
                    const isPendingDelete = pendingShareId === share.id || isDeleting;
                    const isRenewingCurrent = isRenewing && renewingShareId === share.id;

                    return (
                      <div
                        key={share.id}
                        className="flex flex-col gap-2 rounded-lg border border-[#e2d9ff] p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-[#4c1d95]">
                            {share.share_email ?? "Generated link"}
                          </p>
                          <p className="text-xs text-[#6b21a8]">
                            Created {createdAt.toLocaleString()}
                          </p>
                          <p className={cn("text-xs", expiresLabelClass)}>{expiresLabel}</p>
                          {/* <p className="break-all text-xs text-[#6b21a8]">{path}</p> */}
                        </div>
                        <div className="flex items-center gap-1">
                          {expired ? (
                            // For expired links, only show refresh and delete buttons
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRenewShare(share)}
                              disabled={isRenewingCurrent}
                              className="text-[#2563eb] hover:bg-[#eff6ff]"
                              title="Refresh expired link"
                            >
                              {isRenewingCurrent ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            // For non-expired links, show copy, email, and optionally refresh buttons
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleCopy(urlToCopy)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (!share.share_email) {
                                    toast.error("Add an email address to this share before sending it.");
                                    return;
                                  }
                                  setSendingShareId(share.id);
                                  startSending(async () => {
                                    try {
                                      await onSendShareEmail(share.id);
                                      toast.success("Email sent");
                                    } catch (error) {
                                      const message =
                                        error instanceof Error
                                          ? error.message
                                          : "Unable to send the email. Please try again.";
                                      toast.error(message);
                                    } finally {
                                      setSendingShareId(null);
                                    }
                                  });
                                }}
                                disabled={isSendingCurrent}
                              >
                                {isSendingCurrent ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Mail className="h-4 w-4" />
                                )}
                              </Button>
                              {!shareNeverExpires && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleRenewShare(share)}
                                  disabled={isRenewingCurrent}
                                  className="text-[#2563eb] hover:bg-[#eff6ff]"
                                  title="Update expiration date"
                                >
                                  {isRenewingCurrent ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <RefreshCcw className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                              "text-[#b91c1c] hover:bg-[#fee2e2]",
                              pendingShareId === share.id && "opacity-50"
                            )}
                            disabled={isPendingDelete}
                            onClick={() => handleDeleteShare(share.id)}
                          >
                            {isPendingDelete ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
