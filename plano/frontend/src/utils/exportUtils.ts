// src/utils/exportUtils.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import html2canvas from "html2canvas";
import type { Action } from "@/lib/api";

export function exportActionsToCSV(rows: Action[], filename = "acoes.csv") {
  const header = ["id", "title", "start_date", "end_date", "status", "department", "pillar", "plan_id"];
  const data = rows.map((a) => [
    a.id,
    a.title,
    a.start_date ?? "",
    a.end_date ?? "",
    a.status,
    a.department ?? "",
    a.pillar ?? "",
    a.plan_id,
  ]);
  const csv = [header, ...data]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  saveAs(blob, filename);
}

export function exportActionsToXLSX(rows: Action[], filename = "acoes.xlsx") {
  const wsData = rows.map((a) => ({
    ID: a.id,
    Título: a.title,
    Início: a.start_date ?? "",
    Fim: a.end_date ?? "",
    Status: a.status,
    Departamento: a.department ?? "",
    Pilar: a.pillar ?? "",
    Plano: a.plan_id,
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Ações");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), filename);
}

export function exportExecutivePDF(rows: Action[], filename = "executivo.pdf") {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(14);
  doc.text("Executive Report - Ações do Plano", 40, 40);

  const head = [["ID", "Título", "Início", "Fim", "Status", "Depto", "Pilar"]];
  const body = rows.map((a) => [
    a.id,
    a.title,
    a.start_date ?? "",
    a.end_date ?? "",
    a.status,
    a.department ?? "",
    a.pillar ?? "",
  ]);

  // @ts-ignore - plugin registra autoTable em runtime
  doc.autoTable({
    startY: 60,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [33, 150, 243] },
  });

  doc.save(filename);
}

export async function exportTablePng(tableId: string, filename = "tabela.png") {
  const el = document.getElementById(tableId);
  if (!el) return;
  const canvas = await html2canvas(el as HTMLElement, { scale: 2, backgroundColor: "#FFFFFF" });
  canvas.toBlob((blob: Blob | null) => {
    if (blob) saveAs(blob, filename);
  });
}
