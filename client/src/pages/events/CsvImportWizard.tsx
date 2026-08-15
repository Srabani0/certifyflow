import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { ApiError, apiRequest } from '../../lib/api';
import type { CsvImportResult, CsvPreviewResult } from '../../lib/types';

interface CsvImportWizardProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

const NONE = '__none__';

export function CsvImportWizard({ eventId, open, onClose, onImported }: CsvImportWizardProps): JSX.Element {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null);
  const [nameColumn, setNameColumn] = useState('');
  const [emailColumn, setEmailColumn] = useState(NONE);
  const [categoryColumn, setCategoryColumn] = useState(NONE);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest<CsvPreviewResult>(`/events/${eventId}/participants/import/preview`, {
        method: 'POST',
        body: formData,
        isFormData: true,
      });
    },
    onSuccess: (result) => {
      setPreview(result);
      setNameColumn(result.suggestedMapping.nameColumn ?? '');
      setEmailColumn(result.suggestedMapping.emailColumn ?? NONE);
      setCategoryColumn(result.suggestedMapping.categoryColumn ?? NONE);
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not read the CSV file', 'error');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!preview) {
        throw new Error('Nothing to import');
      }
      return apiRequest<CsvImportResult>(`/events/${eventId}/participants/import/confirm`, {
        method: 'POST',
        body: {
          rows: preview.rows,
          mapping: {
            nameColumn,
            emailColumn: emailColumn === NONE ? undefined : emailColumn,
            categoryColumn: categoryColumn === NONE ? undefined : categoryColumn,
          },
        },
      });
    },
    onSuccess: (result) => {
      setImportResult(result);
      onImported();
    },
    onError: (error: unknown) => {
      showToast(error instanceof ApiError ? error.message : 'Could not import participants', 'error');
    },
  });

  function reset(): void {
    setCsvFile(null);
    setPreview(null);
    setNameColumn('');
    setEmailColumn(NONE);
    setCategoryColumn(NONE);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleClose(): void {
    reset();
    onClose();
  }

  const sampleRows = preview ? preview.rows.slice(0, 5) : [];

  return (
    <Modal open={open} onClose={handleClose} title="Import participants from CSV" size="lg">
      <div className="flex flex-col gap-4">
        {!preview && (
          <>
            <p className="text-sm text-gray-600">
              Upload a CSV file with a header row. On the next step you can confirm which column holds the name,
              email, and optionally a category to auto-assign certificate types.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setCsvFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button
              disabled={!csvFile}
              isLoading={previewMutation.isPending}
              onClick={() => csvFile && previewMutation.mutate(csvFile)}
            >
              Upload and continue
            </Button>
          </>
        )}

        {preview && !importResult && (
          <>
            <p className="text-sm text-gray-600">
              Found {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'}. Confirm the column mapping below.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select label="Name column" value={nameColumn} onChange={(event) => setNameColumn(event.target.value)}>
                <option value="">Select…</option>
                {preview.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </Select>
              <Select
                label="Email column (optional)"
                value={emailColumn}
                onChange={(event) => setEmailColumn(event.target.value)}
              >
                <option value={NONE}>None</option>
                {preview.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </Select>
              <Select
                label="Category column (optional)"
                value={categoryColumn}
                onChange={(event) => setCategoryColumn(event.target.value)}
              >
                <option value={NONE}>None</option>
                {preview.headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </Select>
            </div>
            {categoryColumn !== NONE && (
              <p className="text-xs text-gray-500">
                Values in this column are matched case-insensitively against your certificate type names:{' '}
                {preview.certificateTypes.length > 0
                  ? preview.certificateTypes.map((type) => type.name).join(', ')
                  : 'no certificate types created yet'}
                .
              </p>
            )}

            {sampleRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      {preview.headers.map((header) => (
                        <th key={header} className="whitespace-nowrap px-3 py-2">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sampleRows.map((row, index) => (
                      <tr key={index}>
                        {preview.headers.map((header) => (
                          <td key={header} className="whitespace-nowrap px-3 py-2 text-gray-600">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button disabled={!nameColumn} isLoading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                Import {preview.totalRows} row{preview.totalRows === 1 ? '' : 's'}
              </Button>
            </div>
          </>
        )}

        {importResult && (
          <>
            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="font-medium text-gray-900">
                Imported {importResult.imported} of {importResult.totalRows} rows
              </p>
              {importResult.skipped > 0 && (
                <p className="mt-1 text-gray-600">{importResult.skipped} rows were skipped.</p>
              )}
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {importResult.errors.map((error, index) => (
                      <tr key={`${error.row}-${index}`}>
                        <td className="px-3 py-2">{error.row}</td>
                        <td className="px-3 py-2 text-gray-600">{error.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button onClick={handleClose}>Done</Button>
          </>
        )}
      </div>
    </Modal>
  );
}
