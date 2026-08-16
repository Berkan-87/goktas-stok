// frontend/src/utils/exportUtils.js
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// ✅ saveAs'i doğrudan import et (file-saver'dan)
import { saveAs } from 'file-saver';

// ✅ Excel Export - DÜZELTİLDİ
export const exportToExcel = (data, filename, sheetName = 'Rapor') => {
  try {
    if (!data || data.length === 0) {
      console.warn('⚠️ Export verisi boş!');
      return false;
    }

    console.log('📊 Excel export başlıyor...', { dataLength: data.length, filename });

    // Excel çalışma kitabı oluştur
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Sütun genişliklerini ayarla
    const colWidths = [];
    const headers = Object.keys(data[0] || {});
    headers.forEach((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 30) });
    });
    worksheet['!cols'] = colWidths;

    // Excel dosyasını oluştur
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false
    });
    
    // Blob oluştur
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' 
    });
    
    // ✅ Dosyayı indir - saveAs ile
    const fullFilename = `${filename}.xlsx`;
    saveAs(blob, fullFilename);
    
    console.log('✅ Excel export başarılı! Dosya:', fullFilename);
    return true;
    
  } catch (error) {
    console.error('❌ Excel export hatası:', error);
    // ✅ Hata durumunda alternatif indirme yöntemi
    try {
      // Fallback: Manuel indirme
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log('✅ Fallback ile JSON olarak indirildi');
      return true;
    } catch (fallbackError) {
      console.error('❌ Fallback de başarısız:', fallbackError);
      return false;
    }
  }
};

// ✅ PDF Export - DÜZELTİLDİ
export const exportToPDF = (data, filename, title, columns) => {
  try {
    if (!data || data.length === 0) {
      console.warn('⚠️ Export verisi boş!');
      return false;
    }

    console.log('📄 PDF export başlıyor...', { dataLength: data.length, filename });

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

    // Tablo verilerini hazırla
    const tableData = data.map(row => columns.map(col => String(row[col.key] || '')));
    const tableHeaders = columns.map(col => col.label);

    // Tabloyu oluştur
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left'
      },
      headStyles: {
        fillColor: [59, 130, 246],
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

    // ✅ PDF'i kaydet
    const fullFilename = `${filename}.pdf`;
    doc.save(fullFilename);
    
    console.log('✅ PDF export başarılı! Dosya:', fullFilename);
    return true;
    
  } catch (error) {
    console.error('❌ PDF export hatası:', error);
    return false;
  }
};

// ✅ Veri hazırlama fonksiyonları
export const prepareModelOutgoingData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map(item => ({
    'Model': item.model || 'Belirsiz',
    'Çıkış (Adet)': item.quantity || 0,
    'Kalan Stok (Adet)': item.currentStock || 0,
    'Durum': item.status || 'Belirsiz'
  }));
};

export const prepareBranchStockData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map(item => ({
    'Şube': item.branch || 'Belirsiz',
    'Stok (Adet)': item.stok || 0,
    'Yüzde (%)': item.percentage || 0
  }));
};

export const prepareLowStockData = (data) => {
  if (!data || data.length === 0) return [];
  return data.map(item => ({
    'Ürün Adı': item.productId?.name || 'Bilinmeyen',
    'Şube': item.branch || 'Belirsiz',
    'Kalan Stok': item.quantity || 0,
    'Kritik Seviye': item.criticalLevel || 50,
    'Durum': item.quantity <= 10 ? 'Kritik' : item.quantity <= 25 ? 'Uyarı' : 'Düşük'
  }));
};