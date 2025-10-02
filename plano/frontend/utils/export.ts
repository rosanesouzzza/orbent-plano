// src/utils/export.ts
import type { Action } from "@/lib/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

/** CSV simples */
export function exportActionsToCSV(actions: Action[], filename = "actions.csv") {
  const headers = ["ID", "Título", "Início", "Fim", "Status", "Depto", "Pilar", "Plano"];
  const rows = actions.map((a) => [
    a.id,
    a.title,
    a.start_date ?? "",
    a.end_date ?? "",
    a.status,
    a.department ?? "",
    a.pillar ?? "",
    a.plan_id,
  ]);

  const csv =
    [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Excel (xlsx) */
export function exportActionsToXLSX(actions: Action[], filename = "actions.xlsx") {
  const data = actions.map((a) => ({
    ID: a.id,
    Título: a.title,
    Início: a.start_date ?? "",
    Fim: a.end_date ?? "",
    Status: a.status,
    Depto: a.department ?? "",
    Pilar: a.pillar ?? "",
    Plano: a.plan_id,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ações");
  XLSX.writeFile(wb, filename);
}

/** PDF a partir de um container */
export async function exportElementToPDF(element: HTMLElement, filename = "report.pdf") {
  // cria um canvas do elemento
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL("image/png");

  // doc em A4
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // calcula a altura proporcional
  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let y = 0;
  let remaining = imgHeight;

  // paginação se passar de 1 página
  while (remaining > 0) {
    pdf.addImage(imgData, "PNG", 0, y ? 0 : 0, imgWidth, imgHeight);
    remaining -= pageHeight;
    if (remaining > 0) pdf.addPage();
    // move para cima a imagem para simular "rolagem"
    y += pageHeight;
  }

  pdf.save(filename);
}
