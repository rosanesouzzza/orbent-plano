import React from 'react';
import type { ActionItem } from './GanttChart';

export type PrintableExecutiveReportProps = {
  clientName: string;
  reportDate: string;       // 'YYYY-MM-DD'
  summaryContent: string;   // pode ser Markdown simples; aqui renderizamos texto puro
  actionItems: ActionItem[]; 
  planOwnerName: string;
};

export function PrintableExecutiveReport(props: PrintableExecutiveReportProps) {
  const { clientName, reportDate, summaryContent, actionItems, planOwnerName } = props;

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Executive Report</h3>
        <div style={{ color: '#666', fontSize: 14 }}>
          Cliente: <b>{clientName}</b> • Data: {reportDate} • Responsável: <b>{planOwnerName}</b>
        </div>
      </header>

      <section style={{ marginBottom: 16 }}>
        <h4>Resumo</h4>
        <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{summaryContent}</p>
      </section>

      <section>
        <h4>Ações</h4>
        {(!actionItems || actionItems.length === 0) && (
          <div style={{ fontStyle: 'italic' }}>Sem ações no período.</div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Título</th>
              <th style={th}>Início</th>
              <th style={th}>Fim</th>
              <th style={th}>Status</th>
              <th style={th}>Depto</th>
              <th style={th}>Pilar</th>
            </tr>
          </thead>
          <tbody>
            {actionItems.map((a) => (
              <tr key={a.id}>
                <td style={td}>{a.id}</td>
                <td style={td}>{a.title}</td>
                <td style={td}>{a.startDate}</td>
                <td style={td}>{a.endDate}</td>
                <td style={td}>{a.status || '-'}</td>
                <td style={td}>{a.department || '-'}</td>
                <td style={td}>{a.pillar || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #e5e7eb' };
const td: React.CSSProperties = { padding: '6px', borderBottom: '1px solid #f1f5f9' };
