// ============================================================================
// 🏋️‍♂️ GYM CRM: REALITY CHECK (FACT > PLAN)
// ============================================================================

// ============================================================================
// ⚙️ ГОЛОВНЕ МЕНЮ
// ============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🏋️‍♂️ GYM CRM')
      .addItem('➕ Наступний День', 'addNextDay')
      .addItem('🔄 Новий Тиждень / Цикл', 'startNextCycle')
      .addSeparator()
      .addItem('📊 Панель Тренування', 'openStatsSidebar')
      .addItem('🥗 Статистика Харчування', 'openNutritionSidebar')
      .addItem('📏 Динаміка Замірів', 'openBodyStatsSidebar')
      .addItem('📋 КАРТКА КЛІЄНТА', 'openAnketaSidebar')
      .addSeparator()
      .addItem('🔄 Оновити НАВІГАЦІЮ', 'updateNavigationSheet')
      .addItem('🔄 СИНХРОНІЗУВАТИ ПИТАННЯ', 'syncAnketaHeaders')
      .addToUi();
}

// ============================================================================
// 🗂 МОДУЛЬ НАВІГАЦІЇ (Створює вкладку з посиланнями)
// ============================================================================

function updateNavigationSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName("users"); 
  var navSheetName = "🗂 НАВІГАЦІЯ";
  var navSheet = ss.getSheetByName(navSheetName);

  // 1. Створюємо лист, якщо його немає, і ставимо першим
  if (!navSheet) {
    navSheet = ss.insertSheet(navSheetName, 0);
  } else {
    navSheet.clear();
    try { 
      if (navSheet.getIndex() !== 1) ss.setActiveSheet(navSheet).moveActiveSheet(1); 
    } catch(e){}
  }

  // 2. Малюємо красиву шапку
  var headerRange = navSheet.getRange("A1:C1");
  headerRange.setValues([["👤 КЛІЄНТ", "🏋️ СИЛОВА ПРОГРАМА", "🏃 БІГОВА ПРОГРАМА"]]);
  headerRange.setFontWeight("bold")
             .setBackground("#1155cc") // Синій фон
             .setFontColor("white")
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");
  
  navSheet.setRowHeight(1, 40);
  navSheet.setColumnWidth(1, 200); // Ширина колонки імен
  navSheet.setColumnWidth(2, 250); // Ширина силових
  navSheet.setColumnWidth(3, 250); // Ширина бігових

  // 3. Беремо список клієнтів з листа 'users'
  var lastRow = usersSheet.getLastRow();
  if (lastRow < 2) {
    navSheet.getRange("A2").setValue("⚠️ Список клієнтів порожній.");
    return;
  }
  
  // Читаємо колонки: B (Ім'я), C (Силові), E (Біг)
  var usersData = usersSheet.getRange(2, 1, lastRow - 1, 5).getValues();
  var output = [];

  for (var i = 0; i < usersData.length; i++) {
    var name = usersData[i][1];      
    var gymSheetName = usersData[i][2]; 
    var runSheetName = usersData[i][4]; 
    
    if (!name || String(name).trim() === "") continue;

    // --- Посилання на СИЛОВІ ---
    var gymLink = "—";
    if (gymSheetName && String(gymSheetName).length > 1) {
       var targetSheet = ss.getSheetByName(gymSheetName);
       if (targetSheet) {
         // 🔥 ГЕНЕРУЄМО ПОСИЛАННЯ (HYPERLINK)
         var gid = targetSheet.getSheetId();
         gymLink = '=HYPERLINK("#gid=' + gid + '"; "🔗 ' + gymSheetName + '")';
       } else {
         gymLink = "❌ Не створено";
       }
    }

    // --- Посилання на БІГОВІ ---
    var runLink = "—";
    if (runSheetName && String(runSheetName).length > 1) {
       var targetSheet = ss.getSheetByName(runSheetName);
       if (targetSheet) {
         var gid = targetSheet.getSheetId();
         runLink = '=HYPERLINK("#gid=' + gid + '"; "🔗 ' + runSheetName + '")';
       } else {
         runLink = "❌ Не створено";
       }
    }

    output.push([name, gymLink, runLink]);
  }

  // 4. Записуємо все в таблицю
  if (output.length > 0) {
    var range = navSheet.getRange(2, 1, output.length, 3);
    range.setValues(output);
    range.setVerticalAlignment("middle");
    // Малюємо рамки
    range.setBorder(true, true, true, true, true, true, "#d9d9d9", SpreadsheetApp.BorderStyle.SOLID);
    navSheet.setRowHeights(2, output.length, 30);
  }
  
  // Закріплюємо шапку і прибираємо сітку
  navSheet.setFrozenRows(1);
  navSheet.setHiddenGridlines(true);
}

function TEST_CELL_VALUE() {
  // 1. Беремо значення з активної клітинки таблиці
  var cellValue = SpreadsheetApp.getActiveRange().getValue();
  
  // 2. Виводимо, що бачить скрипт "сирим"
  Logger.log("RAW VALUE (Що в клітинці): " + cellValue);
  
  // 3. Пробуємо розпарсити вашою функцією
  var result = parseNumber(cellValue);
  
  // 4. Виводимо результат
  Logger.log("PARSED RESULT (Що бачить код): " + result);
  
  if (result > 10) {
    Logger.log("✅ УСПІХ! Скрипт бачить вагу.");
  } else {
    Logger.log("❌ ПРОВАЛ! Скрипт бачить коефіцієнт (0.7).");
  }
}
function TEST_ReadColumnH() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  
  Logger.log("=== ТЕСТ ЧИТАННЯ КОЛОНКИ H ===");
  Logger.log("Активний рядок: " + row);
  
  // Читаємо як текст (getDisplayValues)
  var displayValue = sheet.getRange(row, 8).getDisplayValue();
  Logger.log("Колонка H (display): [" + displayValue + "]");
  
  // Читаємо як значення (getValue)
  var rawValue = sheet.getRange(row, 8).getValue();
  Logger.log("Колонка H (raw): [" + rawValue + "]");
  
  // Парсимо
  if (displayValue && displayValue !== "") {
    Logger.log("--- ПАРСИНГ ---");
    
    // Шукаємо вагу в дужках
    var weightMatch = displayValue.match(/\(([\d.]+)\s*кг?\)/i);
    if (weightMatch) {
      Logger.log("Вага знайдена: " + weightMatch[1] + " кг");
    }
    
    // Шукаємо підходи x повтори
    var setsRepsMatch = displayValue.match(/(\d+)\s*[xх]\s*(\d+)/i);
    if (setsRepsMatch) {
      Logger.log("Підходи: " + setsRepsMatch[1]);
      Logger.log("Повтори: " + setsRepsMatch[2]);
    }
    
    // Рахуємо тонаж
    if (weightMatch && setsRepsMatch) {
      var tonnage = parseFloat(weightMatch[1]) * parseInt(setsRepsMatch[1]) * parseInt(setsRepsMatch[2]);
      Logger.log("Тонаж: " + tonnage + " кг");
    }
  } else {
    Logger.log("❌ Колонка H порожня!");
  }
}
