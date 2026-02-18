// ============================================================================
// 🏋️‍♂️ GYM CRM: REALITY CHECK (FACT > PLAN)
// ============================================================================


// Ця функція запускає новий файл AnketaView.html
function openAnketaSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('AnketaView')
      .setTitle('Анкета Клієнта')
      .setWidth(300);
  SpreadsheetApp.getUi().showSidebar(html);
}

function openStatsSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Панель Тренера')
      .setWidth(320); 
  SpreadsheetApp.getUi().showSidebar(html);
}

function getSelectedExerciseData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var sheetName = sheet.getName();
  
  if (["users", "warmup", "Settings", "список вправ"].includes(sheetName)) return { status: "system_sheet" };
  
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return { status: "header" };
  
  var fullData = sheet.getDataRange().getDisplayValues();
  
  var exerciseName = "";
  for (var i = row - 1; i >= 0; i--) {
    if (fullData[i][1] !== "" && !String(fullData[i][1]).match(/^ц\s*\d+/i)) {
      exerciseName = fullData[i][1];
      break;
    }
  }
  
  if (!exerciseName) return { status: "no_selection" };

  var exercisesDB = getExercisesDatabase(); 
  var cleanName = String(exerciseName).toLowerCase().trim();
  var category = exercisesDB[cleanName] || (cleanName.includes("біг") ? 'RUN' : 'STRENGTH');
  var currentType = (category === 'RUN') ? 'run' : 'strength';
  
  var history = getHistoryFromData(fullData, exerciseName, currentType); 
  
  var rawFact = String(fullData[row-1][7] || ""); // Колонка H (Факт)
  var rawPlan = String(fullData[row-1][3] || ""); // Колонка D (План)
  
  // 🔥 УНІВЕРСАЛЬНА ЛОГІКА: шукаємо і відсоток, і вагу
  var currentIntensity = 0;
  var displayText = "";
  
  var source = (rawFact && rawFact !== "") ? rawFact : rawPlan;
  
  // Перевіряємо чи є відсотки
  var hasPercent = source.includes("%");
  
  if (hasPercent) {
    // Є відсотки - витягуємо їх
    var percentMatch = source.match(/([\d.]+)%/);
    if (percentMatch) {
      var percent = parseFloat(percentMatch[1]);
      currentIntensity = (percent <= 1.5) ? Math.round(percent * 100) : percent;
    }
    
    // Шукаємо вагу в дужках
    var weightMatch = source.match(/\(([\d.]+)\s*кг?\)/i);
    if (weightMatch) {
      var weight = parseFloat(weightMatch[1]);
      displayText = currentIntensity + "% (" + weight + " кг)";
    } else {
      displayText = currentIntensity + "%";
    }
  } else {
    // Немає відсотків - звичайна вага
    currentIntensity = parseNumber(source, category);
    displayText = currentIntensity + " кг";
  }

  return { 
    status: "success", 
    type: currentType, 
    name: exerciseName, 
    history: (currentType === 'run' ? history.run : history.kg),
    runStats: (currentType === 'run' ? calculateRunZones(history.run) : null),
    globalStats: calculatePeriodStats(fullData, row, currentType, exercisesDB),
    currentIntensity: currentIntensity,
    displayText: displayText
  };
}
// 🔥 КЕШОВАНА ВЕРСІЯ БАЗИ ВПРАВ
function getExercisesDatabaseCached() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("exercisesDB");
  
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }
  
  var db = getExercisesDatabase();
  try { cache.put("exercisesDB", JSON.stringify(db), 300); } catch(e) {} // 5 хвилин
  return db;
}

