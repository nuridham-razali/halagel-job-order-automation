
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { JobOrder, ProductSpec } from '../types';

export const generateJobOrderPDF = async (order: JobOrder): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // A4 Size
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 30;
  const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

  // Font Config
  const S_TEXT = 8; 
  const S_BOLD = 8;
  const S_HEADER = 10;
  
  // Box Config (Rectangular Small)
  const CB_W = 12;
  const CB_H = 8;

  // --- Helpers ---
  const safeStr = (val: any, maxLength: number = 100): string => {
    if (val === undefined || val === null) return '';
    let str = String(val);
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...';
    }
    return str;
  };

  // Helper to sanitize text for PDF-Lib Standard Fonts (WinAnsi)
  // Replaces non-printable/non-ASCII characters to prevent library hangs/errors
  const sanitize = (text: string): string => {
    return text.replace(/[^\x20-\x7E\n]/g, ''); 
  };

  const drawText = (page: any, text: any, x: number, y: number, size: number = S_TEXT, isBold: boolean = false, align: 'left'|'center'|'right' = 'left', maxLen: number = 100) => {
    const f = isBold ? boldFont : font;
    let str = safeStr(text, maxLen); 
    str = sanitize(str); // Sanitize before width calculation or drawing

    let xPos = x;
    try {
        if (align === 'center') {
            const width = f.widthOfTextAtSize(str, size);
            xPos = x - width / 2;
        } else if (align === 'right') {
            const width = f.widthOfTextAtSize(str, size);
            xPos = x - width;
        }
        page.drawText(str, { x: xPos, y, size, font: f, color: rgb(0,0,0) });
    } catch (e) {
        console.warn('Error drawing text:', str, e);
    }
  };

  const drawBox = (page: any, x: number, y: number, w: number, h: number) => {
    page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0,0,0), borderWidth: 0.5, opacity: 0, borderOpacity: 1 });
  };

  const drawFilledBox = (page: any, x: number, y: number, w: number, h: number, color: any) => {
    page.drawRectangle({ x, y, width: w, height: h, color, borderWidth: 0 });
  };

  const drawLine = (page: any, x1: number, y1: number, x2: number, y2: number) => {
    page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.5, color: rgb(0,0,0) });
  };

  const drawTick = (page: any, x: number, y: number) => {
    // Slash Style (/)
    const startX = x + 3;
    const startY = y + 2;
    const endX = x + CB_W - 3;
    const endY = y + CB_H - 2;

    page.drawLine({ start: { x: startX, y: startY }, end: { x: endX, y: endY }, thickness: 0.8, color: rgb(0,0,0) });
  };

  // Convert Base64 to Uint8Array for robust embedding
  const base64ToUint8Array = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // --- PAGE 1: SALES (SECTION A) ---
  const page1 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 30;

  // 0. LOGO
  // Small optimized Base64 PNG (32x32px)
  const logoBase64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACkSURBVHgB7VdBCsAwCAN9b/9/cl9YwbaQgm1OnQc5WBNt1KZqup7z6RwXyB24A3fgDtyBO/A/gZlR8x24A8cEAGL1TY/9A8A854dtAAO3x7kAZmYfQCaGAdzJ2QA6MQqgE7MABjEbwBCzASwxG8AWMwFMMRPAGDMBjDETwBgzAYwxE8AYMwGMMRPAGDMBjDETwBgzAYwxE8AYMwGMMRPAGP8j5gV39z5j7j5v2AAAAABJRU5ErkJggg==";
  
  // 1. HEADER & LOGO
  drawText(page1, 'HALAGEL GROUP OF COMPANIES', PAGE_WIDTH / 2, y, 11, true, 'center');
  y -= 10;
  drawText(page1, 'JOB ORDER', PAGE_WIDTH / 2, y, 10, true, 'center');
  
  // Dynamic Logo Positioning
  if (logoBase64Data) {
      try {
        const logoData = logoBase64Data.includes('base64,') 
            ? logoBase64Data.split('base64,')[1] 
            : logoBase64Data;
        
        const logoBytes = base64ToUint8Array(logoData);
        const pngImage = await pdfDoc.embedPng(logoBytes);
        
        // Scale logo to a fixed height (e.g., 35)
        const targetHeight = 35;
        const scale = targetHeight / pngImage.height;
        const pngDims = pngImage.scale(scale); 
        
        // Position logic: Left of the centered text
        const textWidthApprox = 190;
        const logoX = (PAGE_WIDTH / 2) - (textWidthApprox / 2) - pngDims.width - 15;
        
        page1.drawImage(pngImage, {
            x: logoX,
            y: y - 5, 
            width: pngDims.width,
            height: pngDims.height,
        });
      } catch (err) {
          console.error("Error embedding logo", err);
      }
  }
  
  y -= 25; 
  const companies = ['Halagel Plant (M) Sdn Bhd', 'Halagel Products Sdn Bhd', 'Halagel Malaysia Sdn Bhd'];
  let compX = MARGIN;
  companies.forEach(comp => {
    drawBox(page1, compX, y, CB_W, CB_H);
    if (order.company === comp) drawTick(page1, compX, y);
    drawText(page1, comp, compX + CB_W + 5, y + 1, 7);
    compX += 180;
  });

  y -= 20;
  // Customer / PO / SKU / Date Block
  const rowH = 30;
  const col1W = 340; 
  
  // Row 1
  drawBox(page1, MARGIN, y - rowH, col1W, rowH); // Customer Box
  drawText(page1, 'CUSTOMER NAME :', MARGIN + 5, y - 18, S_TEXT);
  drawText(page1, order.customerName, MARGIN + 100, y - 18, S_BOLD, true);

  drawBox(page1, MARGIN + col1W, y - rowH, CONTENT_WIDTH - col1W, rowH); // PO Box
  drawText(page1, 'PO NUMBER :', MARGIN + col1W + 5, y - 18, S_TEXT);
  drawText(page1, order.poNumber, MARGIN + col1W + 80, y - 18, S_BOLD, true);

  y -= rowH;
  // Row 2
  drawBox(page1, MARGIN, y - rowH, col1W, rowH); // SKU Box
  
  const centerY = y - (rowH / 2);
  const textY = centerY - 3;
  const boxY = centerY - (CB_H / 2);

  drawText(page1, 'EXISTING SKU', MARGIN + 40, textY, S_TEXT);
  drawBox(page1, MARGIN + 110, boxY, CB_W, CB_H);
  if (order.skuType === 'Existing') drawTick(page1, MARGIN + 110, boxY);
  
  drawText(page1, 'NEW SKU', MARGIN + 180, textY, S_TEXT);
  drawBox(page1, MARGIN + 230, boxY, CB_W, CB_H);
  if (order.skuType === 'New') drawTick(page1, MARGIN + 230, boxY);

  drawBox(page1, MARGIN + col1W, y - rowH, CONTENT_WIDTH - col1W, rowH); 
  drawText(page1, 'ESTIMATE DELIVERY DATE :', MARGIN + col1W + 5, y - 18, S_TEXT);
  drawText(page1, order.estDeliveryDate, MARGIN + col1W + 130, y - 18, S_BOLD, true);

  y -= 20; // Gap

  // --- SECTION A CONTAINER ---
  const sectionATopY = y;
  const sectionHeaderH = 16;
  drawFilledBox(page1, MARGIN, y - sectionHeaderH, CONTENT_WIDTH, sectionHeaderH, rgb(0.9, 0.9, 0.9));
  drawBox(page1, MARGIN, y - sectionHeaderH, CONTENT_WIDTH, sectionHeaderH); 
  drawText(page1, 'SECTION A (To be completed by Sales Representative)', PAGE_WIDTH / 2, y - 11, S_HEADER, true, 'center');
  
  y -= sectionHeaderH; 
  const sectionAContentTopY = y;
  const colWidth = CONTENT_WIDTH / 2;
  
  // DYNAMIC COLUMN CONTENT GENERATOR
  const drawContentColumn = (startX: number, data: ProductSpec | undefined) => {
    let cy = sectionAContentTopY - 10;
    const contentW = colWidth - 10;
    const innerX = startX + 5; 
    
    // Use a safe empty object if data is undefined to allow drawing blank structure
    const p = data || {} as any;

    // A. PRODUCT DETAIL
    drawText(page1, 'A. PRODUCT DETAIL', innerX, cy, S_BOLD, true);
    cy -= 15;
    
    // Product Name
    drawText(page1, 'PRODUCT NAME :', innerX, cy, S_TEXT);
    drawLine(page1, innerX + 80, cy, innerX + contentW, cy);
    drawText(page1, p.productName || '', innerX + 82, cy + 2, S_TEXT);
    
    cy -= 18;
    
    // Quantity Order Grid
    drawText(page1, 'QUANTITY ORDER :', innerX, cy - 6, S_TEXT);
    
    const tblX = innerX + 90;
    const tblW = contentW - 90;
    const tblRowH = 12;
    const rows = ['Bottle', 'Blister', 'Box', 'Tube', 'Others'];
    
    let ty = cy + 4; 
    rows.forEach(row => {
        drawBox(page1, tblX, ty - tblRowH, 60, tblRowH);
        drawText(page1, row, tblX + 2, ty - 9, S_TEXT);
        drawBox(page1, tblX + 60, ty - tblRowH, tblW - 60, tblRowH);
        if (p.unitType === row) {
            drawText(page1, p.orderQuantity, tblX + 65, ty - 9, S_TEXT);
        }
        ty -= tblRowH;
    });
    
    cy = ty - 12;

    // B. PRODUCT SPECIFICATION
    drawText(page1, 'B. PRODUCT SPECIFICATION (PLEASE TICK /)', innerX, cy, S_BOLD, true);
    cy -= 12;

    const drawSpecGroup = (label: string, items: string[], selection: string[], othersText?: string, hasOthers: boolean = true) => {
        drawText(page1, label, innerX, cy, S_TEXT);
        const bx = innerX + 95;
        const bw = contentW - 95;
        let by = cy + 2;
        const safeSelection = selection || []; 
        items.forEach(item => {
            drawBox(page1, bx, by - CB_H, CB_W, CB_H);
            if (safeSelection.includes(item)) drawTick(page1, bx, by - CB_H);
            drawText(page1, item, bx + CB_W + 5, by - CB_H + 1, 7);
            by -= 11; 
        });
        if (hasOthers) {
            drawBox(page1, bx, by - CB_H, CB_W, CB_H);
            if (safeSelection.includes('Others')) {
                drawTick(page1, bx, by - CB_H);
                if (othersText) {
                    drawText(page1, othersText, bx + CB_W + 40, by - CB_H + 1, 7);
                }
            }
            drawText(page1, 'Others :', bx + CB_W + 5, by - CB_H + 1, 7);
            drawLine(page1, bx + CB_W + 35, by - 9, bx + bw, by - 9);
            by -= 11;
        }
        return by - 4;
    };

    cy = drawSpecGroup(
        'PRODUCT CATEGORY', 
        ['Traditional & Health Supplement', 'Toothpaste & Cosmetics', 'Food & Beverages'], 
        p.categories,
        p.categoriesOthers
    );
    cy = drawSpecGroup(
        'PRODUCT TYPE', 
        ['Softgel', 'Hard Capsule', 'Toothpaste', 'Liquid', 'Cosmetics', 'Food'], 
        p.productTypes,
        p.productTypesOthers
    );
    cy = drawSpecGroup(
        'PACKING TYPE', 
        ['HDPE White Bottle', 'Amber Glass Bottle', 'PET Amber Glass Bottle'], 
        p.packingTypes,
        p.packingTypesOthers
    );

    cy -= 2;
    drawText(page1, 'WEIGHT / ITEM', innerX, cy, S_TEXT);
    drawBox(page1, innerX + 95, cy - 2, contentW - 95, 11);
    drawText(page1, p.weightPerItem || '', innerX + 98, cy + 1, S_TEXT);
    
    cy -= 15;
    const qtyRows = [
        {l: 'QUANTITY PER BOTTLE', v: p.qtyPerBottle},
        {l: 'QUANTITY PER BLISTER', v: p.qtyPerBlister},
        {l: 'QUANTITY PER BOX / SET', v: p.qtyPerBoxSet},
        {l: 'QUANTITY PER CARTON', v: p.qtyPerCarton},
    ];
    qtyRows.forEach(q => {
        drawText(page1, q.l, innerX, cy, 7);
        drawBox(page1, innerX + 115, cy - 2, contentW - 115, 11);
        drawText(page1, q.v, innerX + 118, cy + 1, S_TEXT);
        cy -= 13;
    });

    // C. REQUIREMENT
    cy -= 5;
    drawText(page1, 'C. REQUIREMENT (PLEASE TICK /)', innerX, cy, S_BOLD, true);
    cy -= 10;
    
    const reqLabelW = 85;
    const reqBoxW = 55; 
    const reqItems = [
        {k: 'rawMaterial', l: 'RAW MATERIAL:'},
        {k: 'bottle', l: 'BOTTLE:'},
        {k: 'labeling', l: 'LABELLING:'},
        {k: 'innerBox', l: 'INNER BOX:'},
        {k: 'cap', l: 'CAP:'},
        {k: 'capSeal', l: 'CAP SEAL:'},
        {k: 'stopper', l: 'STOPPER:'},
        {k: 'pvcFoil', l: 'PVC FOIL:'},
        {k: 'alumFoil', l: 'ALUMINIUM FOIL:'},
        {k: 'shrinkwrap', l: 'PVC SHRINKWRAP:'},
        {k: 'carton', l: 'CARTON:'},
        {k: 'insert', l: 'INSERT:'},
    ];

    const c1X = innerX + reqLabelW;
    const c2X = innerX + reqLabelW + reqBoxW + 5;
    
    reqItems.forEach(item => {
        drawText(page1, item.l, innerX, cy, 7);
        drawBox(page1, c1X, cy - 2, CB_W, CB_H);
        drawText(page1, 'Customer', c1X + CB_W + 5, cy + 1, 7);
        // @ts-ignore
        if (p.supplySource?.[item.k] === 'Customer') drawTick(page1, c1X, cy - 2);
        
        drawBox(page1, c2X, cy - 2, CB_W, CB_H);
        drawText(page1, 'Halagel', c2X + CB_W + 5, cy + 1, 7);
        // @ts-ignore
        if (p.supplySource?.[item.k] === 'Halagel') drawTick(page1, c2X, cy - 2);
        cy -= 11; 
    });

    // Others
    drawText(page1, 'OTHERS :', innerX, cy, 7);
    drawBox(page1, c1X, cy - 2, CB_W, CB_H);
    drawText(page1, 'Customer', c1X + CB_W + 5, cy + 1, 7);
    if (p.supplySource?.others === 'Customer') drawTick(page1, c1X, cy - 2);
    drawBox(page1, c2X, cy - 2, CB_W, CB_H);
    drawText(page1, 'Halagel', c2X + CB_W + 5, cy + 1, 7);
    if (p.supplySource?.others === 'Halagel') drawTick(page1, c2X, cy - 2);

    return cy - 8; 
  };

  // Draw Columns for Product 1 and Product 2
  const endY1 = drawContentColumn(MARGIN, order);
  const endY2 = drawContentColumn(PAGE_WIDTH / 2, order.product2); 

  // Make space for signature box
  const sigBoxHeight = 70;
  const bottomY = Math.min(endY1, endY2) - sigBoxHeight - 10; 

  // Draw Main Outer Box
  const rectHeight = sectionATopY - bottomY;
  drawBox(page1, MARGIN, bottomY, CONTENT_WIDTH, rectHeight - sectionHeaderH); 
  drawLine(page1, PAGE_WIDTH / 2, sectionAContentTopY, PAGE_WIDTH / 2, bottomY);

  // --- SIGNATURES GRID ---
  const sY = bottomY;
  const sigW = CONTENT_WIDTH / 3;
  
  drawBox(page1, MARGIN, sY, CONTENT_WIDTH, sigBoxHeight);
  drawLine(page1, MARGIN + sigW, sY, MARGIN + sigW, sY + sigBoxHeight);
  drawLine(page1, MARGIN + 2 * sigW, sY, MARGIN + 2 * sigW, sY + sigBoxHeight);

  const titleY = sY + sigBoxHeight - 12;
  drawLine(page1, MARGIN, titleY, MARGIN + CONTENT_WIDTH, titleY);
  
  const nameLineY = sY + 30;
  drawLine(page1, MARGIN, nameLineY, MARGIN + CONTENT_WIDTH, nameLineY);
  
  const dateLineY = sY + 15;
  drawLine(page1, MARGIN, dateLineY, MARGIN + CONTENT_WIDTH, dateLineY);

  const drawSigCell = (x: number, title: string, name: string | undefined, date: string | undefined) => {
      drawText(page1, title, x + 3, sY + sigBoxHeight - 9, 7, true);
      drawText(page1, 'Name :', x + 3, nameLineY - 9, 6);
      drawText(page1, name || '', x + 30, nameLineY - 9, 7);
      drawText(page1, 'Date :', x + 3, dateLineY - 9, 6);
      drawText(page1, date || '', x + 30, dateLineY - 9, 7);
  };

  drawSigCell(MARGIN, 'Prepared by :', order.salesPreparedBy, order.salesDate);
  drawSigCell(MARGIN + sigW, 'Approved by :', order.salesApprovedBy, '');
  drawSigCell(MARGIN + 2 * sigW, 'Received by :', order.salesReceivedBy, '');

  // Connect Signature box to main box
  drawBox(page1, MARGIN, sY + sigBoxHeight, CONTENT_WIDTH, sectionAContentTopY - (sY + sigBoxHeight));
  drawLine(page1, PAGE_WIDTH / 2, sectionAContentTopY, PAGE_WIDTH / 2, sY + sigBoxHeight);


  // --- PAGE 2: PLANNER (SECTION B) ---
  const page2 = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let py = PAGE_HEIGHT - 30;

  // Header
  drawFilledBox(page2, MARGIN, py - 18, CONTENT_WIDTH, 18, rgb(0.9, 0.9, 0.9));
  drawBox(page2, MARGIN, py - 18, CONTENT_WIDTH, 18);
  drawText(page2, 'SECTION B (To be completed by Planner )', PAGE_WIDTH / 2, py - 13, S_HEADER, true, 'center');

  py -= 35;
  drawText(page2, 'JOB ORDER NO :', MARGIN + 20, py, S_TEXT, true);
  drawBox(page2, MARGIN + 100, py - 5, 250, 18);
  drawText(page2, order.jobOrderNo, MARGIN + 105, py, S_TEXT);

  drawText(page2, 'Date:', MARGIN + 370, py, S_TEXT);
  drawBox(page2, MARGIN + 400, py - 5, 135, 18);
  drawText(page2, order.sectionBDate, MARGIN + 405, py, S_TEXT);

  py -= 25;
  
  // TABLE HEADER
  const tX = MARGIN;
  const tW = CONTENT_WIDTH;
  // Adjusted widths to prevent 'Item Code' wrapping and balance columns
  // Item Code: 55, Raw Mat: 140, Qty(3): 85 each, PR: 85
  const colWidths = [55, 140, 85, 85, 85, 85]; 
  const headers = ['Item Code', 'Raw @ Packaging Material', 'Quantity Required\n(kg/pcs)', 'Stock Balance\n(kg/pcs)', 'Quantity to Order\n(kg/pcs)', 'PR No'];
  
  const headerH = 25;
  drawFilledBox(page2, tX, py - headerH, tW, headerH, rgb(0.85, 0.85, 0.85));
  drawBox(page2, tX, py - headerH, tW, headerH);

  let currX = tX;
  headers.forEach((h, i) => {
    drawBox(page2, currX, py - headerH, colWidths[i], headerH);
    drawText(page2, h, currX + 3, py - 10, 7, true); 
    currX += colWidths[i];
  });
  
  py -= headerH;

  const rowHeight = 14;
  const numRows = 25;
  for (let i = 0; i < numRows; i++) {
    const mat = order.materials && order.materials[i];
    currX = tX;
    colWidths.forEach((cw, idx) => {
        drawBox(page2, currX, py - rowHeight, cw, rowHeight);
        if (mat) {
             let val = '';
             if(idx===0) val = mat.itemCode;
             if(idx===1) val = mat.materialName;
             if(idx===2) val = String(mat.qtyRequired);
             if(idx===3) val = String(mat.stockBalance);
             if(idx===4) val = String(mat.qtyToOrder);
             if(idx===5) val = mat.prNo;
             drawText(page2, val, currX + 3, py - 10, S_TEXT);
        }
        currX += cw;
    });
    py -= rowHeight;
  }

  // Remarks
  py -= 10;
  drawText(page2, 'Remarks:', MARGIN, py, S_TEXT, true);
  py -= 5;
  drawBox(page2, MARGIN, py - 50, tW, 55);
  drawText(page2, order.remarks, MARGIN + 5, py - 5, S_TEXT, false, 'left', 1000); // Allow longer text for remarks
  py -= 60;

  // Signatures Page 2
  const sigH2 = 70;
  drawBox(page2, MARGIN, py - sigH2, tW, sigH2);
  const sW2 = tW / 4;
  
  drawLine(page2, MARGIN + sW2, py, MARGIN + sW2, py - sigH2);
  drawLine(page2, MARGIN + 2 * sW2, py, MARGIN + 2 * sW2, py - sigH2);
  drawLine(page2, MARGIN + 3 * sW2, py, MARGIN + 3 * sW2, py - sigH2);

  const tY2 = py - 12;
  drawLine(page2, MARGIN, tY2, MARGIN + tW, tY2);
  
  const nY2 = py - sigH2 + 30; 
  drawLine(page2, MARGIN, nY2, MARGIN + tW, nY2);
  
  const dY2 = py - sigH2 + 15; 
  drawLine(page2, MARGIN, dY2, MARGIN + tW, dY2);

  currX = MARGIN;
  const labels = ['Prepared by', 'Reviewed by', 'Approved by', 'Received by'];
  const pNames = [order.plannerPreparedBy, order.plannerReviewedBy, order.plannerApprovedBy, order.plannerReceivedBy];
  const pDates = [order.plannerPreparedDate, order.plannerReviewedDate, order.plannerApprovedDate, order.plannerReceivedDate];

  labels.forEach((l, i) => {
    drawText(page2, l, currX + 3, py - 9, 7, true);
    drawText(page2, 'Name :', currX + 3, nY2 - 9, 6);
    drawText(page2, pNames[i] || '', currX + 30, nY2 - 9, 7);
    drawText(page2, 'Date :', currX + 3, dY2 - 9, 6);
    drawText(page2, pDates[i] || '', currX + 30, dY2 - 9, 7);
    currX += sW2;
  });

  py -= sigH2 + 15;

  // Footer Status
  drawLine(page2, MARGIN, py, PAGE_WIDTH - MARGIN, py);
  drawLine(page2, MARGIN, py - 2, PAGE_WIDTH - MARGIN, py - 2);
  
  py -= 15;
  drawText(page2, 'Date of Job Order completion :', MARGIN, py, S_TEXT);
  drawBox(page2, MARGIN + 140, py - 4, 120, 14);
  drawText(page2, order.completionDate, MARGIN + 145, py + 1, S_TEXT);

  drawText(page2, 'Quantity delivered :', MARGIN + 280, py, S_TEXT);
  drawBox(page2, MARGIN + 370, py - 4, 120, 14);
  drawText(page2, order.qtyDelivered, MARGIN + 375, py + 1, S_TEXT);

  py -= 20;
  drawText(page2, 'Status of Job Order:', MARGIN, py, S_TEXT);
  
  drawBox(page2, MARGIN + 140, py - 2, CB_W + 4, 14);
  if(order.finalStatus === 'Closed') drawTick(page2, MARGIN + 140, py - 2); 
  drawText(page2, 'Closed', MARGIN + 160, py + 2, S_TEXT);

  drawBox(page2, MARGIN + 280, py - 2, CB_W + 4, 14);
  if(order.finalStatus === 'Pending') drawTick(page2, MARGIN + 280, py - 2); 
  drawText(page2, 'Pending', MARGIN + 300, py + 2, S_TEXT);

  py -= 20;
  drawText(page2, 'Reason of pending :', MARGIN, py, S_TEXT);
  drawLine(page2, MARGIN + 100, py - 2, PAGE_WIDTH - MARGIN, py - 2);
  drawText(page2, order.pendingReason, MARGIN + 105, py, S_TEXT);

  return await pdfDoc.save();
};
