// ============================================================================
// 📏 BODY STATS SYSTEM (Динамічні заміри)
// ============================================================================

// 1. Функція для отримання конфігурації (які поля показувати + старі дані)
function getBodyStatsConfigForUser(userId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("BodyStats");
  
  // Якщо листа немає - створюємо його з базовою структурою
  if (!sheet) {
    sheet = ss.insertSheet("BodyStats");
    // Базові колонки. Ти можеш змінити/додати свої прямо в таблиці пізніше
    sheet.appendRow(["Дата", "TelegramID", "Ім'я", "Вага (кг)", "Талія (см)", "Стегна (см)", "Груди (см)"]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e0e0e0");
    sheet.setFrozenRows(1);
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Читаємо заголовки (Рядок 1) - це і будуть наші поля
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  
  // Шукаємо попередні заміри цього клієнта (йдемо знизу вверх)
  var previousData = {};
  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      // Порівнюємо ID (припускаємо, що ID в колонці B, індекс 1)
      if (String(data[i][1]) === String(userId)) {
        // Знайшли останній запис!
        for (var col = 3; col < headers.length; col++) {
          previousData[col] = data[i][col];
        }
        break; 
      }
    }
  }

  // Формуємо список полів для Web App (пропускаємо системні: Дата, ID, Ім'я)
  var fields = [];
  for (var i = 3; i < headers.length; i++) {
    fields.push({
      index: i,
      label: headers[i],
      prevValue: previousData[i] || "" // Якщо є старе значення, передаємо
    });
  }

  // Знаходимо ім'я клієнта з бази users (для краси)
  var clientName = "Клієнт";
  var usersSheet = ss.getSheetByName("users");
  if (usersSheet) {
    var uData = usersSheet.getDataRange().getValues();
    for (var j = 1; j < uData.length; j++) {
      if (String(uData[j][0]) === String(userId)) {
        clientName = uData[j][1];
        break;
      }
    }
  }

  return { fields: fields, clientName: clientName };
}

// 2. Функція збереження даних
function saveBodyStats(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("BodyStats");
  
  if (!sheet) return { status: "error", msg: "Лист BodyStats видалено!" };

  var lastCol = sheet.getLastColumn();
  var newRow = new Array(lastCol).fill(""); // Створюємо пустий рядок

  // Заповнюємо системні поля
  newRow[0] = new Date(); // Дата
  newRow[1] = formData.userId; // ID
  newRow[2] = formData.userName; // Ім'я

  // Заповнюємо заміри
  // formData.values прийде як об'єкт { "3": "80", "4": "95" ... } де ключ - індекс колонки
  for (var key in formData.values) {
    var colIndex = parseInt(key);
    if (colIndex < lastCol) {
      newRow[colIndex] = formData.values[key]; // Пишемо значення в правильну колонку
    }
  }

  sheet.appendRow(newRow);
  return { status: "success", msg: "✅ Дані збережено!" };
}

// 3. Тестова функція для запуску з редактора (імітує відкриття)
function testBodyStats() {
  // Заміни на реальний ID для тесту
  var html = HtmlService.createHtmlOutputFromFile('MeasurementsView')
      .setTitle('Внесення замірів')
      .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}
// ============================================================================
// 🌐 УНІВЕРСАЛЬНИЙ DO GET (МАРШРУТИЗАТОР) - ФІНАЛЬНА ВЕРСІЯ
// ============================================================================

// Функція для відкриття сайдбару із замірами
function openBodyStatsSidebar() {
  var html = HtmlService.createTemplateFromFile('BodyStatsSidebar')
      .evaluate()
      .setTitle('📊 Динаміка замірів тіла')
      .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

// Отримання даних для графіка та таблиці (викликається з HTML)
function getClientBodyStatsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("BodyStats");
  if (!sheet) return { status: "error", msg: "Лист BodyStats не знайдено" };

  var activeSheet = ss.getActiveSheet();
  var activeCell = activeSheet.getActiveCell();
  var activeRow = activeCell.getRow();
  
  // Намагаємось знайти Telegram ID клієнта в поточному листі (припускаємо, що він у клітинці A2 або подібній)
  // Для простоти: ми беремо ID клієнта з виділеного рядка, якщо ми на листі "users"
  var userId = "";
  if (activeSheet.getName() === "users") {
    userId = activeSheet.getRange(activeRow, 1).getValue();
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var clientStats = [];

  for (var i = 1; i < data.length; i++) {
    // Якщо userId не визначено - показуємо останні 20 записів взагалі
    // Якщо визначено - тільки цього клієнта
    if (!userId || String(data[i][1]) === String(userId)) {
      var row = {};
      headers.forEach((h, index) => {
        row[h] = data[i][index];
        if (h === "Дата" && data[i][index] instanceof Date) {
          row[h] = Utilities.formatDate(data[i][index], "GMT+2", "dd.MM");
        }
      });
      clientStats.push(row);
    }
  }

  // Повертаємо заголовки (крім системних) та дані
  return { 
    headers: headers.slice(3), // Тільки заміри
    stats: clientStats.slice(-15), // Останні 15 записів
    clientName: userId ? "Клієнт ID: " + userId : "Останні заміри (всі)"
  };
}