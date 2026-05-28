import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { File, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { useApi } from "../lib/api-context";
import { formatBytes } from "../lib/utils";

export function FilesPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const files = useQuery({ queryKey: ["files"], queryFn: api.listFiles });

  const upload = useMutation({
    mutationFn: async (file: globalThis.File) => {
      const target = await api.createUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size
      });

      await fetch(target.uploadUrl, {
        method: target.method,
        headers: target.headers,
        body: file
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    }
  });

  const remove = useMutation({
    mutationFn: api.deleteFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["files"] });
    }
  });

  if (files.isLoading) {
    return <Loading label="Loading files" />;
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) {
      upload.mutate(file);
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Storage</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Files</h1>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong">
          <UploadCloud className="h-4 w-4" />
          {upload.isPending ? "Uploading..." : "Upload"}
          <input className="sr-only" type="file" onChange={selectFile} disabled={upload.isPending} />
        </label>
      </header>

      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <section className="overflow-hidden rounded-lg border border-line bg-paper shadow-panel">
        {files.data?.length ? (
          <div className="divide-y divide-line">
            {files.data.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-soft text-brand">
                    <File className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.filename}</p>
                    <p className="text-sm text-muted">
                      {item.contentType} · {formatBytes(item.sizeBytes)}
                    </p>
                  </div>
                </div>
                <Button
                  aria-label={`Delete ${item.filename}`}
                  disabled={remove.isPending}
                  variant="ghost"
                  onClick={() => remove.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-60 place-items-center p-8 text-center">
            <div>
              <UploadCloud className="mx-auto h-10 w-10 text-brand" />
              <p className="mt-3 font-semibold">No files yet</p>
              <p className="mt-1 text-sm text-muted">Upload a file to test S3 presigned URLs.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