function getHistoryFromData(data, targetName, type) {
  var resultKg = [], resultRun = [];
  var cleanStr = function(s) { return String(s || "").toLowerCase().replace(/\s+/g, " ").trim(); };
  var cleanTarget = cleanStr(targetName);
  var curCycle = "", curDay = "";
  
  var currentExerciseName = "";
  var strengthByDay = {}; 
  var runGroups = {}; 

  for (var i = 0; i < data.length; i++) {
    var cellA = String(data[i][0]).trim(); 
    var cellB = String(data[i][1]).trim(); 
    
    if (cellB.match(/^ц\s*\d+/i)) { 
      curCycle = cellB; 
      currentExerciseName = ""; 
      continue; 
    }
    if (cellA.match(/^ц\s*\d+/i)) { 
      curCycle = cellA; 
    }
    
    if (cellA.toLowerCase().includes("день")) {
      curDay = cellA.replace("№", "").replace("День", "Д").trim();
    }

    if (cellB !== "" && !cellB.match(/^ц\s*\d+/i)) { 
      currentExerciseName = cleanStr(cellB); 
    }
    
    if (currentExerciseName !== cleanTarget) continue;

    var label = (curCycle + " " + curDay).trim() || "Старт";
    
    var rawW = String(data[i][3] || "").trim(); 
    var rawS = String(data[i][4] || "").trim(); 
    var rawR = String(data[i][5] || "").trim(); 
    var rawFact = String(data[i][7] || "").trim(); // Колонка H

    if (rawW === "" && rawS === "" && rawR === "") continue;

    var finalW = rawW, finalS = rawS, finalR = rawR;
    var displayText = "";

    // 🔥 НОВИЙ ПАРСИНГ: обробляємо ОБА формати
    if (rawFact !== "") {
      // Формат 1: "70% (80кг) 3 x 56"
      // Формат 2: "70% | 3 x 56"
      
      if (rawFact.includes("|")) {
        // Старий формат з вертикальною рискою
        var parts = rawFact.split("|");
        finalW = parts[0].trim();
        var sr = parts[1].toLowerCase().split(/x|х/);
        finalS = sr[0] ? sr[0].trim() : rawS;
        finalR = sr[1] ? sr[1].trim() : rawR;
      } else {
        // Новий формат: "70% (80кг) 3 x 56"
        
        // Шукаємо підходи x повтори
        var setsRepsMatch = rawFact.match(/(\d+)\s*[xх]\s*([\d.]+)/i);
        if (setsRepsMatch) {
          finalS = setsRepsMatch[1];
          finalR = setsRepsMatch[2];
        }
        
        // Для displayText беремо все до "3 x 56"
        if (setsRepsMatch) {
          var beforeSets = rawFact.substring(0, rawFact.indexOf(setsRepsMatch[0])).trim();
          displayText = beforeSets; // "70% (80кг)"
          finalW = beforeSets;
        } else {
          displayText = rawFact;
          finalW = rawFact;
        }
      }
    }

    // --- ЛОГІКА ДЛЯ СИЛОВИХ ---
    if (type === 'strength') {
      var weight = 0;
      
      // Витягуємо вагу з дужок: "(80кг)"
      var weightMatch = finalW.match(/\(([\d.]+)\s*кг?\)/i);
      if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
      } else {
        // Якщо дужок немає, пробуємо parseNumber
        weight = parseNumber(finalW, "STRENGTH");
      }
      
      var sets = parseNumber(finalS);
      var reps = parseNumber(finalR);
      
      // Формуємо displayText для історії
      if (!displayText) {
        if (finalW.includes("%")) {
          displayText = finalW; // "70% (80кг)" або "70%"
        } else if (weight > 0) {
          displayText = weight + " кг";
        } else {
          displayText = finalW || "—";
        }
      }
      
      strengthByDay[label] = { 
        label: label, 
        note: String(data[i][8] || ""), 
        weight: weight,
        displayText: displayText,
        sets: sets || finalS, 
        reps: reps || finalR 
      };
    } 
    
    // --- ЛОГІКА ДЛЯ БІГУ ---
    else if (type === 'run') {
      var intens = parseNumber(finalW, "RUN");
      if (intens > 0 && intens <= 1.5) intens = Math.round(intens * 100);
      
      var s = parseNumber(finalS) || 1;
      var d = parseDistanceToKm(finalR);
      var rowKm = s * d;

      var groupKey = label + "_" + intens;

      if (!runGroups[groupKey]) {
        runGroups[groupKey] = { 
          label: label, 
          intensity: intens, 
          totalDistance: 0, 
          note: String(data[i][8] || "")
        };
      }
      runGroups[groupKey].totalDistance += rowKm;
    }
  }

  // Формування результату
  if (type === 'strength') {
    var dayOrder = Object.keys(strengthByDay);
    for (var j = 0; j < dayOrder.length; j++) {
      resultKg.push(strengthByDay[dayOrder[j]]);
    }
  } 
  else {
    for (var key in runGroups) {
      var g = runGroups[key];
      if (g.totalDistance > 0) {
        resultRun.push({
          label: g.label,
          intensity: g.intensity,
          distance: parseFloat(g.totalDistance.toFixed(2)),
          rawDist: g.totalDistance.toFixed(2) + " км",
          note: g.note
        });
      }
    }
  }

  return { kg: resultKg, run: resultRun };
}
/**
 * 🔥 РОЗУМНИЙ ПАРСИНГ ЧИСЕЛ З КОНТЕКСТОМ
 * @param {string} val - Текст для парсингу ("70% (80кг)", "90%", "45")
 * @param {string} exerciseType - Тип вправи: "STRENGTH" або "RUN" (опціонально)
 * @returns {number} - Число для використання
 */
