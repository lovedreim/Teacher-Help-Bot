const XLSX = require('xlsx');

function readExcelFromBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
    return data;
}

module.exports = { readExcelFromBuffer };
