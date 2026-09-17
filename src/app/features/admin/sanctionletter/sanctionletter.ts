import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { jsPDF } from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';


interface LoanData {
  date: string;
  referenceNo: string;
  borrowerName: string;
  borrowerAddress: string;
  coBorrowerName: string;
  coBorrowerAddress: string;
  loanAmount: string;
  country: string;
  course: string;
  university: string;
  duration: string;
  commencementDate: string;
  rateOfInterest: string;
  interestType: string;
  emi: string;
  tenure: string;
}

@Component({
  selector: 'app-sanctionletter',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './sanctionletter.html',
  styleUrl: './sanctionletter.scss'
})
export class Sanctionletter implements OnInit {
  pdfSrc: string | null = null;
  generatedPdfBlob: Blob | null = null;
  pdfUrl!: SafeResourceUrl;
  
  allDetails:any;
  userdata:any;
  constructor(private http: HttpClient, private sanitizer: DomSanitizer) { }


  loanData: LoanData = {
    date: '28/08/2025',
    referenceNo: 'EDU/2026/12345',
    borrowerName: 'Mr. Rajesh Kumar Sharma',
    borrowerAddress: 'S/o Suresh Kumar Sharma\nR/o 123, Green Valley Apartments, Sector 15, Noida, UP-201301',
    coBorrowerName: 'Suresh Kumar Sharma',
    coBorrowerAddress: '123, Green Valley Apartments, Sector 15, Noida, UP-201301',
    loanAmount: '45,00,000',
    country: 'Australia',
    course: 'Masters of Computer Science',
    university: 'University of Melbourne',
    duration: '2 Years',
    commencementDate: '01/09/2026',
    rateOfInterest: '10.50% p.a.',
    interestType: 'Fixed',
    emi: '180 Months',
    tenure: '180 Months'
  };

