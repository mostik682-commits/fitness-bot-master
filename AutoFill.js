function onEdit(e) {
  if (!e || !e.range) return;
  
  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  
  // 1. Очищення кешу для миттєвого оновлення CRM
  try { CacheService.getScriptCache().remove("sheet_" + sheetName); } catch(err) {}

  // 2. Фільтр системних листів
  var ignoreSheets = ["users", "warmup", "Settings", "список вправ", "Анкети", "Архів"];
  if (ignoreSheets.indexOf(sheetName) > -1) return;
  
  // Перевірка: чи це колонка B (Назва вправи)
  if (range.getColumn() !== 2 || range.getRow() < 2) return;
  
  // 🔥 ПЕРЕВІРКА: Якщо це частина об'єднаної клітинки - не чіпаємо
  if (range.isPartOfMerge()) {
    return;
  }
  
  var weightCell = range.offset(0, 2); // Колонка D
  var setsCell = range.offset(0, 3);   // Колонка E
  var repsCell = range.offset(0, 4);   // Колонка F
  var exerciseName = range.getValue();

  // 🔥 КРОК 1: ЗАВЖДИ ОЧИЩАЄМО ВСЕ (навіть якщо комірку очистили)
  weightCell.clearContent();
  setsCell.clearContent();
  repsCell.clearContent();
  range.clearNote();  // Завжди видаляємо стару помітку
  sheet.getRange(range.getRow(), 4, 1, 3).setFontColor(null); 

  // 🔥 КРОК 2: Якщо комірку очистили - виходимо (вже все очистили вище)
  if (exerciseName === "" || exerciseName === null || exerciseName === undefined || String(exerciseName).trim() === "") {
    return;  // Вихід з чистою коміркою
  }

  // 🔥 КРОК 3: ПОШУК АБСОЛЮТНОГО РЕКОРДУ (тільки якщо є назва вправи)
  var cleanInputName = String(exerciseName).trim().toLowerCase();
  var currentRow = range.getRow();
  var lastRow = currentRow - 1; 
  if (lastRow < 2) return; 

  var data = sheet.getRange(2, 2, lastRow - 1, 7).getValues();
  
  var globalMaxWeight = -1; 
  var bestSets = "";
  var bestReps = "";
  var found = false;
  
  var currentExContext = ""; 

  for (var i = 0; i < data.length; i++) {
    var cellB = String(data[i][0]).trim();
    
    if (cellB !== "" && !cellB.match(/^ц\d+/i) && cellB.toLowerCase() !== "назва вправи") {
      currentExContext = cellB.toLowerCase();
    }
    
    if (currentExContext === cleanInputName) {
      var pW = extractWeightNum(data[i][2]);
      var fW = extractWeightNum(data[i][6]);
      var rowMax = Math.max(pW, fW);
      
      if (rowMax > globalMaxWeight) {
        globalMaxWeight = rowMax;
        
        if (fW >= pW && fW > 0.1) {
          var factInfo = parseFactStringForOnEdit(data[i][6]);
          bestSets = factInfo.sets || data[i][3];
          bestReps = factInfo.reps || data[i][4];
        } else {
          bestSets = data[i][3];
          bestReps = data[i][4];
        }
        found = true;
      }
    }
  }
  
  // 🔥 КРОК 4: ЗАПИС РЕЗУЛЬТАТУ (тільки якщо знайдено рекорд)
  if (found) {
    var displayWeight = (globalMaxWeight === 0.1) ? "власна вага" : globalMaxWeight;
    weightCell.setValue(displayWeight);
    setsCell.setValue(bestSets);
    repsCell.setValue(bestReps);
    
    sheet.getRange(currentRow, 4, 1, 3).setFontColor("#999999");
  }
}

function extractWeightNum(val) {
  var s = String(val || "").toLowerCase().replace(",", ".");
  if (s.includes("власна")) return 0.1;
  var match = s.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : -1;
}

function parseFactStringForOnEdit(str) {
  var s = String(str);
  if (!s.includes("|")) return { sets: null, reps: null };
  var parts = s.split("|")[1].split("x");
  if (parts.length < 2) parts = s.split("|")[1].split("х");
  return {
    sets: parts[0] ? parts[0].trim() : null,
    reps: parts[1] ? parts[1].trim() : null
  };
}

// Допоміжна функція для перетворення тексту на число ваги
function extractWeightNum(val) {
  var s = String(val || "").toLowerCase().replace(",", ".");
  if (s.includes("власна")) return 0.1;
  var match = s.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : -1;
}

// Допоміжна функція для розбору рядка від бота: "90кг | 3 x 12"
function parseFactStringForOnEdit(str) {
  var s = String(str);
  if (!s.includes("|")) return { sets: null, reps: null };
  var parts = s.split("|")[1].split("x");
  if (parts.length < 2) parts = s.split("|")[1].split("х"); // кирилична 'х'
  return {
    sets: parts[0] ? parts[0].trim() : null,
    reps: parts[1] ? parts[1].trim() : null
  };
}
function removeAllNotes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  // Системні листи які пропускаємо
  var ignoreSheets = ["users", "warmup", "Settings", "список вправ", "Анкети", "Архів", "НАВІГАЦІЯ"];
  
  var totalCleared = 0;
  
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var sheetName = sheet.getName();
    
    // Пропускаємо системні
    if (ignoreSheets.indexOf(sheetName) > -1) continue;
    
    Logger.log("Очищаю лист: " + sheetName);
    
    var range = sheet.getDataRange();
    var notes = range.getNotes();
    
    for (var i = 0; i < notes.length; i++) {
      for (var j = 0; j < notes[i].length; j++) {
        if (notes[i][j]) {
          sheet.getRange(i + 1, j + 1).clearNote();
          totalCleared++;
        }
      }
    }
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ Видалено " + totalCleared + " поміток з усіх листів!", "Очищення завершено", 5);
  Logger.log("Всього видалено поміток: " + totalCleared);
}