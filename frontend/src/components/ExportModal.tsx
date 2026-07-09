import { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import type { Story } from '../types';

interface Props {
  story: Story;
  onClose: () => void;
}

export default function ExportModal({ story, onClose }: Props) {
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();

      for (let i = 0; i < story.pages.length; i++) {
        const el = pageRefs.current[i];
        if (!el) continue;

        if (i > 0) pdf.addPage();

        const canvas = await html2canvas(el, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#1e1e2e',
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height / canvas.width) * imgWidth;

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

        setExportProgress(Math.round(((i + 1) / story.pages.length) * 100));
      }

      pdf.save(`${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch {
      // export failed
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col pixel-card">
        <div className="flex items-center justify-between border-b-2 border-mc-border px-6 py-4">
          <h2 className="font-pixel-heading text-xs text-mc-text">Export Story</h2>
          <button onClick={onClose} className="font-pixel-heading text-xs text-mc-text-muted hover:text-mc-text">&times;</button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {story.pages.map((page, i) => (
            <div
              key={page.id}
              ref={(el) => { pageRefs.current[i] = el; }}
              className="pixel-card overflow-hidden p-4"
            >
              <h3 className="mb-2 font-pixel-heading text-[10px] text-mc-accent">
                Page {page.pageNumber}
              </h3>
              <p className="mb-3 font-pixel-body text-lg leading-tight text-mc-text">
                {page.narration}
              </p>
              {page.imageUrl && (
                <img
                  src={page.imageUrl}
                  alt={`Page ${page.pageNumber}`}
                  className="w-full max-h-80 object-contain border-2 border-mc-border"
                  crossOrigin="anonymous"
                />
              )}
            </div>
          ))}
        </div>

        <div className="border-t-2 border-mc-border px-6 py-4">
          {exporting && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between font-pixel-body text-sm text-mc-text-muted">
                <span>Generating PDF...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="h-3 w-full border-2 border-mc-border bg-mc-surface">
                <div
                  className="h-full bg-mc-accent transition-all duration-500"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={exporting}
              className="pixel-btn bg-mc-surface-alt px-4 py-2 text-mc-text disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="pixel-btn bg-mc-accent px-4 py-2 text-white disabled:opacity-40"
            >
              {exporting ? 'Exporting...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
