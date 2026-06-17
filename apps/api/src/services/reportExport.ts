import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export type ReportRentalRow = {
  customerName: string;
  phoneNumber: string;
  scooterNumber: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  totalPrice: number;
};

export const buildRevenueExcel = async (
  rows: ReportRentalRow[],
  meta: { title: string; totalRevenue: number; rentalCount: number }
) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Revenue");

  sheet.columns = [
    { header: "Customer Name", key: "customerName", width: 28 },
    { header: "Phone Number", key: "phoneNumber", width: 18 },
    { header: "Scooter Number", key: "scooterNumber", width: 18 },
    { header: "Start Time", key: "startTime", width: 24 },
    { header: "End Time", key: "endTime", width: 24 },
    { header: "Duration (Minutes)", key: "durationMinutes", width: 18 },
    { header: "Total Price (ETB)", key: "totalPrice", width: 18 }
  ];

  sheet.addRow([meta.title]);
  sheet.addRow([`Rentals: ${meta.rentalCount}`]);
  sheet.addRow([`Revenue (ETB): ${meta.totalRevenue}`]);
  sheet.addRow([]);
  sheet.addRows(
    rows.map((row) => ({
      ...row,
      startTime: row.startTime.toLocaleString(),
      endTime: row.endTime.toLocaleString()
    }))
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

export const buildRevenuePdf = (rows: ReportRentalRow[], meta: { title: string; totalRevenue: number; rentalCount: number }) =>
  new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text(meta.title);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Rentals: ${meta.rentalCount}`);
    doc.text(`Revenue (ETB): ${meta.totalRevenue}`);
    doc.moveDown();

    rows.forEach((row, index) => {
      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${row.customerName} | ${row.phoneNumber} | Scooter ${row.scooterNumber} | ${row.durationMinutes} min | ETB ${row.totalPrice}`
        );
      doc.text(`Start: ${row.startTime.toLocaleString()} | End: ${row.endTime.toLocaleString()}`);
      doc.moveDown(0.35);
    });

    doc.end();
  });
