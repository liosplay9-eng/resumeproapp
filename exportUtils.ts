import jsPDF from 'jspdf';

export const exportToPdf = (resumeData: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text(resumeData.name || 'Resume', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`${resumeData.email} | ${resumeData.phone}`, 20, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('PROFESSIONAL SUMMARY', 20, 45);
  doc.setLineWidth(0.5);
  doc.line(20, 47, 190, 47);
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  const summaryLines = doc.splitTextToSize(resumeData.summary || '', 170);
  doc.text(summaryLines, 20, 55);
  
  let y = 55 + (summaryLines.length * 5) + 10;
  
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text('EXPERIENCE', 20, y);
  doc.line(20, y + 2, 190, y + 2);
  y += 10;
  
  resumeData.experience?.forEach((exp: any) => {
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(exp.role, 20, y);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(exp.period, 190, y, { align: 'right' });
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(exp.company, 20, y);
    y += 7;
    
    doc.setTextColor(0);
    exp.achievements?.forEach((ach: string) => {
      const achLines = doc.splitTextToSize(`• ${ach}`, 160);
      doc.text(achLines, 25, y);
      y += (achLines.length * 5);
    });
    y += 5;
  });
  
  doc.save(`${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf`);
};
