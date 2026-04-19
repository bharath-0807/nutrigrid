import jsPDF from "jspdf";
import "jspdf-autotable";

export const generateProposalPDF = () => {
  const doc = new jsPDF();
  const primary = "#2563EB";
  const secondary = "#0F172A";

  // HEADER
  doc.setFillColor(secondary);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NUTRIGRID: Project Fund Requisition", 20, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("WHO LMS Child Growth Monitoring System • Clinical Grade Innovation", 20, 30);

  // BODY
  doc.setTextColor(secondary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("1. Executive Summary", 20, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summary = "NutriGrid is a high-precision medical-grade application designed for the Tamil Nadu ICDS (Integrated Child Development Services). It implements the WHO Multi-centre Growth Reference Study (MGRS) using the statistical Box-Cox LMS algorithm to detect SAM (Severe Acute Malnutrition) and MAM (Moderate Acute Malnutrition) with clinical accuracy. The project has been shortlisted for Top 50 excellence with a secondary prize potential of ₹2,00,000.";
  doc.text(doc.splitTextToSize(summary, 170), 20, 62);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("2. Competition Potential (Naan Mudhalvan)", 20, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const comp = "Out of 500 competing teams, NutriGrid is positioned as a world-class MNC-standard product. To secure the ₹2,00,000 Top 50 prize, a professional field-ready demonstration is required. This requires moving from a local laptop development environment to a dedicated Digital Health Terminal (Tablet) suitable for Anganwadi field workers.";
  doc.text(doc.splitTextToSize(comp, 170), 20, 92);

  // BUDGET TABLE
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("3. Budget Requisition (Project Grant)", 20, 115);
  
  doc.autoTable({
    startY: 122,
    head: [["Component", "Description", "Estimated Cost (INR)"]],
    body: [
      ["Digital Health Tablet", "Samsung Galaxy Tab / Lenovo M9 (For Field Demo)", "12,500"],
      ["Production Cloud Host", "Vercel Pro Tier & Firebase Blaze Scaling", "4,800"],
      ["Domain & SSL", "nutrigrid.in Official Identity & Security", "2,200"],
      ["API Services", "Speech-to-Text Multilingual Processing Credits", "2,000"],
    ],
    theme: "striped",
    headStyles: { fillColor: primary },
    styles: { fontSize: 9 },
  });

  const footerY = doc.autoTable.previous.finalY + 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Total Requested Grant: ₹21,500", 20, footerY);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Note: The Naan Mudhalvan Scheme provides a ₹15,000 reimbursement grant upon submission of GST-eligible invoices. We request the Institution to procure the hardware components to facilitate the final winning demonstration.", 20, footerY + 10, { maxWidth: 170 });

  // SIGNATURES
  doc.setFont("helvetica", "bold");
  doc.text("____________________", 20, footerY + 40);
  doc.text("Team Lead", 20, footerY + 45);
  doc.text("____________________", 140, footerY + 40);
  doc.text("Principal / HOD", 140, footerY + 45);

  doc.save("NutriGrid_Grant_Proposal.pdf");
};