function parseNumber(val, exerciseType) {
  if (!val) return 0;
  var str = String(val).replace(",", ".").trim();
  
  // 🔥 ПРІОРИТЕТ 1: Для силових вправ - число в дужках
  if (exerciseType === "STRENGTH") {
    var bracketMatch = str.match(/\(([\d.]+)/);
    if (bracketMatch) {
      return parseFloat(bracketMatch[1]);
    }
  }
  
  // 🔥 ПРІОРИТЕТ 2: Для бігу - відсотки (перетворюємо на число 0-100)
  if (exerciseType === "RUN" && str.includes("%")) {
    var percentMatch = str.match(/([\d.]+)%/);
    if (percentMatch) {
      var num = parseFloat(percentMatch[1]);
      return (num <= 1.5) ? Math.round(num * 100) : num;
    }
  }
  
  // 🔥 ПРІОРИТЕТ 3: Звичайне число
  var plainMatch = str.match(/([\d.]+)/);
  if (plainMatch) {
    var num = parseFloat(plainMatch[1]);
    if (str.includes("%")) {
      return (num <= 1.5) ? Math.round(num * 100) : num;
    }
    return num;
  }
  
  return 0;
}
/**
 * 🔥 Допоміжна функція: правильно розпізнає "1600 м", "2 км", "400"
 */
function parseDistanceToKm(val) {
  var str = String(val).toLowerCase().replace(",", ".").trim();
  if (!str || str === "") return 0;
  
  // Витягуємо тільки число
  var numMatch = str.match(/(\d+(\.\d+)?)/);
  if (!numMatch) return 0;
  var num = parseFloat(numMatch[0]);
  
  // Якщо вказано "м" або число дуже велике (більше 50) — вважаємо, що це метри
  if (str.includes("м") || num > 50) return num / 1000;
  return num; // Вважаємо, що це вже км
}


// --- ПІДРАХУНОК СТАТИСТИКИ (ФАКТ МАЄ ПРІОРИТЕТ) ---
function calculatePeriodStats(data, activeRow, type, db) {
  var lastRow = data.length;
  var regexCycle = /Ц\s*(\d+)\s*Т\s*(\d+)/i; 
  var regexDay = /День\s*№?/i;
  
  var currentDayLabel = "Д?", currentWeekLabel = "Т?", targetCycleNum = null;
  
  // Знаходимо межі поточного дня
  var dayStart = -1;
  for (var i = activeRow - 1; i >= 0; i--) { 
    if (regexDay.test(String(data[i][0]))) { 
      dayStart = i; 
      currentDayLabel = data[i][0]; 
      break; 
    } 
  }
  if (dayStart === -1) dayStart = activeRow;
  
  // Знаходимо межі поточного тижня/циклу
  var weekStart = -1;
  for (var i = activeRow - 1; i >= 0; i--) { 
    var m = (String(data[i][1]) + String(data[i][0])).match(regexCycle); 
    if (m) { 
      weekStart = i; 
      targetCycleNum = m[1]; 
      currentWeekLabel = "Т" + m[2]; 
      break;
    } 
  }
  if (weekStart === -1) weekStart = 0;
  
  var dayEnd = lastRow; 
  for (var i = dayStart + 1; i < lastRow; i++) { 
    if (regexDay.test(String(data[i][0])) || String(data[i][1]).match(/^ц\s*\d+/i)) {
      dayEnd = i; 
      break;
    } 
  }
  
  var weekEnd = lastRow; 
  for (var i = weekStart + 1; i < lastRow; i++) { 
    if (regexCycle.test(String(data[i][1]) + String(data[i][0]))) {
      weekEnd = i; 
      break;
    } 
  }

  var stats = { 
    day: 0, week: 0, cycle: 0, 
    dLabel: currentDayLabel, wLabel: currentWeekLabel, cLabel: (targetCycleNum ? "Ц" + targetCycleNum : "Ц?"),
    cycleZones: { "Z1": 0, "Z2": 0, "Z3": 0, "Z4": 0, "Z5": 0 }
  };
  
  var scanningCycleNum = null;
  var currentExerciseName = "";
  
  

  

  // ДРУГИЙ ПРОХІД: рахуємо статистику
  scanningCycleNum = null;
  currentExerciseName = "";
  

  for (var i = 1; i < lastRow; i++) {
    var cellA = String(data[i][0]).trim();
    var cellB = String(data[i][1]).trim();
    var rowStr = cellB + " " + cellA;
    
    var matchHead = rowStr.match(regexCycle);
    if (matchHead) { 
      scanningCycleNum = matchHead[1]; 
      currentExerciseName = ""; 
      continue; 
    }
    
    

    if (cellB && cellB.length >= 2 && !cellB.match(/^ц\s*\d+/i)) {
      currentExerciseName = cellB.toLowerCase().trim();
    }
    
    var cellD = String(data[i][3]).trim();
    if (cellD === "" || !currentExerciseName) continue;

    var rowType = db[currentExerciseName];
    if (!rowType) {
      if (currentExerciseName.includes("біг") || currentExerciseName.includes("run")) rowType = 'RUN'; 
      else rowType = 'STRENGTH';
    }

    if (type === 'run' && rowType !== 'RUN') continue;
    if (type === 'strength' && rowType === 'RUN') continue;

    

    var rawFact = String(data[i][7]);
    var w = 0, s = 0, r = 0;

    if (rawFact && rawFact !== "") {
      var parsed = parseFactString(rawFact, String(data[i][3]), String(data[i][4]), String(data[i][5]));
      w = parsed.w;
      s = parsed.s;
      r = parsed.r;
    } else {
      w = parseNumber(String(data[i][3]));
      s = parseNumber(String(data[i][4]));
      var rawR = String(data[i][5]);
      
      if (type === 'run') r = parseDistance(rawR);
      else r = parseNumber(rawR);
    }

    if (type === 'run') {
      if (s === 0) s = 1;
      if (w > 0 && w <= 1.5) w = Math.round(w * 100);
      
      if (w === 0) continue;

      if (r > 0) {
        var valToAdd = r * s;
        if (i >= dayStart && i < dayEnd) stats.day += valToAdd;
        if (i >= weekStart && i < weekEnd) stats.week += valToAdd;
        if (targetCycleNum && scanningCycleNum == targetCycleNum) {
          stats.cycle += valToAdd;
          if (w <= 50) stats.cycleZones["Z1"] += valToAdd;
          else if (w <= 70) stats.cycleZones["Z2"] += valToAdd;
          else if (w <= 80) stats.cycleZones["Z3"] += valToAdd;
          else if (w <= 90) stats.cycleZones["Z4"] += valToAdd;
          else stats.cycleZones["Z5"] += valToAdd;
        }
      }
    } else {
      // Силові - пропускаємо "власна вага"
      if (!String(data[i][3]).toLowerCase().includes("власна") && w > 0 && s > 0 && r > 0) {
        var val = Math.round(w * s * r);
        if (i >= dayStart && i < dayEnd) stats.day += val;
        if (i >= weekStart && i < weekEnd) stats.week += val;
        if (targetCycleNum && scanningCycleNum == targetCycleNum) stats.cycle += val;
      }
    }
  }

  if (type === 'run') {
    stats.day = parseFloat(stats.day.toFixed(2));
    stats.week = parseFloat(stats.week.toFixed(2));
    stats.cycle = parseFloat(stats.cycle.toFixed(2));
    for (var k in stats.cycleZones) stats.cycleZones[k] = parseFloat(stats.cycleZones[k].toFixed(2));
  }
  
  return stats;
}

/**
 * 🔥 ВИПРАВЛЕНА ФУНКЦІЯ ПАРСИНГУ ФАКТУ
 * Читає: "80% | 3 x 500" або "90% | 4 x 800" або "60 | 4 x 700"
 */
function parseFactString(factStr, planW, planS, planR) {
  var s = String(factStr || "").trim();
  var result = { w: 0, s: 0, r: 0 };
  
  if (!s || s === "") {
    // Немає факту - беремо план
    result.w = parseNumber(planW);
    result.s = parseNumber(planS);
    result.r = parseDistance(planR);
    return result;
  }
  
  // Якщо є роздільник "|"
  if (s.indexOf("|") > -1) {
    var parts = s.split("|");
    var left = String(parts[0] || "").trim();
    var right = String(parts[1] || "").trim();
    
    // Ліва частина - інтенсивність/вага
    result.w = parseNumber(left);
    
    // Права частина - серії x дистанція
    // Шукаємо "x" або "х" (кирилиця)
    var xPos = right.indexOf("x");
    if (xPos === -1) xPos = right.indexOf("х"); // кирилиця
    
    if (xPos > -1) {
      var seriesStr = right.substring(0, xPos).trim();
      var distStr = right.substring(xPos + 1).trim();
      
      result.s = parseNumber(seriesStr);
      result.r = parseDistance(distStr);
    } else {
      // Немає "x" - тільки дистанція, серії = 1
      result.s = 1;
      result.r = parseDistance(right);
    }
  } else {
    // Немає "|" - можливо просто число
    var spaces = s.split(/\s+/);
    if (spaces.length >= 3) {
      result.w = parseNumber(spaces[0]);
      result.s = parseNumber(spaces[1]);
      result.r = parseDistance(spaces[2]);
    } else {
      // Одне значення - вважаємо що це дистанція
      result.w = parseNumber(planW);
      result.s = parseNumber(planS) || 1;
      result.r = parseDistance(s);
    }
  }
  
  return result;
}

/**
 * 🔥 ВИПРАВЛЕНА ФУНКЦІЯ ПАРСИНГУ ДИСТАНЦІЇ
 */
function parseDistance(valStr) {
  var s = String(valStr || "").toLowerCase().replace(",", ".").trim();
  
  // Пропускаємо час (хвилини, секунди)
  if (s.indexOf("хв") > -1 || s.indexOf("min") > -1 || s.indexOf("сек") > -1) {
    return 0;
  }
  
  var num = parseNumber(s);
  if (num === 0) return 0;
  
  // Якщо є "км" - це вже кілометри
  if (s.indexOf("км") > -1) return num;
  
  // Якщо є "м" (але не "км") - це метри, конвертуємо
  if (s.indexOf("м") > -1) return num / 1000;
  
  // Якщо число > 50 - вважаємо що це метри
  if (num > 50) return num / 1000;
  
  // Інакше - вже кілометри
  return num;
}





function calculateRunZones(history) {
  var zones = { "Z1": 0, "Z2": 0, "Z3": 0, "Z4": 0, "Z5": 0 };
  var totalKm = 0;
  history.forEach(function(h) {
    var int = h.intensity;
    if (int > 0) {
        totalKm += h.distance;
        if (int <= 50) zones["Z1"] += h.distance;
        else if (int <= 70) zones["Z2"] += h.distance;
        else if (int <= 80) zones["Z3"] += h.distance;
        else if (int <= 90) zones["Z4"] += h.distance;
        else zones["Z5"] += h.distance;
    }
  });
  return { totalKm: parseFloat(totalKm.toFixed(2)), zones: zones };
}

function getExercisesDatabase() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("список вправ");
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var db = {};
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][0]).toLowerCase().trim();
    var cat = String(data[i][2]).toUpperCase().trim();
    if (name) db[name] = cat;
  }
  return db;
}


