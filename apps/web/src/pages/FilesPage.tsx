import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, File, HardDrive, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../components/Button";
import { Loading } from "../components/Loading";
import { useApi } from "../lib/api-context";
import { formatBytes, formatDate } from "../lib/utils";

export function FilesPage() {
  const api = useApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const files = useQuery({ queryKey: ["files"], queryFn: api.listFiles });
  const storageBytes = files.data?.reduce((total, file) => total + file.sizeBytes, 0) ?? 0;

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

  const download = useMutation({
    mutationFn: api.getFileDownload,
    onSuccess: (target) => {
      setError(null);
      window.location.assign(target.downloadUrl);
    },
    onError: (caught) => {
      setError(caught instanceof Error ? caught.message : "Download failed.");
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
      <header className="rounded-lg border border-line bg-paper p-5 shadow-panel">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-brand">Storage</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Files</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Private objects are tracked in Postgres and served through signed URLs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["files"] })}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-strong">
              <UploadCloud className="h-4 w-4" />
              {upload.isPending ? "Uploading..." : "Upload"}
              <input className="sr-only" type="file" onChange={selectFile} disabled={upload.isPending} />
            </label>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <FileMetric label="Objects" value={String(files.data?.length ?? 0)} />
          <FileMetric label="Storage" value={formatBytes(storageBytes)} />
          <FileMetric label="Upload limit" value="25 MB" />
        </div>
      </header>

      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <section className="overflow-hidden rounded-lg border border-line bg-paper shadow-panel">
        {files.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-field text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">File</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {files.data.map((item) => (
                  <tr key={item.id} className="transition hover:bg-field/60">
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-soft text-brand">
                          <File className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{item.filename}</p>
                          <p className="truncate text-xs text-muted">{item.key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{item.contentType}</td>
                    <td className="px-4 py-3 text-muted">{formatBytes(item.sizeBytes)}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          aria-label={`Download ${item.filename}`}
                          disabled={download.isPending}
                          variant="secondary"
                          onClick={() => download.mutate(item.id)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          aria-label={`Delete ${item.filename}`}
                          disabled={remove.isPending}
                          variant="ghost"
                          onClick={() => remove.mutate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center p-8 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-soft text-brand">
                <UploadCloud className="h-7 w-7" />
              </div>
              <p className="mt-3 font-semibold">No files yet</p>
              <p className="mt-1 text-sm text-muted">Upload one file to see the transfer flow.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function FileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-field p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-brand">
        <HardDrive className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}
