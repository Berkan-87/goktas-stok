// frontend/src/utils/exportUtils.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

// ============================
// 📊 EXCEL EXPORT - PROFESYONEL
// ============================
export const exportToExcel = (data, filename, sheetName = 'Rapor') => {
  try {
    if (!data || data.length === 0) {
      console.warn('⚠️ Export verisi boş!');
      return false;
    }

    // 1️⃣ Çalışma kitabı ve sayfası oluştur
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 2️⃣ Sütun genişliklerini hesapla
    const headers = Object.keys(data[0] || {});
    const colWidths = headers.map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 35) };
    });
    ws['!cols'] = colWidths;

    // 3️⃣ Başlık satırını biçimlendir (kalın, mavi arka plan, beyaz yazı, ortala)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) continue;
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
        fill: { fgColor: { rgb: '2F5597' } }, // Koyu mavi
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };
    }

    // 4️⃣ Veri satırlarını biçimlendir (ortala, kenarlık ekle)
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[addr]) continue;
        ws[addr].s = {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } }
          }
        };
      }
    }

    // 5️⃣ Çalışma sayfasını ekle
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 6️⃣ Dosyayı oluştur ve indir
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });
    const fullFilename = `${filename}.xlsx`;
    saveAs(blob, fullFilename);

    console.log('✅ Excel export başarılı! Dosya:', fullFilename);
    return true;
  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    // Fallback JSON indirme
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
      console.log('✅ Fallback ile JSON indirildi');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback de başarısız:', fallbackError);
      return false;
    }
  }
};

// ============================
// 📄 PDF EXPORT
// ============================
export const exportToPDF = (data, filename, title, columns) => {
  try {
    if (!data || data.length === 0) {
      console.warn('⚠️ Export verisi boş!');
      return false;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Başlık
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text(title || 'Rapor', pageWidth / 2, 15, { align: 'center' });

    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    const dateStr = new Date().toLocaleString('tr-TR');
    doc.text(`Oluşturulma Tarihi: ${dateStr}`, pageWidth / 2, 22, { align: 'center' });

    // Tablo verileri
    const tableData = data.map((row) => columns.map((col) => String(row[col.key] || '')));
    const tableHeaders = columns.map((col) => col.label);

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [47, 85, 151],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249]
      },
      margin: { left: 10, right: 10 },
      tableWidth: 'auto'
    });

    // Alt bilgi
    const finalY = doc.lastAutoTable.finalY || 200;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Göktaş Stok Yönetim Sistemi • ${dateStr}`,
      pageWidth / 2,
      finalY + 10,
      { align: 'center' }
    );

    doc.save(`${filename}.pdf`);
    console.log('✅ PDF export başarılı!');
    return true;
  } catch (error) {
    console.error('❌ PDF export hatası:', error);
    return false;
  }
};

// ============================
// 📦 VERİ HAZIRLAMA FONKSİYONLARI
// ============================
export const prepareModelOutgoingData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map((item) => ({
    Model: item.model || 'Belirsiz',
    'Çıkış (Adet)': item.quantity || 0,
    'Kalan Stok (Adet)': item.currentStock || 0,
    Durum: item.status || 'Belirsiz'
  }));
};

export const prepareBranchStockData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map((item) => ({
    Şube: item.branch || 'Belirsiz',
    'Stok (Adet)': item.stok || 0,
    'Yüzde (%)': item.percentage || 0
  }));
};

export const prepareLowStockData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map((item) => ({
    'Ürün Adı': item.productId?.name || 'Bilinmeyen',
    Şube: item.branch || 'Belirsiz',
    'Kalan Stok': item.quantity || 0,
    'Kritik Seviye': item.criticalLevel || 50,
    Durum: item.quantity <= 10 ? 'Kritik' : item.quantity <= 25 ? 'Uyarı' : 'Düşük'
  }));
};