function getClientInventory() { return {found:false}; }
// ============================================================================
// 📋 ОТРИМАННЯ АНКЕТИ (ЛОГІКА: USERS[A] -> ANKETA[B])
// ============================================================================

function getClientAnketaForSidebar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheetName = ss.getActiveSheet().getName();
  
  // 1. Пропускаємо системні листи
  var systemSheets = ["users", "warmup", "Settings", "список вправ", "Анкети", "Архів"];
  if (systemSheets.indexOf(currentSheetName) > -1) {
    return { status: "empty", msg: "Це системний лист. Відкрийте програму клієнта." };
  }

  // 2. Шукаємо Telegram ID клієнта в листі 'users'
  var usersSheet = ss.getSheetByName("users");
  if (!usersSheet) return { status: "error", msg: "❌ Не знайдено лист 'users'" };
  
  var uData = usersSheet.getDataRange().getValues();
  var targetTelegramId = null;

  for (var i = 1; i < uData.length; i++) {
    // Порівнюємо назву листа з Колонкою C (index 2)
    if (String(uData[i][2]).trim() === currentSheetName.trim()) {
      // ✅ БЕРЕМО ID З КОЛОНКИ A (index 0) — згідно вашого скріншоту
      targetTelegramId = String(uData[i][0]).trim(); 
      break;
    }
  }
  
  // Якщо ID не знайдено
  if (!targetTelegramId || targetTelegramId === "") {
    return { status: "not_found", msg: "⚠️ У листі 'users' (Колонка C) не знайдено прив'язки для цього листа." };
  }

  // 3. Шукаємо цей ID в листі 'Анкети'
  var anketaSheet = ss.getSheetByName("Анкети");
  if (!anketaSheet) return { status: "error", msg: "❌ Не знайдено лист 'Анкети'" };
  
  var aData = anketaSheet.getDataRange().getValues();
  
  // Шукаємо з кінця (щоб знайти найновішу анкету)
  for (var i = aData.length - 1; i >= 1; i--) {
    // ✅ В АНКЕТІ ID У КОЛОНЦІ B (index 1) — згідно вашого скріншоту
    var anketaId = String(aData[i][1]).trim(); 
    
    if (anketaId === targetTelegramId) {
      return {
        status: "success",
        data: {
          date:    aData[i][0], 
          name:    aData[i][2], // Колонка C
          age:     aData[i][3], // Колонка D
          goal:    aData[i][4], // Колонка E
          level:   aData[i][5], // Колонка F
          run:     aData[i][6], // Колонка G
          dist:    aData[i][7], // Колонка H
          freq:    aData[i][8], // Колонка I
          loc:     aData[i][9], // Колонка J
          health:  aData[i][10], // Колонка K
          details: aData[i][11] || "—" // Колонка L
        }
      };
    }
  }
  
  return { status: "empty", msg: "🆔 Клієнт (ID: " + targetTelegramId + ") знайдений, але анкети ще немає." };
}