  ngOnInit() {
   
    const kyc = sessionStorage.getItem('kycs');
    const kyc1 = kyc ? JSON.parse(kyc) : null;
    this.allDetails = kyc1[0];
    this.generateSanctionLetter();
  }
  generateSanctionLetter() {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    //----------------page 1----------------------------
    // Add logo (using text as placeholder)
    this.addLogo(doc, pageWidth);

    // Date and Reference
    doc.setFontSize(10);
    doc.setFont('Arial', 'normal');
    doc.text(`Date: ${this.loanData.date}`, 10, 38);
    doc.text(`Reference No: ${this.loanData.referenceNo}`, 10, 44);

    // Title
    doc.setFontSize(18);
    doc.setFont('Arial', 'bold');
    doc.text('SANCTION LETTER', pageWidth / 2, 65, { align: 'center' });

    // To section
    doc.setFontSize(10);
    doc.setFont('Arial', 'normal');
    doc.text('To,', 10, 75);
    doc.setFont('Arial', 'bold');
    doc.text(`${this.allDetails.firstName+" "+this.allDetails.lastName} (Borrower)`, 10, 80);
    doc.setFont('Arial', 'normal');
    const borrowerLines = doc.splitTextToSize(this.allDetails.addresses[0].line1+" "+this.allDetails.addresses[0].line2+" "+this.allDetails.addresses[0].city+" "+this.allDetails.addresses[0].state+" "+this.allDetails.addresses[0].zipCode, 180);
    doc.text(borrowerLines, 10, 85);

    let currentY = 85 + (borrowerLines.length * 4);
    doc.setFont('Arial', 'bold');
    doc.text(`${this.loanData.coBorrowerName} (Co-borrower)`, 10, currentY);
    doc.setFont('Arial', 'normal');
    doc.text(this.loanData.coBorrowerAddress, 10, currentY + 5);


    //Dear Sir/Madam section
    currentY += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('Arial', 'normal');
    doc.text('Dear Sir/Madam,', 10, currentY);

    currentY += 8;
    doc.setFont('Arial', 'bold');
    doc.text(`Re: Education Loan Sanction of INR ${this.loanData.loanAmount}`, 10, currentY);

    currentY += 10;
    doc.setFont('Arial', 'normal');
    const bodyText = `We are pleased to inform you that we have sanctioned an education loan of INR `+ this.loanData.loanAmount +` (Forty Five Lakhs Only) in your favour under the terms and conditions given below`;
    const bodyLines = doc.splitTextToSize(bodyText, 190);
    doc.text(bodyLines, 10, currentY);


    currentY += 15;

    // Course Details Table
    doc.setFont('Arial', 'bold');
    doc.text('Course Details', 10, currentY);
    currentY += 5;

    currentY = this.drawTable(doc, currentY, [
      ['Country', this.loanData.country],
      ['Course', this.loanData.course],
      ['University', this.loanData.university],
      ['Duration', this.loanData.duration],
      ['Commencement Date', this.loanData.commencementDate]
    ]);

    currentY += 10;

    // Loan Details Table
    doc.setFont('Arial', 'bold');
    doc.text('Loan Details', 10, currentY);
    currentY += 5;

    currentY = this.drawTable(doc, currentY, [
      ['Rate of Interest', this.loanData.rateOfInterest],
      ['Interest Type', this.loanData.interestType],
      ['EMI', this.loanData.emi],
      ['Tenure', this.loanData.tenure]
    ]);

    currentY += 10;

    // Bottom text
    doc.setFont('Arial', 'normal');
    doc.setFontSize(9);
    const bottomText = 'We are pleased to inform you that your education loan application has successfully reached the final stage of processing. To proceed further, we kindly request you to submit the following documents:';
    const bottomLines = doc.splitTextToSize(bottomText, 180);
    doc.text(bottomLines, 10, currentY);

    // Footer
    doc.setFont('DM Sans', 'bold');
    doc.setFontSize(9);
    doc.text('Elanistech Private Limited t/a Nivi Capital (CIN U72900KA2019PTC127223). Contact: 022-40996484', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // -----------------------------PAGE 2---------------------------
    doc.addPage();

    // Add logo on page 2
    this.addLogo(doc, pageWidth);

    currentY = 30;

    //Required Documents Box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(10, currentY, 190, 60);

    doc.setFont('Arial', 'bold');
    doc.setFontSize(10);
    doc.rect(10, currentY, 190, 10); // outer box
    doc.roundedRect(10, currentY, 60 + 130, currentY + 20, 2, 2);

    doc.line(10, currentY, 150, currentY); // vertical line
    doc.text('Required Documents:', 15, currentY + 6);

    // Column separator
    doc.line(10 + 60, currentY, 10 + 60, currentY + 60);

    // Documents table
    const documents = [
      'Valid Student Visa Copy',
      'Admission Letter from the Institution (eCoE)',
      "Co-applicant's Income Proof (Salary Slips / ITR)",
      'Updated Bank Statement (last 6 months)',
      'Collateral Documents (if applicable)',
      'KYC Documents (Applicant and Co-applicant)'
    ];

    let docY = currentY;
    doc.setFont('Arial', 'normal');
    doc.setFontSize(10);
    documents.forEach(docItem => {
      doc.setDrawColor(200, 200, 200);
      doc.rect(10, currentY, 190, 10);
      doc.line(10, currentY, 80, currentY);
      doc.text(docItem, 80, currentY + 6);
      currentY += 10;
    });


    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    currentY += 10;

    // Important Note Box
    doc.setFillColor(240, 240, 240);
    doc.rect(10, currentY, 190, 30, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, currentY, 190, 30);

    doc.setFont('Arial', 'bold');
    doc.setFontSize(10);
    doc.text('IMPORTANT NOTE:', 15, currentY + 8);

    doc.setFont('Arial', 'normal');
    doc.setFontSize(10);
    const noteText = 'The above documents must be submitted to us by 5 PM on 26th October 1525. Upon receipt of the completed set of documents, our team will process the application. We look forward for assisting you further in completing your loan process.';
    const noteLines = doc.splitTextToSize(noteText, 170);
    doc.text(noteLines, 15, currentY + 15);

    currentY += 45;

    // Thank you message
    doc.setFontSize(10);
    const thankYouText = 'Thank you for choosing Nivi Capital for your educational finance needs. We wish you all the best for your future endeavours.';
    const thankYouLines = doc.splitTextToSize(thankYouText, 180);
    doc.text(thankYouLines, 10, currentY);

    currentY += 15;

    // Closing
    doc.text('Warm Regards,', 10, currentY);
    doc.text('Loan Officer', 10, currentY + 5);
    doc.text('Nivi Capital', 10, currentY + 10);
    doc.text('Mumbai, Maharashtra', 10, currentY + 15);

    // Disclaimer box
    currentY = pageHeight - 50;
    doc.setFillColor(250, 250, 250);
    doc.rect(10, currentY, 190, 30, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(10, currentY, 190, 30);

    doc.setFont('Arial', 'bold');
    doc.setFontSize(10);
    doc.text('DISCLAIMER:', pageWidth / 2, currentY + 6, { align: 'center' });

    doc.setFont('Arial', 'bold');
    doc.setFontSize(10);
    const disclaimerText = 'This is a computer-generated sanction communication. Please read the terms and conditions carefully. This letter is not a binding loan agreement.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, 170);
    doc.text(disclaimerLines, pageWidth / 2, currentY + 12, { align: 'center' });

    // Footer on page 2
    doc.setFontSize(9);
    doc.text('Elanistech Private Limited t/a Nivi Capital (CIN U72900KA2019PTC127223). Contact: 022-40996484', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Open PDF
    this.addWatermark(doc);
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    this.pdfSrc = blobUrl;
    this.generatedPdfBlob = pdfBlob;

    //  Sanitize before using
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);



  }

  // Custom table drawing function (no external library needed)

  drawTable(doc: jsPDF, startY: number, rows: string[][]): number {
    const cellHeight = 10;
    const col1Width = 60;
    const col2Width = 130;
    const totalHeight = rows.length * cellHeight;
    const borderRadius = 1;
    let currentY = startY;

    // Draw outer border
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(10, startY, col1Width + col2Width, totalHeight, borderRadius, borderRadius);

    // Draw internal lines
    for (let i = 1; i < rows.length; i++) {
      const y = startY + i * cellHeight;
      doc.line(10, y, 10 + col1Width + col2Width, y);
    }
    // Column separator
    doc.line(10 + col1Width, startY, 10 + col1Width, startY + totalHeight);

    // Add text
    doc.setFontSize(10);
    rows.forEach((row, index) => {
      const y = startY + (index * cellHeight);
      doc.setFont('Arial', 'bold');
      doc.text(row[0], 20, y + 6.5);
      doc.setFont('Arial', 'normal');
      doc.text(row[1], 20 + col1Width, y + 6.5);
    });

    return startY + totalHeight;
  }

  // Send the generated PDF via API
  // sendSanctionLetter() {
  //   if (!this.generatedPdfBlob) {
  //     alert('Please generate the sanction letter first!');
  //     return;
  //   }

  //   const formData = new FormData();
  //   formData.append('file', this.generatedPdfBlob, 'sanction-letter.pdf');
  //   formData.append('loanId', this.loanData.id);

  //   this.http.post('/api/saveSanctionLetter', formData).subscribe({
  //     next: () => alert('Sanction Letter sent successfully!'),
  //     error: (err) => console.error('Error sending PDF:', err)
  //   });
  // }


  addLogo(doc: jsPDF, pageWidth: number) {

    const logoUrl = 'assets/images/login/sidemenulogo.webp'; 

    // x, y = top-right corner with padding
    const logoWidth = 45; // adjust to image size
    const logoHeight = 20;
    const xPos = pageWidth - logoWidth - 10; // 10mm right margin
    const yPos = 5; // top margin

    // Draw the image (you can also use Base64 string if needed)
    doc.addImage(logoUrl, 'png', xPos, yPos, logoWidth, logoHeight);
  }

  addWatermark1(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if ((doc as any).setGState) {
      const gState = doc.GState({ opacity: 0.1 });
      (doc as any).setGState(gState);
    }

    doc.setFontSize(70);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "bold");
    doc.text("CONFIDENTIAL", pageWidth / 2, pageHeight / 2, {
      angle: 45,
      align: "center",
    });
  }

  addWatermark(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Reset opacity state on each page
      try {
        if ((doc as any).setGState && (doc as any).GState) {
          const gState = (doc as any).GState({ opacity: 0.1 }); // consistent opacity
          (doc as any).setGState(gState);
        }
        else {
          // fallback: simulate opacity by lighter color
          doc.setTextColor(180, 180, 180);
        }
      } catch {
        doc.setTextColor(180, 180, 180);
      }

      // --- Set style ---
      doc.setFontSize(100);
      doc.setTextColor(180, 180, 180); // soft gray
      doc.setFont('Arial', 'bold');

      // --- Compute manual centering (fix for rotation offset) ---
      const text = 'Confidencial';
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth) - (textWidth / 2.5); // adjust because rotation skews centering
      const y = pageHeight - 60;

      // --- Draw watermark ---
      doc.text(text, x, y, {
        angle: 45,
        align: 'center',
      });
      try {
        if ((doc as any).GState && (doc as any).setGState) {
          const resetState = (doc as any).GState({ opacity: 1 });
          (doc as any).setGState(resetState);
        }
      } catch { }
    }
  }


}


