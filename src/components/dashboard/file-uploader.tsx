'use client';

import { useRef, useState, useTransition, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type UploadHandler = (formData: FormData) => Promise<void>;

type FileUploaderProps = {
  onUpload: UploadHandler;
};

export const FileUploader = ({ onUpload }: FileUploaderProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await onUpload(formData);
        toast.success("File uploaded successfully");
        formRef.current?.reset();
        setMakePublic(false);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to upload file. Please try again.";
        toast.error(message);
      }
    });
  };

  return (
    <form
      ref={formRef}
      className="space-y-6 rounded-xl border border-[#e2d9ff] bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="file" className="text-[#4c1d95]">
          Select a file
        </Label>
        <Input id="file" name="file" type="file" required disabled={isPending} />
        <p className="text-xs text-[#6b21a8]">
          Files are stored securely in Supabase Storage. Maximum file size depends on your Supabase project
          limits.
        </p>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-[#f5f0ff] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#4c1d95]">Make file public</p>
          <p className="text-xs text-[#6b21a8]">
            Public files can be accessed by anyone who has the link.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={makePublic}
            onCheckedChange={(state) => setMakePublic(state)}
            disabled={isPending}
          />
          <input hidden name="makePublic" readOnly value={makePublic ? "on" : "off"} />
        </div>
      </div>
      <Button className="w-full" disabled={isPending} type="submit">
        {isPending ? "Uploading..." : "Upload file"}
      </Button>
    </form>
  );
};