// Функції для ручної прив'язки (додаткові)
function linkCurrentSheetToUser(userId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheetName = ss.getActiveSheet().getName();
  var usersSheet = ss.getSheetByName("users");
  var data = usersSheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    // Шукаємо по ID в колонці A
    if (String(data[i][0]) === String(userId)) {
      usersSheet.getRange(i + 1, 3).setValue(currentSheetName); // Пишемо назву листа в C
      return "✅ Програма прив'язана!";
    }
  }
  return "❌ ID не знайдено";
}

function getAllUsersList() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users");
  if (!s) return [];
  // Повертаємо ID (Col A) та Ім'я (Col B)
  var d = s.getRange(2, 1, s.getLastRow() - 1, 2).getValues(); 
  return d.map(r => ({ id: r[0], name: r[1] })); 
}
function getClientAnketaDirect() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheetName = ss.getActiveSheet().getName();
  
  // 1. Пошук Telegram ID клієнта
  var usersSheet = ss.getSheetByName("users");
  var uData = usersSheet.getDataRange().getValues();
  var targetID = null;

  for (var i = 1; i < uData.length; i++) {
    // Перевіряємо Силові (C) та Біг (E)
    if (String(uData[i][2]).trim() === currentSheetName.trim() || String(uData[i][4]).trim() === currentSheetName.trim()) {
      targetID = String(uData[i][0]).trim(); 
      break;
    }
  }
  
  if (!targetID) return { status: "error", msg: "Лист не прив'язаний до ID" };

  // 2. Збір даних з анкет
  var anketaSheet = ss.getSheetByName("Анкети");
  var aData = anketaSheet.getDataRange().getValues();
  var headers = aData[0]; // Ваші динамічні питання з першого рядка

  for (var i = aData.length - 1; i >= 1; i--) {
    var aID = String(aData[i][1]).replace(/\D/g, ""); // ID у колонці B
    if (aID === targetID.replace(/\D/g, "")) {
      var answers = [];
      // Цикл проходить по всім колонкам, починаючи з третьої (Ім'я)
      for (var col = 2; col < headers.length; col++) {
        answers.push({
          question: headers[col] || ("Питання " + (col - 1)),
          answer: aData[i][col] || "—"
        });
      }
      
      return {
        status: "success",
        data: {
          name: aData[i][2] || "Клієнт",
          answers: answers
        }
      };
    }
  }
  return { status: "error", msg: "Анкету не знайдено" };
}
function getInventoryForUser() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("users");
  if (!sheet) return { error: "Немає листа users" };

  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { error: "Немає клієнтів" };

  // 🔥 ЧИТАЄМО АКТИВНУ КОМІРКУ З ПОТОЧНОГО ЛИСТА
  var activeSheet = ss.getActiveSheet();
  var activeCellRow = SpreadsheetApp.getActiveRange().getRow();
  var activeSheetName = activeSheet.getName();

  var dataRow = 2; // За замовчуванням беремо перший клієнт

  // Якщо ми на листі users — беремо активний рядок
  if (activeSheetName === "users" && activeCellRow >= 2) {
    dataRow = activeCellRow;
  } else {
    // 🔥 Якщо ми НЕ на users — шукаємо клієнта за актив. листом
    // Наприклад якщо активна вкладка "біг Антон" або "Мій тренувальний план"
    // Шукаємо цю назву в колонках C або E листа users
    var usersData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    for (var i = 0; i < usersData.length; i++) {
      // Колонка C (index 2) або колонка E (index 4)
      if (String(usersData[i][2]).trim() === activeSheetName || 
          String(usersData[i][4]).trim() === activeSheetName) {
        dataRow = i + 2;
        break;
      }
    }
  }

  // Заголовки починаємо з F (колонка 6)
  var headers = sheet.getRange(1, 6, 1, lastCol - 5).getValues()[0];
  var clientData = sheet.getRange(dataRow, 6, 1, lastCol - 5).getValues()[0];
  var clientName = sheet.getRange(dataRow, 2).getValue();

  // Збираємо інвентар
  var inventory = [];
  for (var i = 0; i < headers.length; i++) {
    var headerName = String(headers[i]).trim();
    var cellValue = clientData[i];
    if (headerName && headerName.length > 0 && cellValue === true) {
      inventory.push(headerName);
    }
  }

  return {
    clientName: clientName,
    inventory: inventory
  };
}
function testRunStats() {
  var data = getSelectedExerciseData();
  Logger.log("=== TEST ===");
  Logger.log("history: " + JSON.stringify(data.history));
  Logger.log("runStats: " + JSON.stringify(data.runStats));
  Logger.log("globalStats: " + JSON.stringify(data.globalStats));
}
function clearSheetCache(sheetName) {
  var cache = CacheService.getScriptCache();
  cache.remove("sheet_" + sheetName);
}

