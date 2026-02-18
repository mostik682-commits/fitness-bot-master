function openNutritionSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('NutritionSidebar')
      .setTitle('🥗 Статистика Харчування')
      .setWidth(340); // Трохи ширше для зручності
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Отримує дані харчування.
 * @param {string} viewMode - 'week' (поточний тиждень) або 'month' (поточний місяць)
 */
function getNutritionDataForSidebar(viewMode) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheetName = ss.getActiveSheet().getName();
  
  // 1. Знаходимо ID клієнта
  var usersSheet = ss.getSheetByName("users");
  if (!usersSheet) return { error: "Лист 'users' не знайдено" };
  
  var uData = usersSheet.getDataRange().getValues();
  var targetUserId = null;
  var targetName = "";
  
  for (var i = 1; i < uData.length; i++) {
    if (String(uData[i][2]).trim() === currentSheetName || String(uData[i][4]).trim() === currentSheetName) {
      targetUserId = String(uData[i][0]).trim(); 
      targetName = uData[i][1]; 
      break;
    }
  }
  
  if (!targetUserId) return { error: "Цей лист не прив'язаний до клієнта." };

  // 2. Отримуємо дані з Nutrition
  var nutriSheet = ss.getSheetByName("Nutrition");
  if (!nutriSheet) return { error: "Лист 'Nutrition' не знайдено." };
  
  var nData = nutriSheet.getDataRange().getValues();
  
  // 3. Визначаємо дати старту і кінця
  var today = new Date();
  var startDate = new Date(today);
  var endDate = new Date(today);
  
  // Налаштування періоду
  if (viewMode === 'month') {
    // З 1-го числа місяця до кінця місяця
    startDate.setDate(1);
    startDate.setHours(0,0,0,0);
    
    // Кінець поточного місяця
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); 
    endDate.setHours(23,59,59,999);
  } else {
    // ПО ЗАМОВЧУВАННЮ: Тиждень (Пн - Нд)
    var day = today.getDay() || 7; 
    startDate.setDate(today.getDate() - day + 1); // Понеділок
    startDate.setHours(0,0,0,0);
    
    endDate.setDate(startDate.getDate() + 6); // Неділя
    endDate.setHours(23,59,59,999);
  }

  // 4. Генеруємо структуру дат
  var statsMap = {};
  var result = [];
  var loopDate = new Date(startDate);
  
  // Створюємо порожні слоти для кожного дня періоду
  while (loopDate <= endDate) {
    var key = Utilities.formatDate(loopDate, ss.getSpreadsheetTimeZone(), "dd.MM");
    
    // Label: Для тижня "Пн", для місяця просто число "01"
    var label = (viewMode === 'month') 
      ? Utilities.formatDate(loopDate, ss.getSpreadsheetTimeZone(), "dd") 
      : ["Нд","Пн","Вт","Ср","Чт","Пт","Сб"][loopDate.getDay()];

    statsMap[key] = {
      label: label,
      date: key,
      kcal: 0, p: 0, f: 0, c: 0, fiber: 0,
      count: 0 // скільки записів було (для перевірки чи пустий день)
    };
    
    // +1 день
    loopDate.setDate(loopDate.getDate() + 1);
  }

  // 5. Заповнюємо даними
  for (var i = 1; i < nData.length; i++) {
    if (String(nData[i][0]).trim() !== targetUserId) continue;
    
    var rowDate = nData[i][2];
    if (!(rowDate instanceof Date)) continue; 
    
    if (rowDate >= startDate && rowDate <= endDate) {
      var key = Utilities.formatDate(rowDate, ss.getSpreadsheetTimeZone(), "dd.MM");
      if (statsMap[key]) {
        statsMap[key].kcal += Number(nData[i][5]) || 0;
        statsMap[key].p += Number(nData[i][6]) || 0;
        statsMap[key].f += Number(nData[i][7]) || 0;
        statsMap[key].c += Number(nData[i][8]) || 0;
        statsMap[key].fiber += Number(nData[i][9]) || 0;
        statsMap[key].count++;
      }
    }
  }

  // 6. Формуємо масив результатів та рахуємо середнє
  var totalSum = { kcal: 0, p: 0, f: 0, c: 0, fiber: 0 };
  var activeDays = 0; // Дні, коли хоч щось їли

  for (var k in statsMap) {
    var d = statsMap[k];
    
    // Округляємо день
    d.kcal = Math.round(d.kcal);
    d.p = Math.round(d.p);
    d.f = Math.round(d.f);
    d.c = Math.round(d.c);
    d.fiber = Math.round(d.fiber);
    
    result.push(d);

    // Додаємо до суми для середнього (тільки якщо день не пустий)
    if (d.kcal > 0) {
      totalSum.kcal += d.kcal;
      totalSum.p += d.p;
      totalSum.f += d.f;
      totalSum.c += d.c;
      totalSum.fiber += d.fiber;
      activeDays++;
    }
  }

  // Рахуємо середні
  var averages = { kcal: 0, p: 0, f: 0, c: 0, fiber: 0 };
  if (activeDays > 0) {
    averages.kcal = Math.round(totalSum.kcal / activeDays);
    averages.p = Math.round(totalSum.p / activeDays);
    averages.f = Math.round(totalSum.f / activeDays);
    averages.c = Math.round(totalSum.c / activeDays);
    averages.fiber = Math.round(totalSum.fiber / activeDays);
  }

  return { 
    client: targetName, 
    data: result,
    averages: averages,
    periodLabel: (viewMode === 'month') ? "Поточний місяць" : "Поточний тиждень"
  };
}