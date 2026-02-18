/**
 * Генерує повний звіт про структуру таблиць та налаштування бота
 */
function generateFullProjectReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  var report = "🚀 ЗВІТ ПО АРХІТЕКТУРІ БОТА\n";
  report += "====================================\n\n";
  
  report += "📂 ТАБЛИЦІ ТА КОЛОНКИ:\n";
  
  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    var lastCol = sheet.getLastColumn();
    var headers = (lastCol > 0) ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : ["Порожньо"];
    
    report += "📄 Лист: [" + name + "]\n";
    report += "   🔹 Кількість колонок: " + lastCol + "\n";
    report += "   🔹 Заголовки: " + headers.join(" | ") + "\n";
    report += "------------------------------------\n";
  });
  
  report += "\n⚙️ СИСТЕМНІ НАЛАШТУВАННЯ (Properties):\n";
  var props = PropertiesService.getScriptProperties().getKeys();
  props.forEach(function(key) {
    if (key.indexOf("KEY") === -1 && key.indexOf("TOKEN") === -1) { // Не світимо ключі
       report += "   ✅ " + key + "\n";
    }
  });

  report += "\n✅ Звіт сформовано успішно.";
  
  Logger.log(report);
  // Можна також відправити це собі в Телеграм:
  // sendMessage(ADMIN_ID, report); 
}