// Викликайте це після запису даних
function testAnketaDirect() {
  var result = getClientAnketaDirect();
  Logger.log("=== ТЕСТ АНКЕТИ ===");
  Logger.log("Status: " + result.status);
  
  if (result.status === "success") {
    Logger.log("Name: " + result.data.name);
    Logger.log("Answers count: " + result.data.answers.length);
    for (var i = 0; i < result.data.answers.length; i++) {
      Logger.log("Q: " + result.data.answers[i].question + " -> A: " + result.data.answers[i].answer);
    }
  } else {
    Logger.log("Error: " + result.msg);
  }
}
/**
 * Синхронізує заголовки таблиці "Анкети" з питаннями в "Settings"
 */
function syncAnketaHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var anketaSheet = ss.getSheetByName("Анкети");
  
  if (!settingsSheet || !anketaSheet) return;

  // 1. Отримуємо нові питання (використовуємо вашу існуючу функцію)
  var result = getAnketaQuestions();
  if (result.status !== "success") return;
  
  var newQuestions = result.questions.map(function(q) { return q.text; });
  
  // 2. Формуємо нову шапку: Дата | ID | Питання 1 | Питання 2 ...
  var newHeaders = [["Дата", "ID"].concat(newQuestions)];
  
  // 3. Записуємо в перший рядок листа "Анкети"
  anketaSheet.getRange(1, 1, 1, newHeaders[0].length).setValues(newHeaders);
  
  // 4. Очищуємо кеш, щоб зміни відразу з'явилися в панелі
  clearSheetCache("Анкети");
  
  Browser.msgBox("✅ Заголовки синхронізовано з Settings!");
}
function testRunData() {
  Logger.log("=== ТЕСТ ПАРСИНГУ ФАКТУ ===");
  
  var fact1 = "90% | 4 x 800";
  var parsed1 = parseFactString(fact1, "90%", "5 серій", "1600 м");
  Logger.log("Факт: " + fact1);
  Logger.log("Parsed: w=" + parsed1.w + ", s=" + parsed1.s + ", r=" + parsed1.r);
  Logger.log("Км: " + (parsed1.s * parsed1.r));
  
  var fact2 = "60% | 4 x 700";
  var parsed2 = parseFactString(fact2, "50%", "2 серії", "400 м");
  Logger.log("Факт: " + fact2);
  Logger.log("Parsed: w=" + parsed2.w + ", s=" + parsed2.s + ", r=" + parsed2.r);
  Logger.log("Км: " + (parsed2.s * parsed2.r));
  
  // Тест без факту (план)
  var parsed3 = parseFactString("", "0.7", "5 серії", "600 м");
  Logger.log("План 70%: w=" + parsed3.w + ", s=" + parsed3.s + ", r=" + parsed3.r);
  Logger.log("Км: " + (parsed3.s * parsed3.r));
}
function testSimple() {
  Logger.log("=== ПРОСТИЙ ТЕСТ ===");
  
  // Тест parseNumber
  Logger.log("parseNumber('90%') = " + parseNumber("90%"));
  Logger.log("parseNumber('0.7') = " + parseNumber("0.7"));
  Logger.log("parseNumber('5 серій') = " + parseNumber("5 серій"));
  
  // Тест parseDistance
  Logger.log("parseDistance('800') = " + parseDistance("800"));
  Logger.log("parseDistance('600 м') = " + parseDistance("600 м"));
  Logger.log("parseDistance('1.5 км') = " + parseDistance("1.5 км"));
  
  // Перевірка чи функція parseFactString існує
  Logger.log("typeof parseFactString = " + typeof parseFactString);
}

function findFunction() {
  Logger.log("=== ПОШУК ФУНКЦІЇ ===");
  Logger.log(parseFactString.toString().substring(0, 200));
}
function testFactParsing() {
  Logger.log("=== ТЕСТ parseFactString ===");
  
  var r1 = parseFactString("90% | 4 x 800", "90%", "5", "1600");
  Logger.log("90% | 4 x 800 -> w:" + r1.w + " s:" + r1.s + " r:" + r1.r + " km:" + (r1.s * r1.r));
  
  var r2 = parseFactString("60% | 4 x 700", "50%", "2", "400");
  Logger.log("60% | 4 x 700 -> w:" + r2.w + " s:" + r2.s + " r:" + r2.r + " km:" + (r2.s * r2.r));
  
  var r3 = parseFactString("", "0.7", "5", "600 м");
  Logger.log("План 70% -> w:" + r3.w + " s:" + r3.s + " r:" + r3.r + " km:" + (r3.s * r3.r));
}
// --- 🛠 ДОПОМІЖНА: ШУКАЄМО РЕАЛЬНИЙ КІНЕЦЬ ТРЕНУВАННЯ ---
function findLastContentRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) return 0;
  
  // Читаємо колонки з ДАНИМИ тренування
  var rangeD = sheet.getRange(1, 4, lastRow, 1).getValues(); // Вага/Інтенсивність
  var rangeE = sheet.getRange(1, 5, lastRow, 1).getValues(); // Підходи/Серії
  var rangeF = sheet.getRange(1, 6, lastRow, 1).getValues(); // Повтори/Дистанція
  
  // Шукаємо з кінця перший рядок з РЕАЛЬНИМИ даними
  for (var i = lastRow - 1; i >= 0; i--) {
    var cellD = String(rangeD[i][0]).trim();
    var cellE = String(rangeE[i][0]).trim();
    var cellF = String(rangeF[i][0]).trim();
    
    // Якщо хоч одна з колонок D, E, F не пуста - це реальний рядок
    if (cellD !== "" || cellE !== "" || cellF !== "") {
      return i + 1;
    }
  }
  
  return 1;
}

