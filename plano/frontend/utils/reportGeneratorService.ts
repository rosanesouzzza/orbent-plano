import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SavedReport } from '../types';
// FIX: Corrected import path for safeFormatDate.
import { getDisplayStatus } from './styleUtils';
import { safeFormatDate } from './dateUtils';

// --- TYPES ---
interface GeneratorOptions {
    report: SavedReport;
    clientName: string;
    planOwnerName: string;
    parsedSections: { [key: string]: string };
    elementIds: {
        cover: string;
        kpi: string;
        gantt: string;
        statusByPillar: string;
        priority: string;
    };
}

// --- CONSTANTS ---
const MARGINS = {
    top: 25,    // 2.5 cm
    bottom: 25, // 2.5 cm
    left: 20,   // 2.0 cm
    right: 20,  // 2.0 cm
};
const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CONTENT_WIDTH = A4_WIDTH - MARGINS.left - MARGINS.right;

// --- HELPERS ---
const addHeadersAndFooters = (doc: jsPDF, reportName: string) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Footer on ALL pages
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128); // Gray
        doc.text("Orbent – Inteligência para Acelerar Seus Planos", A4_WIDTH / 2, A4_HEIGHT - (MARGINS.bottom / 2), { align: 'center' });
        
        if (i === 1) continue; // Skip header and page num for cover

        // Header (even pages > 1)
        if (i % 2 === 0) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100);
            doc.text(reportName, MARGINS.left, MARGINS.top - 10, { align: 'left' });
        }
        
        // Page number (from page 2)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(`${i}`, A4_WIDTH - MARGINS.right, A4_HEIGHT - (MARGINS.bottom / 2), { align: 'right' });
    }
};

const captureElementAsImage = async (elementId: string): Promise<string> => {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with id "${elementId}" not found.`);
    
    const canvas = await html2canvas(element, {
        scale: 3, // For ~300 DPI resolution
        useCORS: true,
        backgroundColor: '#ffffff',
    });
    return canvas.toDataURL('image/png', 1.0);
};

// --- PDF SECTION BUILDERS ---
const addImageToPage = (doc: jsPDF, imageData: string, yPos: number): number => {
    const imgProps = doc.getImageProperties(imageData);
    const imgWidth = CONTENT_WIDTH;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    
    if (yPos + imgHeight > A4_HEIGHT - MARGINS.bottom) {
        doc.addPage();
        yPos = MARGINS.top;
    }
    
    doc.addImage(imageData, 'PNG', MARGINS.left, yPos, imgWidth, imgHeight);
    return yPos + imgHeight + 10; // Add 10mm spacing after image
};

const addTextSection = (doc: jsPDF, title: string, content: string, yPos: number): number => {
    if (yPos > MARGINS.top) { // Add spacing if not the first element
        yPos += 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor('#0052cc');
    const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH);
    doc.text(titleLines, MARGINS.left, yPos);
    yPos += titleLines.length * 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    const contentLines = doc.splitTextToSize(content, CONTENT_WIDTH);
    
    for (const line of contentLines) {
        if (yPos > A4_HEIGHT - MARGINS.bottom) {
            doc.addPage();
            yPos = MARGINS.top;
        }
        doc.text(line, MARGINS.left, yPos);
        yPos += 5;
    }
    
    return yPos + 5;
};

// --- MAIN GENERATOR FUNCTION ---
export const generatePdfReport = async (options: GeneratorOptions) => {
    const { report, clientName, parsedSections, elementIds } = options;
    const doc = new jsPDF('p', 'mm', 'a4');

    // === Page 1: Cover ===
    const coverImage = await captureElementAsImage(elementIds.cover);
    const coverImgProps = doc.getImageProperties(coverImage);
    const coverImgWidth = A4_WIDTH;
    const coverImgHeight = (coverImgProps.height * coverImgWidth) / coverImgProps.width;
    doc.addImage(coverImage, 'PNG', 0, 0, coverImgWidth, coverImgHeight);

    // === Page 2: Summary & Conclusion ===
    doc.addPage();
    let currentY = MARGINS.top;
    
    if (parsedSections['Sumário Executivo']) {
        currentY = addTextSection(doc, 'Sumário Executivo', parsedSections['Sumário Executivo'], currentY);
    }
    if (parsedSections['Considerações Finais']) {
        currentY = addTextSection(doc, 'Considerações Finais', parsedSections['Considerações Finais'], currentY);
    }
    
    // === Page 3+: Body (Charts & Visuals) ===
    doc.addPage();
    currentY = MARGINS.top;
    
    const kpiImage = await captureElementAsImage(elementIds.kpi);
    currentY = addImageToPage(doc, kpiImage, currentY);
    
    const ganttImage = await captureElementAsImage(elementIds.gantt);
    currentY = addImageToPage(doc, ganttImage, currentY);

    const statusChartImage = await captureElementAsImage(elementIds.statusByPillar);
    currentY = addImageToPage(doc, statusChartImage, currentY);

    const priorityChartImage = await captureElementAsImage(elementIds.priority);
    addImageToPage(doc, priorityChartImage, currentY);

    // === Annex Pages (Table) ===
    autoTable(doc, {
        startY: A4_HEIGHT, // Start off-page to force a new page
        head: [['ID', 'Desvio/Ponto de Melhoria', 'Responsável', 'Prazo', 'Status', 'Prioridade']],
        body: report.dataUsed.map(item => [
            item.id,
            item.desvioPontoMelhoria,
            item.responsavel,
            safeFormatDate(item.prazo),
            getDisplayStatus(item).label,
            item.priority
        ]),
        theme: 'grid',
        headStyles: { fillColor: '#0052cc' },
        margin: MARGINS,
        didDrawPage: (data) => {
            // This hook is called for pages created by autoTable
        }
    });

    // === Final Step: Add Headers & Footers to all pages ===
    addHeadersAndFooters(doc, report.reportName);

    // --- Save the PDF ---
    doc.save(`${report.reportName.replace(/\s/g, '_')}.pdf`);
};