import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { exportHtmlAsDoc } from '../utils/exportUtils';

interface ExportJob {
  type: 'pdf' | 'doc';
  content: React.ReactElement;
  fileName: string;
}

/**
 * A hook to handle component exporting to PDF and Word (.doc).
 * It manages rendering the component to a portal and triggering the export action.
 * @returns An object with the trigger function, the portal component to render, and the exporting status.
 */
export const useExportHandler = () => {
  const [job, setJob] = useState<ExportJob | null>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!job || !portalRef.current) return;

    const executeExport = async () => {
      const elementToPrint = portalRef.current;
      if (!elementToPrint) {
          setIsExporting(false);
          setJob(null);
          return;
      }
      
      // Add a class to the body to apply print-specific styles that might affect layout for capturing.
      document.body.classList.add('is-printing');

      if (job.type === 'pdf') {
        try {
            const canvas = await html2canvas(elementToPrint, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                windowWidth: elementToPrint.scrollWidth,
                windowHeight: elementToPrint.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            
            // A4 page dimensions in mm: 210w x 297h
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;

            const imgWidth = pdfWidth;
            const imgHeight = imgWidth / ratio;
            
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`${job.fileName.replace(/\.doc$/, '')}.pdf`);
        } catch(e) {
            console.error("Error generating PDF:", e);
        } finally {
            document.body.classList.remove('is-printing');
            setIsExporting(false);
            setJob(null);
        }
      } else if (job.type === 'doc') {
        const reportHtml = elementToPrint.innerHTML;
        exportHtmlAsDoc(reportHtml, job.fileName);
        document.body.classList.remove('is-printing');
        setIsExporting(false);
        setJob(null);
      }
    };
    
    // Use a double requestAnimationFrame to ensure rendering is complete before capture.
    requestAnimationFrame(() => {
        requestAnimationFrame(executeExport);
    });

  }, [job]);

  const triggerExport = useCallback((newJob: Omit<ExportJob, 'fileName'> & { fileName?: string }) => {
    if (isExporting) return;
    setIsExporting(true);
    setJob({ ...newJob, fileName: newJob.fileName || 'export.doc' });
  }, [isExporting]);

  const ExportPortal = job ? ReactDOM.createPortal(
    React.createElement('div', { className: 'print-container', ref: portalRef }, job.content),
    document.body
  ) : null;

  return { triggerExport, ExportPortal, isExporting };
};