// --- 1. КНОПКА: НАСТУПНИЙ ДЕНЬ (ВИПРАВЛЕНО ДЛЯ ОБ'ЄДНАНИХ КЛІТИНОК) ---
function addNextDay() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRealRow = findLastContentRow(sheet);
  
  Logger.log("=== ПОЧАТОК addNextDay ===");
  Logger.log("Назва листа: " + sheet.getName());
  Logger.log("lastRealRow: " + lastRealRow);
  
  var scanCount = Math.min(lastRealRow, 300);
  var startScan = Math.max(1, lastRealRow - scanCount + 1);
  
  var dataA = sheet.getRange(startScan, 1, scanCount, 1).getValues();

  var lastDayText = "";
  var lastDayRow = -1;
  
  // Шукаємо останній день
  for (var i = dataA.length - 1; i >= 0; i--) {
    var rowIndex = startScan + i;
    var val = String(dataA[i][0]).trim();
    
    if (!val || val === "") continue;
    
    if (val.toLowerCase().includes("актуальний")) continue;
    if (val.match(/^ц\s*\d+/i)) continue;
    
    lastDayText = val;
    lastDayRow = rowIndex;
    break;
  }
  
  if (!lastDayText) {
    lastDayText = "День №1";
  }
  
  // 🔥 НОВА НАДІЙНА ЛОГІКА: шукаємо останній рядок з будь-яким контентом
  // між lastDayRow і кінцем таблиці (ігноруючи порожні рядки)
  var endOfDayRow = lastDayRow;
  
  if (lastDayRow > 0) {
    var maxScan = Math.min(lastRealRow + 20, sheet.getMaxRows());
    var lastFoundContent = lastDayRow;
    var emptyStreak = 0;
    var MAX_EMPTY_GAP = 5; // Максимальний допустимий розрив порожніх рядків
    
    for (var row = lastDayRow + 1; row <= maxScan; row++) {
      var cellA = String(sheet.getRange(row, 1).getValue()).trim();
      var cellB = String(sheet.getRange(row, 2).getValue()).trim();
      var isMergedB = sheet.getRange(row, 2).isPartOfMerge();
      var cellD = String(sheet.getRange(row, 4).getValue()).trim();
      var cellE = String(sheet.getRange(row, 5).getValue()).trim();
      var cellF = String(sheet.getRange(row, 6).getValue()).trim();
      
      Logger.log("Рядок " + row + ": A=[" + cellA + "], B=[" + cellB + "], D=[" + cellD + "], E=[" + cellE + "], F=[" + cellF + "], Merged=" + isMergedB);
      
      // 1. Якщо знайшли НОВИЙ день — стоп, кінець попереднього дня
      if (cellA !== "" && !cellA.toLowerCase().includes("актуальний") && !cellA.match(/^ц\s*\d+/i)) {
        break;
      }
      
      // 2. Є контент у будь-якій колонці — оновлюємо кінець
      if (cellB !== "" || isMergedB || cellD !== "" || cellE !== "" || cellF !== "") {
        lastFoundContent = row;
        emptyStreak = 0;
        continue;
      }
      
      // 3. Порожній рядок — рахуємо, але НЕ зупиняємось одразу
      emptyStreak++;
      if (emptyStreak >= MAX_EMPTY_GAP) {
        break; // Забагато порожніх підряд — точно кінець
      }
    }
    
    endOfDayRow = lastFoundContent;
  }
  
  if (endOfDayRow < lastDayRow) endOfDayRow = lastDayRow;

  Logger.log("Кінець вправ дня: рядок " + endOfDayRow);
  
  var nextDay = getNextDayName(lastDayText);
  var targetRow = endOfDayRow + 2;
  
  var cell = sheet.getRange(targetRow, 1);
  cell.setValue(nextDay).setFontWeight("bold");
  
  var colors = ["#ff0000", "#ffff00", "#00ff00", "#4a86e8"];
  var dayNumber = extractDayNumber(nextDay);
  var colorIndex = (dayNumber - 1) % colors.length;
  
  cell.setBackground(colors[colorIndex]);
  cell.setFontColor(colorIndex === 1 ? "black" : "white");

  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Створено: " + nextDay, "Новий день", 3);
}
// 🔥 ФУНКЦІЯ ВИЗНАЧЕННЯ НАСТУПНОГО ДНЯ (виправлена)
// 🔥 ФУНКЦІЯ ВИЗНАЧЕННЯ НАСТУПНОГО ДНЯ
function getNextDayName(currentDay) {
  var str = String(currentDay).trim();
  
  // 1. ДНІ ТИЖНЯ (українська)
  var daysUA = ["понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота", "неділя"];
  var lowerStr = str.toLowerCase();
  
  for (var i = 0; i < daysUA.length; i++) {
    if (lowerStr === daysUA[i]) {
      var nextIndex = (i + 1) % 7;
      return capitalize(daysUA[nextIndex]);
    }
  }
  
  // 2. ДНІ ТИЖНЯ (скорочено)
  var shortDays = ["пн", "вт", "ср", "чт", "пт", "сб", "нд"];
  for (var i = 0; i < shortDays.length; i++) {
    if (lowerStr === shortDays[i]) {
      return shortDays[(i + 1) % 7];
    }
  }
  
  // 3. ФОРМАТ "День №X" або "день X"
  var dayMatch = str.match(/^(день)\s*№?\s*(\d+)$/i);
  if (dayMatch) {
    var prefix = dayMatch[1];
    var num = parseInt(dayMatch[2]);
    var hasSymbol = str.includes("№");
    return capitalize(prefix) + (hasSymbol ? " №" : " ") + (num + 1);
  }
  
  // 4. ФОРМАТ "Назва №X" (будь-яке слово з номером)
  var customMatch = str.match(/^(.+?)\s*№\s*(\d+)$/);
  if (customMatch) {
    var baseName = customMatch[1].trim();
    var num = parseInt(customMatch[2]);
    return baseName + " №" + (num + 1);
  }
  
  // 5. ФОРМАТ "Назва X" (слово + пробіл + число)
  var customMatch2 = str.match(/^(.+?)\s+(\d+)$/);
  if (customMatch2) {
    var baseName = customMatch2[1].trim();
    var num = parseInt(customMatch2[2]);
    return baseName + " " + (num + 1);
  }
  
  // 6. ПРОСТО СЛОВО (дідько, цуцик, тощо)
  if (!str.match(/^\d+$/)) {
    return str + " №2";
  }
  
  // 7. ЯКЩО НІЧОГО НЕ ПІДІЙШЛО
  return "День №1";
}

