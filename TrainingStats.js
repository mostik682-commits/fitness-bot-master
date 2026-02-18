/**
 * ФІНАЛЬНИЙ ВАРІАНТ: Ізоляція днів через Колонку А.
 * Використання: =CALCULATE_TRAINING(A3:F1000; H3:H1000)
 * (Зверніть увагу: діапазон тепер починається з A3, а не B3)
 */
function CALCULATE_TRAINING(rangeAF, rangeH) {
  if (!rangeAF || !rangeAF.length) return "";
  
  var currentDayId = 0;
  var lastKnownName = ""; 
  
  // 1. ЕТАП: Обробка рядків
  var rows = rangeAF.map(function(row, i) {
    // Зсув індексів, оскільки ми додали колонку А
    var colA = String(row[0] || "").trim();      // Колонка A (День/Актуальний)
    var rawName = String(row[1] || "").trim();   // Колонка B (Назва вправи)
    var colD = String(row[3] || "").trim();      // Колонка D (Вага)
    var colE = String(row[4] || "").trim();      // Колонка E (Підходи)
    var colF = String(row[5] || "").trim();      // Колонка F (Повтори)
    var actualH = String((rangeH[i] && rangeH[i][0]) || "").trim(); // Колонка H (Факт)

    // ЛОГІКА ЗМІНИ ДНЯ: 
    // Якщо в колонці А написано "День" або це новий цикл -> починаємо новий відлік
    if (colA.toLowerCase().includes("день") || colA.toLowerCase().includes("day") || rawName.includes("Ц")) {
      currentDayId++;
      lastKnownName = ""; // Скидаємо назву вправи, щоб не протягнулась з минулого дня
    }
    
    // Додатковий розділювач: якщо рядок повністю порожній
    if (colA === "" && rawName === "" && colD === "" && actualH === "") {
      lastKnownName = ""; // Просто скидаємо назву
      return { isDivider: true };
    }

    // Логіка об'єднаних комірок (протягуємо назву вниз, якщо в B пусто)
    if (rawName !== "") { 
      lastKnownName = rawName; 
    } else {
      rawName = lastKnownName;
    }

    // Якщо назви все ще немає - це пустий рядок, пропускаємо
    if (rawName === "") return { isDivider: true };

    var isRun = rawName.toLowerCase().includes("біг") || rawName.toLowerCase().includes("розминка");
    var numericVal = 0;
    var unit = isRun ? "км" : "";

    // Визначаємо одиницю виміру (м/км)
    var unitSource = (actualH !== "") ? actualH : (colF || colD);
    if (isRun) {
      unit = (unitSource.toLowerCase().includes("м") && !unitSource.toLowerCase().includes("км")) ? "м" : "км";
    }

    // ОЧИЩЕННЯ ТА ПАРСИНГ ЧИСЕЛ
    var targetText = (actualH !== "") ? actualH : (colD + " " + colE + " " + colF);
    // Видаляємо відсотки
    var cleanText = targetText.replace(/\d+%/g, "").replace("%", "");
    
    // Функція для пошуку чисел (підтримує 10+10)
    var getNumbers = function(text) {
      var parts = text.match(/(\d+[.,]?\d*(\+\d+[.,]?\d*)*)/g) || [];
      return parts.map(function(p) {
        if (p.includes('+')) {
          return p.split('+').reduce(function(acc, v) { return acc + parseFloat(v.replace(',', '.')); }, 0);
        }
        return parseFloat(p.replace(',', '.'));
      });
    };

    var nums = getNumbers(cleanText);

    if (isRun) {
      // Біг: множимо (напр. 3 відрізки * 400м)
      numericVal = (nums.length >= 2) ? nums[0] * nums[1] : (nums[0] || 0);
    } else {
      // Сила: Вага * Підходи * Повтори
      if (nums.length >= 3) numericVal = nums[0] * nums[1] * nums[2];
      else if (nums.length === 2) numericVal = nums[0] * nums[1];
      else numericVal = nums[0] || 0;
    }

    return { name: rawName, val: numericVal, dayId: currentDayId, isRun: isRun, unit: unit, isDivider: false };
  });

  // 2. ЕТАП: Підсумок (Сумуємо тільки якщо назва І номер дня збігаються)
  return rows.map(function(row, i, all) {
    if (row.isDivider || !row.val || row.val === 0) return "";

    if (row.isRun) {
      return row.val + " " + row.unit;
    } else {
      var dailyTotal = all.reduce(function(acc, r) {
        return (r.name === row.name && r.dayId === row.dayId) ? acc + r.val : acc;
      }, 0);
      
      return Math.round(row.val) + " | Всього: " + Math.round(dailyTotal);
    }
  });
}