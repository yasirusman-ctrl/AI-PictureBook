import { useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import type { Story } from '../types';

interface Props {
  story: Story;
  onClose: () => void;
}

export default function ExportModal({ story, onClose }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    setExportProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < story.pages.length; i++) {
        const page = story.pages[i];

        if (i > 0) pdf.addPage();

        // Title
        pdf.setFontSize(16);
        pdf.text(`Page ${page.pageNumber}`, pageWidth / 2, 20, { align: 'center' });

        // Narration
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(page.narration || 'No narration', pageWidth - 30);
        pdf.text(lines, 15, 35);

        // Try to add image
        if (page.imageUrl) {
          try {
            const imgCanvas = document.createElement('canvas');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const imgLoad = new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
            });
            img.src = page.imageUrl;
            await imgLoad;

            imgCanvas.width = img.naturalWidth;
            imgCanvas.height = img.naturalHeight;
            const ctx = imgCanvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);

            const imgData = imgCanvas.toDataURL('image/jpeg', 0.8);
            const imgWidth = pageWidth - 30;
            const imgHeight = (imgCanvas.height / imgCanvas.width) * imgWidth;
            const yPos = 40 + lines.length * 5 + 10;
            if (yPos + imgHeight < pageHeight - 20) {
              pdf.addImage(imgData, 'JPEG', 15, yPos, imgWidth, Math.min(imgHeight, pageHeight - yPos - 20));
            }
          } catch {
            // Image could not be added
          }
        }

        setExportProgress(Math.round(((i + 1) / story.pages.length) * 100));
      }

      pdf.save(`${story.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch {
      // Export failed silently
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Export Story</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>

        <div ref={previewRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {story.pages.map((page) => (
            <div key={page.id} className="rounded-lg border bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Page {page.pageNumber}</h3>
              <p className="mb-3 text-sm text-gray-600">{page.narration}</p>
              {page.imageUrl && (
                <img
                  src={page.imageUrl}
                  alt={`Preview page ${page.pageNumber}`}
                  className="max-h-60 rounded object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>

        <div className="border-t px-6 py-4">
          {exporting && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-sm text-gray-600">
                <span>Generating PDF...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={exporting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