// 🔥 ДОПОМІЖНА ФУНКЦІЯ: CAPITALIZE
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// 🔥 ДОПОМІЖНА ФУНКЦІЯ: ВИТЯГТИ НОМЕР ДНЯ
function extractDayNumber(dayStr) {
  // Витягуємо число з назви дня для кольору
  var match = dayStr.match(/№?\s*(\d+)/);
  if (match) return parseInt(match[1]);
  
  // Для днів тижня
  var daysUA = ["понеділок", "вівторок", "середа", "четвер", "п'ятниця", "субота", "неділя"];
  var lowerStr = dayStr.toLowerCase();
  for (var i = 0; i < daysUA.length; i++) {
    if (lowerStr === daysUA[i]) return i + 1;
  }
  
  return 1; // За замовчуванням
}

  
  

// --- 2. КНОПКА: НОВИЙ ТИЖДЕНЬ / ЦИКЛ ---
function startNextCycle() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRealRow = findLastContentRow(sheet);

  var lastCycle = 1;
  var lastWeek = 0;
  var dataB = sheet.getRange(1, 2, lastRealRow, 1).getValues();
  
  for (var i = 0; i < dataB.length; i++) {
    var val = String(dataB[i][0]).trim();
    var match = val.match(/Ц\s*(\d+)\s*Т\s*(\d+)/i);
    if (match) {
      var c = parseInt(match[1]);
      var t = parseInt(match[2]);
      if (c > lastCycle || (c === lastCycle && t > lastWeek)) {
        lastCycle = c;
        lastWeek = t;
      }
    }
  }

  var newCycle = lastCycle;
  var newWeek = lastWeek + 1;
  if (newWeek > 4) { newWeek = 1; newCycle++; }
  if (lastWeek === 0) { newCycle = 1; newWeek = 1; }
  
  var newCycleStr = "Ц" + newCycle + " Т" + newWeek;
  var finder = sheet.createTextFinder("Актуальний").findNext();
  if (finder) { finder.clearContent(); }

  var targetRow = lastRealRow + 2;
  sheet.getRange(targetRow, 1).setValue("Актуальний");
  
  var cellB = sheet.getRange(targetRow, 2);
  cellB.clearDataValidations().clearContent();
  cellB.setValue(newCycleStr).setFontWeight("bold").setHorizontalAlignment("center");
  
  var cellDay = sheet.getRange(targetRow + 1, 1);
  cellDay.setValue("День №1").setFontWeight("bold").setBackground("#ff0000").setFontColor("white");
  
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Створено " + newCycleStr, "Новий тиждень");
}
function TEST_NextDay_v2() {
  Logger.log("=== ТЕСТ НАСТУПНОГО ДНЯ V2 ===");
  
  var tests = [
    "День №1",
    "День №7",
    "День №82",
    "День 5",
    "понеділок",
    "неділя",
    "дідько",
    "Цуцик",
    "А/Б",
    "123"
  ];
  
  for (var i = 0; i < tests.length; i++) {
    var next = getNextDayName(tests[i]);
    Logger.log("[" + tests[i] + "] → [" + next + "]");
  }
}
function parseDistance(valStr) {
  var s = String(valStr || "").toLowerCase().replace(",", ".").trim();
  if (s.indexOf("хв") > -1 || s.indexOf("min") > -1 || s.indexOf("сек") > -1) return 0;
  var num = parseNumber(s);
  if (num === 0) return 0;
  if (s.indexOf("км") > -1) return num;
  if (s.indexOf("м") > -1) return num / 1000;
  if (num > 50) return num / 1000;
  return num;
}
function parseDistanceToKm(val) {
  var str = String(val).toLowerCase().replace(",", ".").trim();
  if (!str || str === "") return 0;
  var numMatch = str.match(/(\d+(\.\d+)?)/);
  if (!numMatch) return 0;
  var num = parseFloat(numMatch[0]);
  if (str.includes("м") || num > 50) return num / 1000;
  return num;
}

