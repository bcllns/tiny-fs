'use client';

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent } from "react";
import { File, Folder, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadHandler = (formData: FormData) => Promise<void>;

type FileUploaderProps = {
  onUpload: UploadHandler;
};

export const FileUploader = ({ onUpload }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const performUpload = async (file: File, shouldMakePublic: boolean) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("makePublic", shouldMakePublic ? "on" : "off");

    try {
      await onUpload(formData);
      toast.success("File uploaded successfully");
      setMakePublic(false);
      setSelectedFileName(null);
      resetFileInput();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload file. Please try again.";
      toast.error(message);
      setSelectedFileName(null);
      resetFileInput();
    }
  };

  const beginUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size === 0) {
      toast.error("Selected file is empty. Choose a different file.");
      return;
    }
    if (isPending) return;

    const shouldMakePublic = makePublic;
    setSelectedFileName(file.name);
    startTransition(() => {
      void performUpload(file, shouldMakePublic);
    });
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    beginUpload(event.target.files?.[0]);
    // Allow selecting the same file again if needed.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isPending) return;
    const file = event.dataTransfer.files?.[0];
    beginUpload(file);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const dropZoneClasses = cn(
    "flex cursor-pointer flex-col items-center justify-center gap-5 rounded-3xl border-2 border-dashed border-[#d8b4fe] bg-[#faf5ff]/40 px-6 py-12 text-center transition-all",
    isDragging && "border-[#c084fc] bg-[#faf5ff]",
    isPending && "pointer-events-none opacity-70",
    !isDragging && !isPending && "hover:border-[#c084fc]"
  );

  const statusLabel = (() => {
    if (isPending && selectedFileName) {
      return `Uploading ${selectedFileName}...`;
    }
    if (selectedFileName) {
      return `${selectedFileName} selected. Uploading now...`;
    }
    
  })();

  return (
    <section className="space-y-6 rounded-xl border border-[#e2d9ff] bg-white p-6 shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isPending}
      />

      <div
        role="button"
        tabIndex={0}
        className={dropZoneClasses}
        onClick={() => !isPending && fileInputRef.current?.click()}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (!isPending && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={isPending}
      >
        <div className="flex items-center gap-6 text-[#6b21a8]">
          <Folder className="h-10 w-10" />
          <span className="hidden h-10 w-px bg-[#d8b4fe] sm:block" aria-hidden="true" />
          <File className="h-10 w-10" />
        </div>
        <div className="text-sm text-[#6b21a8]">Drag & drop your file here</div>
        <Button
          type="button"
          variant="default"
          onClick={(event) => {
            event.stopPropagation();
            if (!isPending) {
              fileInputRef.current?.click();
            }
          }}
          className="shadow-lg"
          disabled={isPending}
        >
          <UploadCloud className="mr-2 h-4 w-4" /> Upload file
        </Button>
        <div className="text-xs text-[#6b21a8]">{statusLabel}</div>
      </div>

      <p className="text-xs text-[#6b21a8]">
        Maximum file size 500 MB.
      </p>

      {/* <div className="flex items-center justify-between rounded-lg bg-[#f5f0ff] px-4 py-3">
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
          <span className="text-xs text-[#6b21a8]">{makePublic ? "Public" : "Private"}</span>
        </div>
      </div> */}
    </section>
  );
};
