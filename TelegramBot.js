// ============================================================================
// ⚙️ НАЛАШТУВАННЯ (CONFIG) - БОТ №2
// ============================================================================

var token = "7978633354:AAEQWjLSjvSPLHLOqmEglkl05_0HdmlbJYI"; // Токен
var adminId = "382654823"; // Твій ID
var OPENAI_API_KEY = "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";

// 👇 ОБОВ'ЯЗКОВО: ВСТАВ СЮДИ ПОСИЛАННЯ ПІСЛЯ DEPLOY
var webAppUrl = "https://script.google.com/macros/s/AKfycbzH688lYUuknsJ0KWhudteELcPyeMf5ukK1kGnXLocVzbtmHOnps-OOxrIH_GUcSdx-1A/exec"; 

var usersSheetName = "users";
var warmupSheetName = "warmup";
var settingsSheetName = "Settings";
var exercisesSheetName = "список вправ";

var telegramUrl = "https://api.telegram.org/bot" + token;
var botUsername = "@eattttttt_bot";
var nutritionSheetName = "Nutrition";
var recipesSheetName = "Рецепти"; // Назва вашого нового листа
var FOOD_DB_ID = "1TU01aDUN_33mFCryhY20ct6g2zID1VRFgfQCArP_aJ0";



// ----------------------------------------------------------------------------
// 🛠 ФУНКЦІЇ (HELPER FUNCTIONS)
// ----------------------------------------------------------------------------

function isValidSheet(val) {
     if (!val) return false;
     var s = String(val).trim();
     if (s.length < 2) return false; 
     if (s.match(/^\d+$/)) return false; 
     return true;
}

// 🔥 РЕКВІЗИТИ (КОПІЮВАННЯ ПО КЛІКУ + ШВИДКІ КНОПКИ)
function sendClientRequisites(id){
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settingsSheetName);
  
  var info = s.getRange("A2").getValue();       // ФОП, ЄДРПОУ
  var cleanIban = s.getRange("B2").getValue();  // Чистий IBAN
  var monoLink = s.getRange("C2").getValue();   
  var privatLink = s.getRange("D2").getValue();     
  
  var text = "💳 <b>РЕКВІЗИТИ ДЛЯ ОПЛАТИ:</b>\n\n" +
             info + "\n" +
             "👇 <b>Натисни на рахунок, щоб скопіювати:</b>\n" +
             "<code>" + cleanIban + "</code>\n\n" + 
             "або сплати швидко через посилання:";
  
  var keyboard = [];
  var bankButtons = [];

  if (monoLink && String(monoLink).includes("http")) {
    bankButtons.push({text: "🐈 Mono (Банка)", url: monoLink});
  }
  if (privatLink && String(privatLink).includes("http")) {
    bankButtons.push({text: "🟢 Privat24", url: privatLink});
  }

  if (bankButtons.length > 0) keyboard.push(bankButtons);
  keyboard.push([{text: "✅ Я оплатив(ла)", callback_data: "i_have_paid"}]);
  
  sendMessage(id, text, JSON.stringify({inline_keyboard: keyboard}));
}

function sendBotInstruction(id) {
  var text = "📚 <b>ІНСТРУКЦІЯ:</b>\n\n" +
             "1️⃣ <b>Початок:</b> Обери тип тренування:\n" +
             "   • 🏋️ <b>Силові тренування</b> — для роботи з вагою\n" +
             "   • 🏃 <b>Тренування з бігу</b> — бігові програми\n\n" +
             
             "2️⃣ <b>Вибір дня:</b> Натисни на потрібний день (День №1, День №2...)\n\n" +
             
             "3️⃣ <b>Перегляд вправ:</b> Побачиш список вправ з:\n" +
             "   • Вагою/інтенсивністю\n" +
             "   • Кількістю підходів/серій\n" +
             "   • Повторами/дистанцією\n\n" +
             
             "4️⃣ <b>Відео:</b> Натисни 📹 <i>Відео</i> під вправою для перегляду техніки.\n\n" +
             
             "5️⃣ <b>Трекер підходів:</b> Натисни кнопку <code>[0/4]</code> щоб відмічати виконані підходи.\n\n" +
             
             "6️⃣ <b>Запис результатів:</b> Тисни ✏️ <i>Внести корективи</i> щоб записати фактичну вагу або зміни.\n" +
             "   • Введи одне число: <code>85</code> — зміниться вага\n" +
             "   • Введи три числа: <code>85 4 10</code> — вага, підходи, повтори\n\n" +
             
             // 🔥 ДОДАНО НОВИЙ ПУНКТ ТУТ 👇
             "7️⃣ <b>Контроль форми:</b> Тисни 📏 <i>Внести заміри</i> в головному меню.\n" +
             "   • Відкриється зручна форма для запису ваги та об'ємів тіла.\n\n" +
             // --------------------------
             
             "8️⃣ <b>Відеоінструкції:</b> Кнопка 📹 в меню — база всіх вправ з відео.\n\n" +
             
             "9️⃣ <b>Архів:</b> Історія минулих циклів та тренувань.\n\n" +
             
             "🔟 <b>Оплата:</b> Кнопка 💳 — реквізити та підтвердження оплати.\n\n" +
             
             "❓ Питання? Напиши тренеру!";
  sendMessage(id, text);
}

function sendArchiveList(id, sheetName) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = s.getRange("B1:B" + s.getLastRow()).getValues();
  var keyboard = [];
  var row = [];
  
  for (var i = 0; i < data.length; i++) {
    var cellValue = String(data[i][0]);
    if (cellValue.match(/Ц\d+.*Т\d+/i)) {
      row.push({text: cellValue, callback_data: "arc_week_" + (i + 1) + "_" + cellValue});
      if (row.length === 2) { keyboard.push(row); row = []; }
    }
  }
  if (row.length > 0) keyboard.push(row);
  
  if (keyboard.length === 0) {
    sendMessage(id, "🗄 Архів порожній.");
  } else {
    sendMessage(id, "🗄 <b>АРХІВ:</b>\nОбери цикл:", JSON.stringify({inline_keyboard: keyboard}));
  }
}

function sendArchiveDaysMenu(id, sheetName, row, name) {
  var days = getWorkoutDays(sheetName, row);
  var keyboard = [], r = [];
  for (var i = 0; i < days.length; i++) {
    r.push({text: days[i], callback_data: "arc_day_" + row + "_" + days[i]});
    if (r.length === 2) { keyboard.push(r); r = []; }
  }
  if (r.length > 0) keyboard.push(r);
  sendMessage(id, "📂 <b>Архів: " + name + "</b>\nОбери тренування:", JSON.stringify({inline_keyboard: keyboard}));
}

function sendVideoInstructions(id, msgId) { // Додали msgId
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(exercisesSheetName);
  if (!s) return;
  
  var data = s.getDataRange().getValues();
  var categories = {}; 

  for (var i = 1; i < data.length; i++) {
    var videoLink = String(data[i][1]).trim(); // Колонка B
    var muscleGroup = String(data[i][3]).trim(); // Колонка D
    if (videoLink.includes("http") && muscleGroup !== "") {
      categories[muscleGroup] = true;
    }
  }

  var keys = Object.keys(categories).sort();
  if (keys.length === 0) {
    sendMessage(id, "📹 <b>Відеоінструкції:</b> Відео не знайдено.");
    return;
  }

  var kb = { inline_keyboard: [] };
  var row = [];
  for (var j = 0; j < keys.length; j++) {
    row.push({ text: keys[j], callback_data: "vid_cat_" + keys[j] });
    if (row.length === 2) { kb.inline_keyboard.push(row); row = []; }
  }
  if (row.length > 0) kb.inline_keyboard.push(row);

  var txt = "📹 <b>ВІДЕОІНСТРУКЦІЇ</b>\n\nОбери групу м'язів:";

  // 🔥 ЛОГІКА ОНОВЛЕННЯ:
  if (msgId) {
    // Якщо прийшли з кнопки "Назад", редагуємо існуюче вікно
    editMessage(id, msgId, txt);
    editMessageReplyMarkup(id, msgId, JSON.stringify(kb));
  } else {
    // Якщо зайшли вперше з меню, надсилаємо нове повідомлення
    sendMessage(id, txt, JSON.stringify(kb));
  }
}
function sendVideoByCategory(id, category) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(exercisesSheetName);
  if (!s) { sendMessage(id, "❌ База вправ не знайдена."); return; }
  var lastRow = s.getLastRow();
  if (lastRow < 2) { sendMessage(id, "📂 База вправ пуста."); return; }

  var data = s.getRange(2, 1, lastRow - 1, 3).getValues(); 
  
  var title = (category === "RUN") ? "🏃 БІГОВІ ВПРАВИ:" : "🏋️ СИЛОВІ ВПРАВИ:";
  var msg = "📹 <b>" + title + "</b>\n\n";
  var count = 0;

  for (var i = 0; i < data.length; i++) {
    var name = data[i][0]; 
    var link = data[i][1]; 
    var cat = String(data[i][2]).toUpperCase().trim();
    
    if (category === "RUN" && cat !== "RUN") continue;
    if (category === "STRENGTH" && cat === "RUN") continue;
    
    if (link && String(link).includes("http")) {
      var line = "🔹 <a href='" + link + "'>" + name + "</a>\n";
      if (msg.length + line.length > 4000) { 
        sendMessage(id, msg); 
        msg = ""; 
      }
      msg += line;
      count++;
    }
  }
  
  if (count === 0) {
    msg += "⚠️ Вправ у цій категорії немає.";
  }
  
  var kb = {
    inline_keyboard: [[{ text: "⬅️ Назад до категорій", callback_data: "video_back" }]]
  };
  
  sendMessage(id, msg, JSON.stringify(kb));
}

function getUserInfo(id) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  if (!s) return null;
  
  // Отримуємо заголовки (рядок 1)
  var headers = s.getRange(1, 1, 1, 5).getValues()[0];
  var gymHeader = String(headers[2] || "Силові тренування").trim();
  var runHeader = String(headers[4] || "Тренування з бігу").trim();

  var d = s.getRange(2, 1, s.getLastRow(), 5).getValues();
  for (var i = 0; i < d.length; i++) {
    if (String(d[i][0]) == String(id)) {
      return { 
        name: d[i][1],
        gymSheet: String(d[i][2] || "").trim(),
        gymHeader: gymHeader, // Назва з C1
        payDay: d[i][3],
        runSheet: String(d[i][4] || "").trim(),
        runHeader: runHeader  // Назва з E1
      };
    }
  }
  return null;
}

function setActiveSheetForUser(id, sheetName) {
  PropertiesService.getScriptProperties().setProperty('active_sheet_' + id, sheetName);
}
function getActiveSheetForUser(id) {
  return PropertiesService.getScriptProperties().getProperty('active_sheet_' + id);
}

function sendModeSelector(id, name) {
  // 🔥 1. ВСТАВ СЮДИ СВОЄ ПОСИЛАННЯ (Збережи лапки)
  var webAppUrl = "https://script.google.com/macros/s/AKfycbzH688lYUuknsJ0KWhudteELcPyeMf5ukK1kGnXLocVzbtmHOnps-OOxrIH_GUcSdx-1A/exec"; 
  
  // Додаємо ID клієнта, щоб анкета знала, хто це
  var personalizedUrl = webAppUrl + "?page=measurements&uid=" + id

  var kb = [];

  // Рядок 1: Тренування та Харчування
  var row1 = [];
  if (APP_SETTINGS.ENABLE_TRAINING) row1.push({text: "🏋️‍♂️ Моє тренування"});
  if (APP_SETTINGS.ENABLE_NUTRITION) row1.push({text: "🍽 Харчування"});
  if (row1.length > 0) kb.push(row1);

  // 🔥 Рядок 2: ЗАМІРИ та КРОКИ (Оновлено)
  kb.push([
    {
      text: "📏 Внести заміри", 
      web_app: { url: personalizedUrl } 
    },
    { text: "👣 Кроки" } 
  ]);

  // Рядок 3: Відео та Оплата
  var row2 = [{text: "📹 Відеоінструкції"}];
  if (APP_SETTINGS.ENABLE_BILLING) row2.push({text: "💳 Реквізити / Оплата"});
  kb.push(row2);

  // Рядок 4: Архів та Інструкція
  kb.push([{text: "🗄 Архів"}, {text: "ℹ️ Інструкція"}]);

  // Рядок 5: ЗВ'ЯЗОК З ТРЕНЕРОМ
  kb.push([{text: "💬 Написати тренеру"}]);

  var stats = getUserTrainingStats(id);
  var msg = "Привіт, " + name + "! 👋\n";
  if (stats.startDate && stats.startDate !== "" && stats.startDate !== "true" && stats.startDate !== "false") {
    msg += "📅 Абонемент з: <b>" + stats.startDate + "</b>\n";
  }
  if (stats.total > 0) {
    if (stats.remaining > 0) {
      msg += "📋 Залишилося <b>" + stats.remaining + "</b> тренувань з <b>" + stats.total + "</b>\n";
    } else {
      msg += "⚠️ <b>Пакет тренувань вичерпано!</b> Зверніться до тренера.\n";
    }
  }
  msg += "Обери потрібний розділ:";
  
  // Відправляємо клавіатуру
  sendMessage(id, msg, JSON.stringify({
    keyboard: kb, 
    resize_keyboard: true 
  }));
}
function sendDayButtons(id, sheetName, modeTitle) {
  var days = getWorkoutDays(sheetName, null);
  var buttons = [];
  var row = [];
  if (days.length === 0) { sendMessage(id, "⚠️ У цій програмі ще немає днів."); return; }
  for (var i = 0; i < days.length; i++) {
    var btnText = days[i];
    row.push({text: btnText});
    if (row.length === 2) { buttons.push(row); row = []; }
  }
  if (row.length > 0) buttons.push(row);
  buttons.push([{text: "🔙 Назад"}]); 
  sendMessage(id, "📂 <b>" + modeTitle + "</b>\nОбери день:", JSON.stringify({keyboard: buttons, resize_keyboard: true}));
}

function sendAdminMenu(id){
  sendMessage(id,"👮‍♂️ <b>Адмін-панель:</b>",JSON.stringify({
    inline_keyboard:[
      [{text: "🥦 Щоденники Клієнтів", callback_data: "admin_nutri_list"}]
      [{text:"📋 Відправити анкету", callback_data:"admin_send_anketa_menu"}],
      [{text:"📸 Нагадати про звіт", callback_data:"admin_remind_menu"}],
      [{text:"🆕 Нова програма",callback_data:"admin_mode_plan"}],
      [{text:"💰 Рахунок",callback_data:"admin_mode_invoice"}],
      [{text:"📢 Розсилка (Текст)",callback_data:"admin_broadcast_start"}],
      [{text:"🔗 Посилання на бот",callback_data:"admin_share_link"}],
      [{text:"👶 Тест Новачка",callback_data:"admin_test_newcomer"}]
    ]
  }));
}

function sendReminderToAll() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var d = s.getRange(2, 1, s.getLastRow()-1, 1).getValues();
  for (var i=0; i<d.length; i++) {
    var uid = d[i][0];
    if (uid && String(uid) != adminId) {
      try { sendMessage(uid, "Вітаю 👋 чекаю на фотозвіт"); Utilities.sleep(50); } catch(e){}
    }
  }
  sendMessage(adminId, "✅ Розсилку завершено.");
}

function sendBroadcast(txt) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var data = s.getRange(2, 1, s.getLastRow()-1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    var userId = data[i][0];
    if (userId && String(userId) != adminId) {
      try { sendMessage(userId, "📢 <b>Оголошення:</b>\n\n" + txt); Utilities.sleep(50); } catch (e) {}
    }
  }
  sendMessage(adminId, "✅ Розсилку завершено.");
}

function writeExerciseResult(sheetName, row, text) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return "Лист не знайдено";
  var r = parseInt(row);

  // 1. Визначаємо категорію вправи з бази
  var exName = sheet.getRange(r, 2).getValue().toString().toLowerCase().trim();
  var db = (typeof getExercisesDatabase === 'function') ? getExercisesDatabase() : {};
  var isRun = (db[exName] === "RUN");

  // 2. Читаємо план з колонок D, E, F
  var planData = sheet.getRange(r, 4, 1, 3).getDisplayValues()[0]; 
  var planVal = planData[0].trim();
  var planSets = planData[1].trim();
  var planReps = planData[2].trim();
  
  var hasPercent = planVal.includes("%");
  var parts = text.trim().replace(/\s+/g, " ").split(" ");
  var resultString = "";

  // 3. ЛОГІКА ФОРМУВАННЯ РЯДКА
  if (parts.length >= 1) {
    var uVal = parts[0]; // Те, що ввів користувач (вага або час)
    var uSets = parts[1] || planSets;
    var uReps = (parts.length > 2) ? parts.slice(2).join(" ") : planReps;

    if (hasPercent) {
      if (isRun) {
        // БІГ: 80% (інтенсивність) + час/темп у дужках
        resultString = planVal + " (" + uVal + ") | " + uSets + " x " + uReps;
      } else {
        // СИЛОВІ: 70% (1RM) + вага в кг у дужках
        resultString = planVal + " (" + uVal + "кг) | " + uSets + " x " + uReps;
      }
    } else {
      // ЗВИЧАЙНІ ВПРАВИ (без %)
      var unit = (isRun) ? "" : "кг";
      resultString = uVal + unit + " | " + uSets + " x " + uReps;
    }
  } else {
    resultString = text;
  }

  sheet.getRange(r, 8).setValue(resultString);
  SpreadsheetApp.flush();
  return "OK";
}
// 🔥 ОТРИМАННЯ ДАНИХ ДЛЯ ТРЕКЕРА
function getExerciseDataForTracker(chatId, rowId, sheetName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { error: "Лист [" + sheetName + "] не знайдено" };
    
    var startRow = parseInt(rowId);
    if (isNaN(startRow) || startRow < 1) return { error: "Невірний номер рядка" };
    
    // Беремо запас 50 рядків, щоб охопити всі вправи одного дня
    var data = sheet.getRange(startRow, 1, 50, 11).getDisplayValues();
    
    var exercises = [];
    var currentDay = String(data[0][0]).trim();
    var exercisesDB = (typeof getExercisesDatabase === 'function') ? getExercisesDatabase() : {};
    
    for (var i = 0; i < data.length; i++) {
      var dayCell = String(data[i][0]).trim();
      
      // Якщо зустріли назву іншого дня — зупиняємо пошук
      if (i > 0 && dayCell !== "" && dayCell !== currentDay) break;
      
      var exName = String(data[i][1]).trim();
      
      // Пропускаємо пусті назви або технічні рядки циклів (Ц1, Ц2...)
      if (!exName || exName.indexOf("Ц") === 0) continue;
      
      var planW = String(data[i][3]).trim(); // Колонка D (Вага/%)
      var planS = String(data[i][4]).trim(); // Колонка E (Підходи)
      var planR = String(data[i][5]).trim(); // Колонка F (Повтори)
      var planTime = String(data[i][9]).trim(); // Колонка J (Час)
      var note = String(data[i][8]).trim(); // Колонка I (Примітка)
      var factResult = String(data[i][7]).trim(); // Колонка H (Минулий факт)
      
      // Якщо в рядку немає жодних параметрів плану — пропускаємо
      if (!planW && !planS && !planR && !planTime) continue;
      
      // 🔥 ІНТЕЛЕКТУАЛЬНЕ ВИЗНАЧЕННЯ ТИПУ
      var exCategory = exercisesDB[exName.toLowerCase()] || "";
      var isRun = (exCategory === "RUN");
      var hasPercent = planW.indexOf("%") !== -1;
      
      exercises.push({
        row: startRow + i,
        name: exName,
        weight: planW,
        sets: planS,
        reps: planR,
        time: planTime,
        note: note,
        result: factResult,
        isRun: isRun,           // Передаємо, чи це біг
        hasPercent: hasPercent  // Передаємо, чи є відсоток у плані
      });
    }
    
    return {
      day: currentDay,
      exercises: exercises,
      sheetName: sheetName
    };
  } catch(e) {
    console.error("Помилка в getExerciseDataForTracker: " + e.toString());
    return { error: e.toString() };
  }
}
function addUserToSheet(id, n) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var lr = s.getLastRow();
  var r = s.getRange(1, 1, lr + 20, 1).getValues();
  var ir = lr + 1;
  for (var i = 1; i < r.length; i++) {
    if (r[i][0] == "" || r[i][0] == null) { ir = i + 1; break; }
  }
  var today = new Date();
  var day = today.getDate(); 
  s.getRange(ir, 1, 1, 5).setValues([[id, n, "", day, ""]]);  // ✅ 5 КОЛОНОК
}

function sendWelcomeMessage(id, isManualQuest) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  
  if (isManualQuest) {
    // === РЕЖИМ 2: ВІДПРАВКА ТРЕНЕРОМ (ВРУЧНУ) ===
    // Текст, який бачить клієнт, коли тренер натиснув кнопку в адмінці
    var textAnketa = "Привіт! 👋\nБудь ласка, заповни анкету нижче, і я автоматично надішлю її тренеру для аналізу та підбору програми.";
    
    var separator = webAppUrl.includes("?") ? "&" : "?";
    var finalUrl = webAppUrl + separator + "userId=" + id;
    
    var markupAnketa = {
      inline_keyboard: [[{ text: "📝 Заповнити анкету", web_app: { url: finalUrl } }]]
    };
    
    // Відправляємо ТІЛЬКИ текст і кнопку (без відео)
    sendMessage(id, textAnketa, JSON.stringify(markupAnketa));

  } else {
    // === РЕЖИМ 1: ПЕРШИЙ ВХІД (АВТОМАТИЧНО) ===
    // Тут залишаємо логіку з відео та текстом Settings F2
    var mediaContent = settingsSheet.getRange("E2").getValue(); 
    var sheetText = settingsSheet.getRange("F2").getValue();    

    var defaultText = "Вітаю! 👋\nЩоб почати роботу, натисни на кнопку нижче. Тренер зв'яжеться з тобою.";
    var bodyText = (sheetText && String(sheetText).length > 1) ? sheetText : defaultText;

    var markupWelcome = {
      inline_keyboard: [[{ text: "🚀 Надіслати заявку тренеру", callback_data: "start_request" }]]
    };

    if (mediaContent) {
      var contentStr = String(mediaContent).trim();
      var payload = { 
        chat_id: String(id), 
        caption: bodyText, 
        parse_mode: "HTML", 
        reply_markup: JSON.stringify(markupWelcome),
        protect_content: APP_SETTINGS.ENABLE_CONTENT_PROTECTION 
      };

      if (contentStr.includes("youtube.com") || contentStr.includes("youtu.be")) {
         var videoId = contentStr.includes("v=") ? contentStr.split("v=")[1].split("&")[0] : contentStr.split(".be/")[1];
         payload.photo = "https://img.youtube.com/vi/" + videoId + "/hqdefault.jpg";
         payload.caption += '\n\n🎬 <a href="' + contentStr + '">Дивись відео-знайомство</a>';
         UrlFetchApp.fetch(telegramUrl + "/sendPhoto", {method: "post", contentType: "application/json", payload: JSON.stringify(payload)});
      } else {
         payload.video = contentStr;
         UrlFetchApp.fetch(telegramUrl + "/sendVideo", {method: "post", contentType: "application/json", payload: JSON.stringify(payload)});
      }
    } else {
      sendMessage(id, bodyText, JSON.stringify(markupWelcome));
    }
  }
}
// 🔥 РАХУНОК (КОПІЮВАННЯ ПО КЛІКУ + ШВИДКІ КНОПКИ)
function sendInvoice(id, sum) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settingsSheetName);
  
  var info = s.getRange("A2").getValue();       
  var cleanIban = s.getRange("B2").getValue();  
  var monoLink = s.getRange("C2").getValue();      
  var privatLink = s.getRange("D2").getValue();     
  
  var text = "🧾 <b>РАХУНОК ДО СПЛАТИ: " + sum + " грн</b>\n\n" +
             "👤 " + info + "\n" +
             "👇 <b>Натисни на рахунок, щоб скопіювати:</b>\n" +
             "<code>" + cleanIban + "</code>\n\n" + 
             "<b>Що робити далі:</b>\n" +
             "1. Скопіюй рахунок (або тисни кнопки нижче).\n" +
             "2. Сплати суму.\n" +
             "3. <b>Надішли сюди скріншот квитанції.</b>";
  
  var keyboard = [];
  var bankButtons = [];
  
  if (monoLink && String(monoLink).includes("http")) {
    bankButtons.push({text: "🐈 Mono", url: monoLink});
  }
  if (privatLink && String(privatLink).includes("http")) {
    bankButtons.push({text: "🟢 Privat", url: privatLink});
  }

  if (bankButtons.length > 0) keyboard.push(bankButtons);

  if (keyboard.length > 0) {
    sendMessage(id, text, JSON.stringify({inline_keyboard: keyboard}));
  } else {
    sendMessage(id, text);
  }

  setUserState(id, "waiting_for_payment");
  sendMessage(adminId, "✅ Рахунок надіслано. Чекаємо скріншот.");
}



function sendPhoto(id, pid, cap, mk) { 
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try { 
    var payload = { chat_id: String(id), photo: pid, caption: cap, parse_mode: "HTML", protect_content: shouldProtect };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendPhoto", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); 
    return true; 
  } catch(e){ return false; } 
}

function sendDocument(id, did, cap, mk) { 
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try { 
    var payload = { chat_id: String(id), document: did, caption: cap, parse_mode: "HTML", protect_content: shouldProtect };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendDocument", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); 
    return true; 
  } catch(e){ return false; } 
}

function sendVideo(id, videoId, caption, mk) {
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try {
    var payload = {
      chat_id: String(id),
      video: videoId,
      caption: caption,
      parse_mode: "HTML",
      protect_content: shouldProtect
    };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendVideo", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) });
    return true;
  } catch (e) { Logger.log("Error sending video: " + e); return false; }
}

function editMessage(id, mid, txt) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/editMessageText", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, text: txt, parse_mode: "HTML" }) });
  } catch (e) {}
}

function editMessageReplyMarkup(id, mid, kb) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/editMessageReplyMarkup", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, reply_markup: (typeof kb === 'string' ? JSON.parse(kb) : {inline_keyboard: kb}) }) });
  } catch (e) {}
}

function handlePaymentScreenshot(id, n, photos, doc, username) {
  var fileId = "";
  var method = "";
  if (photos && photos.length > 0) { fileId = photos[photos.length - 1].file_id; method = "sendPhoto"; } 
  else if (doc) { fileId = doc.file_id; method = "sendDocument"; }
  
  if (!fileId) { sendMessage(adminId, "⚠️ Клієнт " + n + " щось надіслав, але формат не підтримується."); return; }

  var markup = JSON.stringify({
    inline_keyboard: [
      [{ text: "✅ Підтвердити", callback_data: "approve_pay_" + id + "_" + n }],
      [{ text: "❌ Відхилити", callback_data: "reject_pay_" + id }]
    ]
  });

  var caption = "💸 <b>ОПЛАТА!</b>\n👤 Від: " + n;
  var payload = { chat_id: String(adminId), caption: caption, parse_mode: "HTML", reply_markup: markup };
  if (method == "sendPhoto") payload.photo = fileId; else payload.document = fileId;

  try { UrlFetchApp.fetch(telegramUrl + "/" + method, { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); } 
  catch (e) { sendMessage(adminId, "⚠️ Помилка пересилання файлу."); }
}

function setMessageReaction(id, mid, em) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/setMessageReaction", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, reaction: [{type: "emoji", emoji: em}] }) });
  } catch (e) {}
}

function getExerciseVideoMap() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(exercisesSheetName);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var videoMap = {};
  for (var i = 0; i < data.length; i++) {
    var name = String(data[i][0]).trim().toLowerCase(); 
    var link = String(data[i][1]).trim(); 
    if (name && link) videoMap[name] = link;
  }
  return videoMap;
}

function cleanWorkoutName(str) { 
  return str.replace(/№/g, "").replace(/[^\w\sа-яА-ЯіІїЇєЄґҐ.,-]/gi, "").trim(); 
}

function getWorkoutDays(sheetName, specificStartRow) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var startRow = specificStartRow ? parseInt(specificStartRow) : getLatestCycleRow(sheetName);
  var lastRow = sheet.getLastRow();
  var limit = Math.min(lastRow, startRow + 100); 
  if (limit < startRow) return [];
  var data = sheet.getRange(startRow, 1, limit - startRow + 1, 1).getValues();
  var days = [];
  for (var i = 0; i < data.length; i++) {
    var cell = String(data[i][0]).trim();
    if (i > 0) { 
        if (cell.toLowerCase().includes("актуальний")) break;
        if (cell.match(/^ц\d+/i)) break; 
    }
    if (cell && !cell.toLowerCase().includes("актуальний") && !cell.match(/^ц\d+/i)) {
      if (days.indexOf(cell) === -1) days.push(cell);
    }
  }
  return days;
}
// 🔥 ОНОВЛЕНИЙ ПОШУК: ПОВНА ІНФОРМАЦІЯ НА КНОПКАХ
function findWorkout(dayName, sheetName, specificRow) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return { text: "❌ Немає листа.", buttons: [], found: false };

  var videoDB = getExerciseVideoMap();
  var exercisesDB = (typeof getExercisesDatabase === 'function') ? getExercisesDatabase() : {}; 
  
  var startRow = specificRow ? parseInt(specificRow) : getLatestCycleRow(sheetName);
  if (startRow < 1) startRow = 1; 

  var lastRow = sh.getLastRow();
  var rows = Math.min(300, lastRow - startRow + 1);
  if (rows <= 0) return { text: "❌ Порожньо.", buttons: [], found: false };

  var data = sh.getRange(startRow, 1, rows, 11).getDisplayValues(); 
  
  if (specificRow && data.length > 0) {
      dayName = String(data[0][0]); 
  }

  var search = cleanWorkoutName(dayName).toLowerCase();
  var cycleName = data[0][1];
  
  var msg = "<b>🏋️‍♂️ " + cleanWorkoutName(dayName);
  if (cycleName && String(cycleName).indexOf("Ц") > -1) msg += " (" + cycleName + ")";
  msg += "</b>\n\n";

  var foundDay = false;
  var curDay = "";
  var curEx = "";
  var btns = [];
  var has = false;
  var detectedRow = null; 
  
  var numEmoji = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
  var lineCounter = 0;

  for (var i = 0; i < data.length; i++) {
    if (data[i][0]) {
      curDay = cleanWorkoutName(data[i][0]).toLowerCase();
      if (foundDay && curDay !== search && curDay !== "") break;
    }

    if (curDay === search) {
      foundDay = true;
      if (detectedRow === null) detectedRow = startRow + i;

      var rawName = data[i][1];

      // --- НОВА ВПРАВА ---
      if (rawName && String(rawName).indexOf("Ц") !== 0) {
        curEx = rawName;
        var note = String(data[i][8]).trim();
        var noteText = note.length > 0 ? " <i>(" + note + ")</i>" : "";
        msg += "\n<b>📌 " + curEx + noteText + "</b>\n";
        has = true;
        lineCounter = 0; 
      }

      var planW = String(data[i][3]).trim();    
      var planS = String(data[i][4]).trim();    
      var planR = String(data[i][5]).trim();    
      var planTime = String(data[i][9]).trim(); 

      if (planW || planS || planR || planTime) {
        // Беремо категорію прямо з бази (STRENGTH або RUN)
var exCategory = exercisesDB[curEx.toLowerCase().trim()] || ""; 
var isRunExercise = (exCategory === "RUN");
        
        // --- Формування ТЕКСТУ для повідомлення ---
        var leftParts = [];
        if (planW) {
          if (planW.includes("%")) {
            // Тепер бот реально перевірить категорію в базі
            var prefix = (exCategory === "RUN") ? "Інтенсивність " : "1RM ";
            leftParts.push(prefix + planW);
          } else if (planW.match(/^\d+([.,]\d+)?$/) && exCategory !== "RUN") {
            leftParts.push(planW + " кг");
          } else {
            leftParts.push(planW);
          }
        }
        if (planTime) leftParts.push("час: " + planTime);
        
        var rightStr = "";
        if (planS && planR) rightStr = planS + " x " + planR;
        else if (planR) rightStr = planR;
        else if (planS) rightStr = planS + " підх.";

        var fullLine = (leftParts.join(", ") && rightStr) ? leftParts.join(", ") + " | " + rightStr : (leftParts.join(", ") || rightStr);

        if (fullLine) {
          var emoji = lineCounter < numEmoji.length ? numEmoji[lineCounter] : (lineCounter + 1) + ".";
          msg += emoji + " " + fullLine + "\n";
          lineCounter++;
        }

        // --- ФОРМУВАННЯ ТЕКСТУ ДЛЯ КНОПКИ (ЗБЕРІГАЄМО ВСЕ) ---
        var actualRow = startRow + i;
        var setsCount = parseInt(String(planS).match(/\d+/)) || 0;

        // Збираємо параметри для кнопки в один рядок
        var btnParams = [];
        if (planW) {
          var w = (planW.match(/^\d+([.,]\d+)?$/) && !isRunExercise) ? planW + "кг" : planW;
          btnParams.push(w);
        }
        if (planTime) btnParams.push("⏱" + planTime);
        if (planS && planR) btnParams.push(planS + "x" + planR);
        else if (planR) btnParams.push(planR);

        var btnText = "📌 " + curEx;
        if (btnParams.length > 0) {
          btnText += " (" + btnParams.join(" | ") + ")";
        }

        // Кнопка з повною назвою та параметрами
        btns.push([{ text: btnText, callback_data: "ignore" }]);

        // Кнопка трекера
        if (setsCount > 0) {
          btns.push([{ text: "Підходи: 0/" + setsCount, callback_data: "track_" + actualRow }]);
        }

        // Редагування
        var editRow = [];
        if (planTime || isRunExercise) editRow.push({ text: "⏱ Час", callback_data: "time_" + actualRow });
        editRow.push({ text: "✏️ Результат", callback_data: "edit_" + actualRow });
        btns.push(editRow);

        if (lineCounter === 1 && curEx && videoDB[curEx.trim().toLowerCase()]) {
          msg += "📹 <a href='" + videoDB[curEx.trim().toLowerCase()] + "'>Відео</a>\n";
        }
      } 
    }
  }

  if (!has) return { text: "Програму не знайдено.", buttons: [], found: false };
  return { text: msg, buttons: btns, found: true, row: detectedRow };
}


function getLatestCycleRow(sn) { 
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sn); if(!s)return 1;
  var lr = s.getLastRow(), d = s.getRange(1,1,lr,2).getValues();
  for(var i=0;i<d.length;i++) if(String(d[i][0]).toLowerCase().includes("актуальний")) return i+1;
  for(var i=0;i<d.length;i++) if(String(d[i][1]).match(/Ц(\d+).*Т(\d+)/i)) return i+1;
  return 1;
}

function handleTrackerClick(chatId, messageId, currentMarkup, row, sheetName) {
  if (!currentMarkup || !currentMarkup.inline_keyboard) return;

  var kb = currentMarkup.inline_keyboard;
  var targetBtn = null;
  var rI = -1, cI = -1;

  // 🔍 Пошук кнопки
  for (var i = 0; i < kb.length; i++) {
    for (var j = 0; j < kb[i].length; j++) {
      if (kb[i][j].callback_data == "track_" + row) {
        targetBtn = kb[i][j];
        rI = i; cI = j;
        break;
      }
    }
    if (targetBtn) break;
  }

  if (!targetBtn) return; // Кнопку не знайдено

  var text = targetBtn.text;
  var current = 0;
  var total = 0;

  // Парсинг тексту "Підходи: 1/4" або "✅ (4)"
  var matchNormal = text.match(/(\d+)\/(\d+)/);
  var matchDone = text.match(/✅ \((\d+)\)/);

  if (matchNormal) {
    current = parseInt(matchNormal[1]);
    total = parseInt(matchNormal[2]);
  } else if (matchDone) {
    total = parseInt(matchDone[1]);
    current = total; 
  } else {
    // Якщо формат невідомий, нічого не робимо
    return;
  }

  current++; 

  // Логіка оновлення тексту
  var newText = "";
  if (current > total) {
    current = 0; 
    newText = "Підходи: " + current + "/" + total;
  } else if (current == total) {
    newText = "✅ (" + total + ")";
  } else {
    newText = "Підходи: " + current + "/" + total;
  }

  // Оновлюємо текст кнопки в масиві
  kb[rI][cI].text = newText;

  // Відправляємо оновлення в Telegram
  try {
    UrlFetchApp.fetch(telegramUrl + "/editMessageReplyMarkup", {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        chat_id: String(chatId),
        message_id: messageId,
        reply_markup: { inline_keyboard: kb }
      })
    });
  } catch (e) {
    Logger.log("Error updating tracker: " + e);
  }
}

// ✅ ПАМ'ЯТЬ БОТА
function setUserState(id,s){PropertiesService.getScriptProperties().setProperty('state_'+id,s);}
function getUserState(id){return PropertiesService.getScriptProperties().getProperty('state_'+id);}
function deleteUserState(id){PropertiesService.getScriptProperties().deleteProperty('state_'+id);}

// ✅ ІНШІ ТЕХНІЧНІ ФУНКЦІЇ
function setWebhook() { 
  if(!webAppUrl||webAppUrl.includes("ВСТАВ_СЮДИ")){Logger.log("❌ ERROR: Встав посилання!");return;}
  Logger.log(UrlFetchApp.fetch(telegramUrl+"/setWebhook?url="+webAppUrl).getContentText());
}

function runSystemCheck(){return "✅ System OK";}

function sendUserListForAdmin(id,p){
  var d=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName).getRange("A2:B").getValues();
  var k=[],r=[];
  for(var i=0;i<d.length;i++) {
    if(d[i][0]&&String(d[i][0])!=adminId){
      r.push({text:d[i][1],callback_data:p+d[i][0]});
      if(r.length==2){k.push(r);r=[];}
    }
  }
  if(r.length>0)k.push(r);
  sendMessage(id,"👇 Обери:",JSON.stringify({inline_keyboard:k}));
}

function sendPersonalMessage(r){
  var i=r.indexOf(" ");if(i<0)return;
  var n=r.substring(0,i).toLowerCase(),m=r.substring(i+1);
  var s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName),d=s.getRange("A2:B").getValues();
  for(var j=0;j<d.length;j++)if(String(d[j][1]).toLowerCase().includes(n)){
    sendMessage(d[j][0],"📩 <b>Повідомлення:</b>\n\n"+m);sendMessage(adminId,"✅ Надіслано.");return;
  }
}

// ✅ НАГАДУВАННЯ ПРО ОПЛАТУ
function checkPaymentDates() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var data = s.getRange(2, 1, s.getLastRow() - 1, 4).getValues();
  
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var targetDay = tomorrow.getDate(); 

  for (var i = 0; i < data.length; i++) {
    var userId = data[i][0];
    var userName = data[i][1];
    var payDay = data[i][3]; 

    if (userId && payDay == targetDay) {
      try {
        var msg = "👋 Привіт, " + userName + "!\n\n" +
                  "Нагадую, що завтра (" + targetDay + "-го числа) день планової оплати тренувань.\n\n" +
                  "👇 <b>Напиши відповідь на це повідомлення:</b>\n" +
                  "• «Все за планом»\n" +
                  "• Або дату, коли зможеш оплатити (якщо є затримка).";
        
        sendMessage(userId, msg);
        setUserState(userId, "waiting_payment_response");
      } catch (e) {
        Logger.log("Не вдалося відправити нагадування: " + userId);
      }
    }
  }
}
/// ============================================================================
// 🚀 ОСНОВНА ЛОГІКА
// ============================================================================
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  // Дивимось, яку сторінку запитує посилання
  var route = params.page || null;
  // Ловимо ID
  var rawUid = params.uid || params.userId || "UNKNOWN";

  // 🏆 ВАРІАНТ 1: РЕЙТИНГ КРОКІВ (Нове!)
  if (route === 'leaderboard') {
    return HtmlService.createTemplateFromFile('LeaderboardApp').evaluate()
        .setTitle('Рейтинг активності')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } 

  // 📏 ВАРІАНТ 2: ЗАМІРИ ТІЛА
  else if (route === 'measurements') {
    // УВАГА: Перевір, чи файл називається MeasurementsView чи measurements
    var template = HtmlService.createTemplateFromFile('MeasurementsView'); 
    template.uid = rawUid; 
    return template.evaluate()
        .setTitle('Внесення замірів')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  } 
  
 // 🏋️ ВАРІАНТ 4: ТРЕКЕР ТРЕНУВАННЯ
  else if (route === 'tracker') {
    var template = HtmlService.createTemplateFromFile('TrackerApp');
    template.chatId = params.chatId || 'UNKNOWN';
    template.rowId = params.row || '0';
    template.sheetName = params.sheet || '';
    
    // 🔥 ЗАВАНТАЖУЄМО ДАНІ ВПРАВ
    var trackerData = getExerciseDataForTracker(template.chatId, template.rowId, template.sheetName);
    trackerData.chatId = template.chatId;
    var tUserInfo = getUserInfo(template.chatId);
    trackerData.userName = tUserInfo ? tUserInfo.name : 'User';
    template.exercisesJSON = JSON.stringify(trackerData);
    return template.evaluate()
        .setTitle('Трекер вправ')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }
  
  // 📋 ВАРІАНТ 3: АНКЕТА НОВАЧКА (за замовчуванням)
  else {
    var template = HtmlService.createTemplateFromFile('Anketa');
    template.serverUserId = rawUid; 
    return template.evaluate()
        .setTitle('Анкета Новачка')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
}
function doPost(e) {
  try {
    if (!e || !e.postData) return;
    
    // 🔥 МИТТЄВЕ ЗБЕРЕЖЕННЯ (не видаляй це, це логіка карток)
    if (e.parameter && e.parameter.action === 'save_instant') {
      try {
        writeExerciseResult(e.parameter.sheetName, e.parameter.row, e.parameter.result);
        sendMessage(e.parameter.chatId, "✅ Збережено!");
        return ContentService.createTextOutput('OK');
      } catch(err) {
        return ContentService.createTextOutput('ERROR: ' + err.toString());
      }
    }
    
    var contents = JSON.parse(e.postData.contents);
    // ТЕСТ D видалено звідси

    // --- ОБРОБКА КНОПОК (CALLBACK) ---
    if (contents.callback_query) {
      var cb = contents.callback_query;
      var chatId = cb.message.chat.id;
      var data = cb.data;
      var messageId = cb.message.message_id;
      var fromName = cb.from.first_name;
      var username = cb.from.username;
      

      // Глушилка
      if (data == "ignore") {
        try { UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { method: "post", payload: JSON.stringify({ callback_query_id: cb.id, text: "Це назва вправи 👆" }) }); } catch(e) {}
        return;
      }
      if (data == "steps_enter") {
          setUserState(chatId, "waiting_steps");
          sendMessage(chatId, "👣 <b>Введи кількість кроків за сьогодні:</b>\n(тільки число, напр. <code>12500</code>)");
          try { UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { method: "post", payload: JSON.stringify({ callback_query_id: cb.id }) }); } catch(e) {}
          return;
      }
      // Відкрити список рецептів
      if (data == "nutri_recipes") {
        sendRecipesList(chatId, messageId);
        return;
      }

      // Повернутися назад до меню харчування
      if (data == "nutri_back_from_recipes") {
        var nutritionKb = [
          [{text: "🎯 Мої норми КБЖВ", callback_data: "nutri_norms"}],
          [{text: "📖 Рецепти страв", callback_data: "nutri_recipes"}],
          [{text: "📅 Архів звітів", callback_data: "nutri_archive_ask"}],
          [{text: "🔙 Назад", callback_data: "back_to_main"}]
        ];
        editMessage(chatId, messageId, "📊 <b>Твій щоденник харчування</b>");
        editMessageReplyMarkup(chatId, messageId, JSON.stringify({inline_keyboard: nutritionKb}));
        return;
      }

      // --- АДМІН: ПЕРЕГЛЯД ЩОДЕННИКІВ ---
      if (data == "admin_nutri_list") {
          sendUserListForAdmin(chatId, "admin_see_food_");
          return;
      }
      
      // Коли адмін обрав клієнта -> Питаємо дату
      if (data.indexOf("admin_see_food_") === 0) {
          var targetId = data.split("_")[3];
          var kb = [
             [{text: "📅 За сьогодні", callback_data: "admin_rep_today_" + targetId}],
             [{text: "🗓 Архів (Ввести дату)", callback_data: "admin_rep_date_" + targetId}]
          ];
          sendMessage(chatId, "Обери дату звіту для цього клієнта:", JSON.stringify({inline_keyboard: kb}));
          return;
      }

      // Звіт за сьогодні
      if (data.indexOf("admin_rep_today_") === 0) {
          sendDailyNutritionReport(chatId, new Date(), data.split("_")[3]);
          return;
      }

      // Запит дати архіву
      if (data.indexOf("admin_rep_date_") === 0) {
          var uid = data.split("_")[3];
          setUserState(chatId, "admin_wait_date_" + uid);
          sendMessage(chatId, "✍️ Введи дату (напр. 25.01):");
          return;
      }

      // 📸 ПОКАЗАТИ ФОТО (При натисканні кнопки у звіті)
      if (data.indexOf("show_ph_") === 0) {
         var parts = data.split("_");
         var targetUid = parts[2];
         var targetDateStr = parts[3]; // Дата у форматі dd.MM.yyyy
         
         sendMessage(chatId, "⏳ Завантажую фото за " + targetDateStr + "...");
         sendFoodPhotosAlbum(chatId, targetUid, targetDateStr);
         return;
      }
      // 📊 ДЕТАЛЬНИЙ ЗВІТ ЗА ДЕНЬ
if (data.indexOf("detailed_day_") === 0) {
  var parts = data.replace("detailed_day_", "").split("_");
  var targetUid = parts[0];
  var targetDateStr = parts.slice(1).join("_"); // dd.MM.yyyy

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var allData = sheet.getDataRange().getValues();

  var msg = "📊 <b>ДЕТАЛЬНИЙ ЗВІТ</b> за " + targetDateStr + ":\n\n";
  var totalKcal = 0, totalP = 0, totalF = 0, totalC = 0, totalFiber = 0;
  var count = 0;

  for (var i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) == String(targetUid)) {
      var cellDate = allData[i][2];
      var checkDate = (cellDate instanceof Date) 
        ? Utilities.formatDate(cellDate, "GMT+2", "dd.MM.yyyy") 
        : String(cellDate);

      if (checkDate == targetDateStr && String(allData[i][4]) !== "Кроки") {
        count++;
        var kcal = Number(allData[i][5]) || 0;
        var p = Number(allData[i][6]) || 0;
        var f = Number(allData[i][7]) || 0;
        var c = Number(allData[i][8]) || 0;
        var fib = Number(allData[i][9]) || 0;
        var time = (allData[i][3] instanceof Date) 
          ? Utilities.formatDate(allData[i][3], "GMT+2", "HH:mm") 
          : String(allData[i][3]).substring(0, 5);

        msg += "🍽 <b>Прийом #" + count + " (" + time + ")</b>\n";
        msg += "📝 " + allData[i][4] + "\n";
        msg += "🔥 " + Math.round(kcal) + " ккал | ";
        msg += "Б:" + Math.round(p) + " Ж:" + Math.round(f) + " В:" + Math.round(c);
        if (fib > 0) msg += " Кл:" + Math.round(fib);
        msg += "\n\n";

        totalKcal += kcal;
        totalP += p;
        totalF += f;
        totalC += c;
        totalFiber += fib;
      }
    }
  }

  if (count === 0) {
    sendMessage(chatId, "📅 Записів за " + targetDateStr + " не знайдено.");
  } else {
    msg += "━━━━━━━━━━━━━━━━\n";
    msg += "🏆 <b>ВСЬОГО ЗА ДЕНЬ:</b>\n";
    msg += "🔥 Ккал: <b>" + Math.round(totalKcal) + "</b>\n";
    msg += "🥩 Білки: <b>" + Math.round(totalP) + " г</b>\n";
    msg += "🥑 Жири: <b>" + Math.round(totalF) + " г</b>\n";
    msg += "🍞 Вуглеводи: <b>" + Math.round(totalC) + " г</b>\n";
    msg += "🥗 Клітковина: <b>" + Math.round(totalFiber) + " г</b>";
    sendMessage(chatId, msg);
  }

  try { 
    UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
      method: "post", 
      payload: JSON.stringify({ callback_query_id: cb.id }) 
    }); 
  } catch(e) {}
  return;
}
      // --- ХАРЧУВАННЯ ---
      if (data == "nutri_report_today") { sendDailyNutritionReport(chatId); return; }
      if (data == "nutri_norms") {
          sendMyNorms(chatId);
          return;
      }
      
      // Кнопка: Відкрити меню внесення
      if (data == "nutri_add") {
         sendMessage(chatId, "🍽 <b>Режим Харчування</b>\n\n📸 Скинь фото\n🎙 Запиши голосове\n✍️ Напиши текст");
         setUserState(chatId, "nutrition_mode");
         return;
      }
      
      // 👇 НОВА КНОПКА: ЗАПИТ АРХІВУ
      if (data == "nutri_archive_ask") {
         setUserState(chatId, "waiting_for_date_report");
         sendMessage(chatId, "📅 <b>Введи дату звіту:</b>\n\nМожна писати як зручно:\n🔹 <code>25</code> (за 25 число цього місяця)\n🔹 <code>25 01</code> (день і місяць)\n🔹 <code>25.01.2025</code> (повна дата)");
         return;
      }

      // Кнопка: Підтвердити запис (LOOP MODE)
      if (data == "nutri_confirm_save") {
         var temp = PropertiesService.getScriptProperties().getProperty("temp_nutri_" + chatId);
         if (temp) {
            var meal = JSON.parse(temp);
            saveNutritionToSheet(chatId, fromName, meal);
            PropertiesService.getScriptProperties().deleteProperty("temp_nutri_" + chatId);
            
            // Отримуємо норми
            var targets = getUserTargets(chatId);
            
            // Формуємо коротке повідомлення
            var shortMsg = "✅ <b>ЗАПИСАНО!</b>\n\n";
shortMsg += "🔥 Спожито: <b>" + Math.round(Number(meal.calories)||0) + " ккал</b>";
if (targets.kcal > 0) shortMsg += " з " + targets.kcal;
shortMsg += "\n🥩 Білки: <b>" + Math.round(Number(meal.p)||0) + " г</b>";
if (targets.p > 0) shortMsg += " з " + targets.p;
shortMsg += "\n🥑 Жири: <b>" + Math.round(Number(meal.f)||0) + " г</b>";
if (targets.f > 0) shortMsg += " з " + targets.f;
shortMsg += "\n🍞 Вуглеводи: <b>" + Math.round(Number(meal.c)||0) + " г</b>";
            
            editMessage(chatId, messageId, shortMsg);
            
            var kb = [[{text: "📊 Звіт за день", callback_data: "nutri_report_today"}], [{text: "🔙 Головне меню", callback_data: "back_to_main"}]];
            sendMessage(chatId, "🥣 Додамо ще щось? Кидай наступне фото 👇", JSON.stringify({inline_keyboard: kb}));
            
            setUserState(chatId, "nutrition_mode");
         } else {
            sendMessage(chatId, "⚠️ Дані застаріли або вже записані.");
         }
         return;
      }

      // Кнопка: Корективи
      if (data == "nutri_correct_ask") {
         setUserState(chatId, "waiting_for_food_correction");
         sendMessage(chatId, "✍️ <b>Режим редагування</b>\n\nНапиши текст АБО <b>запиши голосове</b> з правками.\n(напр. <i>'Це не курка, а індичка'</i>).");
         return;
      }
      if (data == "nutri_detailed") {
         var temp = PropertiesService.getScriptProperties().getProperty("temp_nutri_" + chatId);
         if (!temp) {
             sendMessage(chatId, "⚠️ Дані застаріли.");
             return;
         }
         
         var saved = JSON.parse(temp);
         var items = saved.original_items || [];
         
         var detailMsg = "📊 <b>ДЕТАЛЬНИЙ РОЗКЛАД:</b>\n\n";
         for (var i = 0; i < items.length; i++) {
             var it = items[i];
             detailMsg += "🔹 <b>" + it.name + " — " + it.weight + "г</b>\n";
             detailMsg += "   └ " + Math.round(Number(it.kcal)||0) + " ккал (Б:" + Math.round(Number(it.p)||0) + " Ж:" + Math.round(Number(it.f)||0) + " В:" + Math.round(Number(it.c)||0) + ")\n\n";
         }
         
         detailMsg += "━━━━━━━━━━━━━━━━\n";
         detailMsg += "🏆 <b>ЗАГАЛОМ:</b>\n";
         detailMsg += "🔥 <b>" + Math.round(Number(saved.calories)||0) + " ккал</b>\n";
         detailMsg += "🥩 Білки: <b>" + Math.round(Number(saved.p)||0) + " г</b>\n";
         detailMsg += "🥑 Жири: <b>" + Math.round(Number(saved.f)||0) + " г</b>\n";
         detailMsg += "🍞 Вуглеводи: <b>" + Math.round(Number(saved.c)||0) + " г</b>\n";
         detailMsg += "🥗 Клітковина: <b>" + Math.round(Number(saved.fiber)||0) + " г</b>";
         
         sendMessage(chatId, detailMsg);
         return;
      }

      if (data == "back_to_main") {
         deleteUserState(chatId);
         sendModeSelector(chatId, fromName); 
         return;
      }

      // 1. ВХІД НОВАЧКА
      if (data == "start_request") {
        editMessage(chatId, messageId, "✅ <b>Заявку надіслано!</b>\nТренер отримав твій запит. Очікуй повідомлення.");
        
        var userLink = username ? "https://t.me/" + username : "tg://user?id=" + chatId;
        var adminMsg = "🔔 <b>НОВА ЗАЯВКА!</b>\n👤 " + fromName + "\n🆔 " + chatId + "\n🔗 " + userLink;
        
        var adminKb = [
          [{text: "💬 Написати", url: userLink}],
          [{text: "✅ Додати клієнта", callback_data: "fast_add_" + chatId + "_" + fromName}],
          [{text: "💰 Виставити рахунок", callback_data: "invoice_ask_" + chatId}]
        ];
        sendMessage(adminId, adminMsg, JSON.stringify({inline_keyboard: adminKb}));
        return;
      }

      // 2. АДМІН: Додати клієнта
      if (data.indexOf("fast_add_") === 0) {
        var parts = data.split("_");
        addUserToSheet(parts[2], parts[3] || "User");
        editMessage(chatId, messageId, "✅ Клієнта додано в базу.");
        sendMessage(parts[2], "🎉 <b>Вітаю в команді!</b>\nДоступ відкрито. Тисни /start");
        return;
      }

      // 3. АДМІН: Виставити рахунок
      if (data.indexOf("invoice_ask_") === 0) {
        var uid = data.split("_")[2];
        setUserState(chatId, "admin_invoice_wait_" + uid);
        sendMessage(chatId, "💰 Введи суму рахунку:");
        return;
      }
      
      // 4. КЛІЄНТ: Оплатив
      if (data == "i_have_paid") {
        var adminMarkup = JSON.stringify({
          inline_keyboard: [
            [{ text: "✅ Підтвердити", callback_data: "approve_pay_" + chatId + "_" + fromName }],
            [{ text: "❌ Відхилити", callback_data: "reject_pay_" + chatId }]
          ]
        });
        sendMessage(adminId, "💸 <b>Клієнт " + fromName + " натиснув 'Я оплатив'!</b>\nПідтвердити?", adminMarkup);
        editMessage(chatId, messageId, "✅ <b>Сповіщення надіслано!</b>\nОчікуй підтвердження.");
        deleteUserState(chatId);
        return;
      }

      // 5. АРХІВ
      if (data.indexOf("arc_week_") === 0) {
        var parts = data.split("_");
        var activeSheet = getActiveSheetForUser(chatId);
        if(activeSheet) sendArchiveDaysMenu(chatId, activeSheet, parseInt(parts[2]), parts[3]);
        return;
      }
      if (data.indexOf("arc_day_") === 0) {
        var prefix = "arc_day_";
        var rest = data.substring(prefix.length);
        var firstUnderscore = rest.indexOf("_");
        var row = rest.substring(0, firstUnderscore);
        var dayName = rest.substring(firstUnderscore + 1);
        var activeSheet = getActiveSheetForUser(chatId);
        
        if (activeSheet) {
           var wo = findWorkout(dayName, activeSheet, row);
           sendMessage(chatId, "🗄 <b>АРХІВ:</b>\n" + wo.text);
        }
        return;
      }

      // --- АДМІН ФУНКЦІОНАЛ ---
      if (String(chatId) == adminId) {
        if (data == "admin_remind_menu") {
           var kb = [
             [{text: "📢 Всім одразу", callback_data: "remind_all"}],
             [{text: "👤 Обрати клієнта", callback_data: "admin_remind_select"}]
           ];
           editMessage(chatId, messageId, "🤔 <b>Кому нагадати про звіт?</b>");
           editMessageReplyMarkup(chatId, messageId, JSON.stringify({inline_keyboard: kb}));
           return;
        }
        // 1. Показуємо список користувачів для вибору
        if (data == "admin_send_anketa_menu") {
           sendUserListForAdmin(chatId, "send_anketa_to_"); 
           return;
        }

        // Коли тренер вибрав клієнта зі списку для відправки анкети
        if (data.indexOf("send_anketa_to_") === 0) {
           var targetId = data.split("_")[3];
           
           // Викликаємо функцію з параметром true (Режим Анкети)
           sendWelcomeMessage(targetId, true); 
           
           editMessage(chatId, messageId, "✅ Анкету надіслано користувачу.");
           return;
        }
        if (data == "remind_all") {
           sendReminderToAll();
           editMessage(chatId, messageId, "✅ Надіслано всім клієнтам.");
           return;
        }
        if (data == "admin_remind_select") {
           sendUserListForAdmin(chatId, "remind_one_"); 
           return; 
        }
        if (data.indexOf("remind_one_") === 0) {
           var targetId = data.split("_")[2];
           sendMessage(targetId, "Вітаю 👋 чекаю на фотозвіт");
           editMessage(chatId, messageId, "✅ Надіслано.");
           return;
        }
        if (data == "admin_test_newcomer") { sendWelcomeMessage(chatId); return; }
        if (data == "admin_share_link") {
           var link = "https://t.me/" + botUsername.replace("@", "");
           sendMessage(chatId, "🔗 <b>Твоє посилання:</b>\n(Натисни, щоб скопіювати)\n\n<code>" + link + "</code>");
           return;
        }
        
        if (data.indexOf("approve_pay_") === 0) {
            var parts = data.split("_");
            var uId = parts[2];
            var uName = parts[3] || "User";
            addUserToSheet(uId, uName);
            editMessage(chatId, messageId, "✅ Оплату підтверджено для: " + uName);
            sendMessage(uId, "🎉 <b>Оплату підтверджено!</b>\nТвій доступ відкрито. Тисни /start");
            sendMessage(adminId, "🔔 <b>Клієнта (" + uName + ") активовано!</b>");
            return;
        }
        if (data.indexOf("reject_pay_") === 0) {
            var uId = data.split("_")[2];
            sendMessage(uId, "❌ Оплату не підтверджено. Напиши тренеру.");
            editMessage(chatId, messageId, "⛔️ Відхилено.");
            return;
        }
        
        if (data.indexOf("prev_day_") === 0) {
            var p = data.replace("prev_day_","").split("_");
            var userInfo = getUserInfo(p[0]);
            var sheet = userInfo ? userInfo.gymSheet : null; 
            if (!sheet) sheet = userInfo.homeSheet;

            if (sheet) {
                var wo = findWorkout(p[1], sheet, null); 
                var mk = wo.buttons.length ? JSON.stringify({inline_keyboard:[[{text:"📊 Трекер показників (Preview)",callback_data:"prev_op_"+p[0]}]]}) : null;
                sendMessage(chatId, "👁 "+wo.text, mk);
            }
            return;
        }
        // 👁 ПЕРЕГЛЯД ТРЕНУВАНЬ КЛІЄНТА
        if (data == "admin_view_training") {
          sendUserListForAdmin(chatId, "adm_vt_");
          return;
        }

        if (data.indexOf("adm_vt_") === 0) {
          var targetId = data.replace("adm_vt_", "");
          var targetUser = getUserInfo(targetId);
          if (!targetUser) {
            sendMessage(chatId, "❌ Клієнта не знайдено.");
            return;
          }

          var stats = getUserTrainingStats(targetId);
          var statsText = "";
          if (stats.startDate) {
            statsText += "\n📅 Абонемент з: <b>" + stats.startDate + "</b>";
          }
          if (stats.total > 0) {
            statsText += "\n📋 Залишилось тренувань: <b>" + stats.remaining + "/" + stats.total + "</b>";
          }

          var hasGym = targetUser.gymSheet && isValidSheet(targetUser.gymSheet);
          var hasRun = targetUser.runSheet && isValidSheet(targetUser.runSheet);

          // Якщо тільки одна програма — одразу показуємо дні
          if (hasGym && !hasRun) {
            PropertiesService.getScriptProperties().setProperty("adm_view_sheet_" + targetId, targetUser.gymSheet);
            var days = getWorkoutDays(targetUser.gymSheet, null);
            var dKb = [];
            for (var d = 0; d < days.length; d++) {
              dKb.push([{text: "📅 " + days[d], callback_data: "adm_vd_" + targetId + "_" + days[d].replace(/\s+/g, "_")}]);
            }
            dKb.push([{text: "⬅️ Назад", callback_data: "admin_view_training"}]);
            sendMessage(chatId, "👤 <b>" + targetUser.name + "</b>" + statsText + "\n\nОбери день:", JSON.stringify({inline_keyboard: dKb}));
            return;
          }

          if (hasRun && !hasGym) {
            PropertiesService.getScriptProperties().setProperty("adm_view_sheet_" + targetId, targetUser.runSheet);
            var days = getWorkoutDays(targetUser.runSheet, null);
            var dKb = [];
            for (var d = 0; d < days.length; d++) {
              dKb.push([{text: "📅 " + days[d], callback_data: "adm_vd_" + targetId + "_" + days[d].replace(/\s+/g, "_")}]);
            }
            dKb.push([{text: "⬅️ Назад", callback_data: "admin_view_training"}]);
            sendMessage(chatId, "👤 <b>" + targetUser.name + "</b>" + statsText + "\n\nОбери день:", JSON.stringify({inline_keyboard: dKb}));
            return;
          }

          if (!hasGym && !hasRun) {
            sendMessage(chatId, "⚠️ У клієнта <b>" + targetUser.name + "</b> немає активних програм." + statsText);
            return;
          }

          // Дві програми — показуємо вибір
          var vtKb = [];
          if (hasGym) vtKb.push([{text: "🏋️ " + targetUser.gymHeader, callback_data: "adm_vs_" + targetId + "_gym"}]);
          if (hasRun) vtKb.push([{text: "🏃 " + targetUser.runHeader, callback_data: "adm_vs_" + targetId + "_run"}]);
          sendMessage(chatId, "👤 <b>" + targetUser.name + "</b>" + statsText + "\n\nОбери програму:", JSON.stringify({inline_keyboard: vtKb}));
          return;
        }

        if (data.indexOf("adm_vs_") === 0) {
          var parts = data.replace("adm_vs_", "").split("_");
          var targetId = parts[0];
          var mode = parts[1]; // gym або run
          var targetUser = getUserInfo(targetId);
          if (!targetUser) { sendMessage(chatId, "❌ Помилка."); return; }

          var sheetName = (mode === "run") ? targetUser.runSheet : targetUser.gymSheet;
          if (!sheetName || !isValidSheet(sheetName)) {
            sendMessage(chatId, "⚠️ Програму не знайдено.");
            return;
          }

          // Зберігаємо лист в кеш щоб не передавати в callback
          PropertiesService.getScriptProperties().setProperty("adm_view_sheet_" + targetId, sheetName);

          var days = getWorkoutDays(sheetName, null);
          var dKb = [];
          for (var d = 0; d < days.length; d++) {
            dKb.push([{text: "📅 " + days[d], callback_data: "adm_vd_" + targetId + "_" + days[d].replace(/\s+/g, "_")}]);
          }
          if (dKb.length === 0) {
            sendMessage(chatId, "⚠️ Днів тренувань не знайдено.");
          } else {
            dKb.push([{text: "⬅️ Назад", callback_data: "adm_vt_" + targetId}]);
            sendMessage(chatId, "📂 <b>" + targetUser.name + "</b>\nОбери день:", JSON.stringify({inline_keyboard: dKb}));
          }
          return;
        }

        if (data.indexOf("adm_vd_") === 0) {
          var rest = data.replace("adm_vd_", "");
          var firstUnd = rest.indexOf("_");
          var targetId = rest.substring(0, firstUnd);
          var dayLabel = rest.substring(firstUnd + 1).replace(/_/g, " ");

          var targetUser = getUserInfo(targetId);
          if (!targetUser) { sendMessage(chatId, "❌ Помилка."); return; }

          // Беремо назву листа з кешу
          var sheetName = PropertiesService.getScriptProperties().getProperty("adm_view_sheet_" + targetId);
          if (!sheetName) { sendMessage(chatId, "⚠️ Сесія застаріла. Спробуй ще раз."); return; }

          var backKb = JSON.stringify({inline_keyboard: [[{text: "⬅️ Назад до днів", callback_data: "adm_vt_" + targetId}]]});

          var wo = findWorkout(dayLabel, sheetName, null);
          if (wo.found) {
            sendMessage(chatId, "👁 <b>" + targetUser.name + "</b>\n\n" + wo.text, backKb);
          } else {
            sendMessage(chatId, "❌ Тренування для <b>" + dayLabel + "</b> не знайдено.", backKb);
          }
          return;
        }
        if (data=="admin_mode_plan") { sendUserListForAdmin(chatId, "send_plan_"); return; }
        if (data=="admin_mode_invoice") { sendUserListForAdmin(chatId, "invoice_ask_"); return; }
        
        if (data=="admin_broadcast_start") { setUserState(chatId, "waiting_broadcast_text"); sendMessage(chatId, "📢 Текст розсилки:"); return; }
        if (data.indexOf("send_plan_")===0) { sendMessage(data.split("_")[2], "🔥 <b>Новий план готовий!</b>"); editMessage(chatId, messageId, "✅ Надіслано."); return; }
      }
      if (data.indexOf("send_anketa_to_") === 0) {
           var targetId = data.split("_")[3];
           sendWelcomeMessage(targetId, true); // Виклик в режимі "Анкета за запитом"
           editMessage(chatId, messageId, "✅ Анкету надіслано користувачу.");
           return;
        }

     // 🔥 ШВИДКИЙ ТРЕКЕР (Пошук по рядку)
      if (data.indexOf("show_tracker_") === 0) {
        try { 
           UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
              method: "post", payload: JSON.stringify({ callback_query_id: cb.id }) 
           }); 
        } catch(e) {}

        var rowId = data.replace("show_tracker_", ""); 
        var activeSheet = getActiveSheetForUser(chatId);

        if (!activeSheet || !isValidSheet(activeSheet)) {
             var u = getUserInfo(chatId);
             if (u) activeSheet = u.gymSheet || u.runSheet;
        }

        if (activeSheet) {
          // 🔥 ВІДКРИВАЄМО WEB APP ЗАМІСТЬ КНОПОК
          var trackerUrl = webAppUrl + "?page=tracker&chatId=" + chatId + "&row=" + rowId + "&sheet=" + encodeURIComponent(activeSheet);
          
          var kb = {
            inline_keyboard: [[{
              text: "📊 Відкрити трекер", 
              web_app: { url: trackerUrl }
            }]]
          };
          sendMessage(chatId, "🏋️‍♂️ <b>Трекер тренування</b>\n\nНатисни кнопку нижче щоб відкрити інтерактивний трекер:", JSON.stringify(kb));
        } else {
          sendMessage(chatId, "⚠️ Помилка: Програма не знайдена.");
        }
        return;
      }
      // 🔥 ЗАПИСАТИ ЧАС (для бігових)
      if (data.indexOf("time_") === 0) {
        try { 
          UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
            method: "post", 
            payload: JSON.stringify({ callback_query_id: cb.id }) 
          }); 
        } catch(e) {}
        
        var rowToEdit = data.split("_")[1];
        var activeSheet = getActiveSheetForUser(chatId);
        
        if (!activeSheet) {
          var u = getUserInfo(chatId);
          if (u) activeSheet = u.gymSheet || u.runSheet;
        }
        
        if (activeSheet) {
          setUserState(chatId, "waiting_for_time_" + rowToEdit + "_" + activeSheet);
          sendMessage(chatId, "⏱ <b>Введи час:</b>\nНаприклад: <code>4.30</code> або <code>4:15 хв/км</code>");
        } else {
          sendMessage(chatId, "❌ Помилка: не вдалося визначити програму.");
        }
        return;
      }

     // 🔥 РЕДАГУВАННЯ РЕЗУЛЬТАТУ
      if (data.indexOf("edit_") === 0) {
        try { 
          UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
            method: "post", 
            payload: JSON.stringify({ callback_query_id: cb.id }) 
          }); 
        } catch(e) {}
        
        var rowToEdit = data.split("_")[1];
        var activeSheet = getActiveSheetForUser(chatId);
        
        if (!activeSheet) {
          var u = getUserInfo(chatId);
          if (u) activeSheet = u.gymSheet || u.runSheet;
        }
        
        if (activeSheet) {
          // 🔥 Читаємо дані вправи для прикладу
          var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(activeSheet);
          var rowData = sh.getRange(parseInt(rowToEdit), 2, 1, 5).getDisplayValues()[0];
          var exName = rowData[0] || "Вправа";
          var planW = rowData[2] || "";
          var planS = rowData[3] || "";
          var planR = rowData[4] || "";
          
          // 🔥 Витягуємо тільки числа для прикладів
          var numW = planW.match(/[\d+.,]+/) ? planW.match(/[\d+.,]+/)[0] : "10";
          var numS = planS.match(/\d+/) ? planS.match(/\d+/)[0] : "4";
          var numR = planR.match(/\d+/) ? planR.match(/\d+/)[0] : "10";
          
          setUserState(chatId, "waiting_for_edit_" + rowToEdit + "_" + activeSheet);
          sendMessage(chatId, "✏️ <b>Зміни для: " + exName + "</b>\n\n" +
            "План: " + (planW || "-") + " | " + (planS || "-") + " x " + (planR || "-") + "\n\n" +
            "Введи нові дані:\n" +
            "<code>" + numW + "</code> — тільки вага\n" +
            "<code>" + numW + " " + numS + " " + numR + "</code> — вага, підходи, повтори");
        } else {
          sendMessage(chatId, "❌ Помилка: не вдалося визначити програму.");
        }
        return;
      }
      // ✅ ТРЕКЕР (ВИПРАВЛЕНО)
      if (data.indexOf("track_") === 0) {
        // 1. Зупиняємо спіннер (щоб не крутилося вічно)
        try { 
           UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
              method: "post", 
              payload: JSON.stringify({ callback_query_id: cb.id }) 
           }); 
        } catch(e) {}

        var row = parseInt(data.split("_")[1]);
        var activeSheet = getActiveSheetForUser(chatId);
        
        // 🔥 СТРАХОВКА: Якщо бот "забув" активний лист, шукаємо його знову
        if (!activeSheet || !isValidSheet(activeSheet)) {
             var u = getUserInfo(chatId);
             // Якщо користувач натиснув кнопку, ми не знаємо точно чи це біг чи зал, 
             // але ми можемо спробувати вгадати або перевірити обидва, 
             // але для простоти візьмемо той, що записаний в профілі.
             if (u) {
                // Пріоритет: якщо це виглядає як силове, беремо gymSheet, інакше runSheet
                // Або просто беремо gymSheet, якщо він є.
                activeSheet = u.gymSheet || u.runSheet;
             }
        }

        if (activeSheet && isValidSheet(activeSheet)) {
           handleTrackerClick(chatId, messageId, cb.message.reply_markup, row, activeSheet);
        } else {
           // Якщо лист так і не знайшли
           sendMessage(chatId, "⚠️ Помилка: Не можу визначити програму. Перезапусти бот через /start");
        }
        return;
      }
      /// 1. Користувач обрав категорію (напр. "Ноги")
      if (data.indexOf("vid_cat_") === 0) {
        var selectedCategory = data.replace("vid_cat_", "");
        sendVideoByCategory(chatId, selectedCategory); // Ця функція покаже список вправ
        return;
      }

      // 2. Користувач натиснув кнопку "Назад"
      if (data === "video_back") {
        sendVideoInstructions(chatId, messageId); // Передаємо messageId для редагування
        return;
      }
      
// 🔥 Р/В РЕЖИМ - обробка кнопок
      if (data === "mev_back") {
        var u = getUserInfo(chatId);
        sendModeSelector(chatId, u ? u.name : "");
        return;
      }

      if (data === "mev_days") {
        sendDaySelector(chatId);
        return;
      }

      if (data.indexOf("mev_day_") === 0) {
        var dayLabel = data.replace("mev_day_", "").replace(/_/g, " ");
        sendMorningEveningSelector(chatId, dayLabel);
        return;
      }

      if (data.indexOf("mev_show_") === 0) {
        // Формат: mev_show_День_1_M_SheetName або mev_show_День_1_E_SheetName
        var parts = data.replace("mev_show_", "");
        var mMatch = parts.match(/(.+)_(M|E|S)_(.+)/);
        
        if (mMatch) {
          var dayLabel = mMatch[1].replace(/_/g, " ");
          var timeCode = mMatch[2]; // M=morning, E=evening, S=single
          var sheetName = mMatch[3].replace(/_/g, " ");
          
          sendMevDayPlan(chatId, dayLabel, sheetName);
        }
        return;
      }
      if (data.indexOf("mev_tracker_") === 0) {
        // 🔥 Зупиняємо спіннер одразу
        try { 
          UrlFetchApp.fetch(telegramUrl + "/answerCallbackQuery", { 
            method: "post", 
            payload: JSON.stringify({ callback_query_id: cb.id }) 
          }); 
        } catch(e) {}

        var parts = data.replace("mev_tracker_", "");
        var mMatch = parts.match(/(.+)_(M|E|S)_(.+)/);
        
        if (mMatch) {
          var dayLabel = mMatch[1].replace(/_/g, " ");
          var sheetNameEncoded = mMatch[3];
          var sheetName = decodeSheetName(sheetNameEncoded, chatId);
          
          setActiveSheetForUser(chatId, sheetName);
          
          // 🔥 Додаємо варіанти з "ранок/вечір"
          var dayVariants = [
            dayLabel,
            dayLabel.replace("День ", "День №"),
            dayLabel.replace("День ", "День №") + " ранок",
            dayLabel.replace("День ", "День №") + " вечір"
          ];
          
          var wo = null;
          for (var i = 0; i < dayVariants.length; i++) {
            wo = findWorkout(dayVariants[i], sheetName, null);
            if (wo.found) break;
          }
          
          if (wo && wo.found && wo.buttons && wo.buttons.length > 0) {
            editMessageReplyMarkup(chatId, messageId, JSON.stringify({ inline_keyboard: wo.buttons }));
          } else {
            sendMessage(chatId, "⚠️ Не вдалося завантажити трекер.");
          }
        }
        return;
      }
      // 🔥 КІНЕЦЬ НОВОГО БЛОКУ ↑↑↑
      if (data == "show_instruction_now") { sendBotInstruction(chatId); return; }
    }
    
    
    
    
    // 🔥 WEB APP ДАНІ ПРИХОДЯТЬ В MESSAGE
    if (contents.message && contents.message.web_app_data) {
      try {
        var webData = JSON.parse(contents.message.web_app_data.data);
        var chatId = contents.message.from.id;
        
        // 🔥 МИТТЄВЕ ЗБЕРЕЖЕННЯ ОДНІЄЇ ВПРАВИ
        if (webData.action === "save_one_exercise") {
          writeExerciseResult(webData.sheetName, webData.row, webData.result);
          sendMessage(chatId, "✅ Збережено!");
          return;
        }
        
        // 🔥 ЗБЕРЕЖЕННЯ ВСІХ ВПРАВ
        if (webData.action === "save_tracker") {
          var sheetName = webData.sheetName;
          var exercises = webData.exercises || [];
          
          for (var i = 0; i < exercises.length; i++) {
            var ex = exercises[i];
            if (ex.changed) {
              var resultText = ex.weight + " " + ex.sets + " " + ex.reps;
              writeExerciseResult(sheetName, ex.row, resultText);
            }
          }
          sendMessage(chatId, "✅ <b>Результати збережено!</b>");
        }
      } catch(e) {
        Logger.log("Web App Error: " + e);
      }
      return;
    }

    // --- ОБРОБКА ТЕКСТУ (MESSAGES) ---
    if (contents.message) {
      var chatId = contents.message.chat.id;
      var text = contents.message.text || "";
      var name = contents.message.from.first_name;
      var state = getUserState(chatId); // Тут була помилка, тепер функція є внизу
      var u = getUserInfo(chatId);
      if ((text == "/food" || text == "🍽 Харчування") && !APP_SETTINGS.ENABLE_NUTRITION) {
    sendMessage(chatId, "⚠️ Цей розділ наразі вимкнено адміністратором.");
    return;
}
// 🔥🔥🔥 УНІВЕРСАЛЬНИЙ СКИДАЧ СТАНУ (FIXED) 🔥🔥🔥
      
      // Список ВСІХ кнопок вашого меню, які мають скасовувати введення
      var stopWords = [
        "🔙 Назад", 
        "Головне меню", 
        "👮‍♂️ Адмін-панель",
        "🏋️‍♂️ Актуальна програма тренувань",
        "📹 Відеоінструкції",
        "💳 Реквізити / Оплата",
        "🗄 Архів",
        "ℹ️ Інструкція",
        "/start",
        "/admin"
      ];
      // Перевіряємо: якщо це команда або одна з кнопок меню
      if (text.startsWith("/") || stopWords.indexOf(text) !== -1) {
        if (state) {
          deleteUserState(chatId); // Видаляємо завислий стан у базі
          state = null; // Обнуляємо змінну тут, щоб бот не пішов у блоки if(state...) нижче
        }
      }
      // 👣 ХАБ КРОКІВ
      if (text == "👣 Кроки") {
          var stepsKb = [
            [{ text: "✍️ Внести дані", callback_data: "steps_enter" }],
            [{ text: "🏆 Рейтинг учасників", web_app: { url: webAppUrl + "?page=leaderboard" } }]
          ];
          sendMessage(chatId, "👣 <b>Кроки та Рейтинг</b>\n\nОбери дію:", JSON.stringify({ inline_keyboard: stepsKb }));
          return;
      }
      // 🚀 ОБРОБКА ШВИДКИХ КОМАНД З МЕНЮ
      if (text == "/food") {
          setUserState(chatId, "nutrition_mode"); 
          var kb = [
            [{text: "📊 Звіт за сьогодні", callback_data: "nutri_report_today"}],
            [{text: "🔙 Головне меню", callback_data: "back_to_main"}]
          ];
          sendMessage(chatId, "🥗 <b>Режим харчування активовано!</b>\n\nПросто надішли фото страви, запиши голос або напиши текст — я одразу все порахую.", JSON.stringify({inline_keyboard: kb}));
          return; // Обов'язково зупиняємо виконання тут
      }
      // --- НОВЕ МЕНЮ КРОКІВ ---
  if (text == "👣 Записати кроки") {
      var kb = [
        [{ text: "✍️ Внести дані", callback_data: "steps_enter" }],
        [{ text: "🏆 Рейтинг учасників", web_app: { url: webAppUrl + "?page=leaderboard" } }]
      ];
      sendMessage(chatId, "👣 <b>Кроки та Рейтинг</b>\n\nОбери дію:", JSON.stringify({ inline_keyboard: kb }));
      return;
  }

      if (state == "waiting_steps") {
          var steps = parseInt(text.replace(/\s/g, ""));
          if (isNaN(steps)) {
              sendMessage(chatId, "⚠️ Будь ласка, введи тільки число.");
              return;
          }

          // 1. Отримуємо норму з листа 'users' (Колонка K - індекс 10)
          var uSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
          var uData = uSheet.getRange(2, 1, uSheet.getLastRow(), 11).getValues(); 
          var stepGoal = 10000; // за замовчуванням

          for (var i = 0; i < uData.length; i++) {
              if (String(uData[i][0]) == String(chatId)) {
                  stepGoal = parseInt(uData[i][10]) || 10000;
                  break;
              }
          }

          

          // 2. Зберігаємо та отримуємо оновлену суму за добу
      var dailyTotal = saveStepsToSheet(chatId, name, steps);

      // 3. Рахуємо різницю з урахуванням загальної суми
      var diff = dailyTotal - stepGoal;
      var diffText = diff >= 0 
          ? "✅ Норму виконано! Перевищено на <b>" + diff + "</b> кроків." 
          : "📉 Сьогодні ще треба пройти: <b>" + Math.abs(diff) + "</b> кроків.";

      var report = "📊 <b>ЗВІТ ПО КРОКАХ ЗА СЬОГОДНІ:</b>\n\n" +
                   "👣 Всього пройдено: <b>" + dailyTotal + "</b>\n" +
                   "🎯 Твоя норма: <b>" + stepGoal + "</b>\n\n" +
                   diffText;

      sendMessage(chatId, report);
      deleteUserState(chatId);
      return;
      }

      if (text == "/report") {
          sendDailyNutritionReport(chatId);
          return;
      }
      
      
      
      // 🔥 ОБРОБКА ДАТИ ВІД АДМІНА (для перегляду харчування клієнта)
      if (String(chatId) == adminId && state && state.indexOf("admin_wait_date_") === 0) {
          var targetUserId = state.replace("admin_wait_date_", "");
          var parsedDate = parseUserDate(text);
          
          if (parsedDate) {
              deleteUserState(chatId);
              sendDailyNutritionReport(chatId, parsedDate, targetUserId);
          } else {
              sendMessage(chatId, "⚠️ Не розумію дату. Формат: <code>25.01</code> або <code>25 01</code>");
          }
          return;
      }
      // 2. ПЕРЕВІРКА НА АДМІНА (ВСТАВИТИ ЦЕЙ БЛОК СЮДИ)
      if (String(chatId) === String(adminId)) {
        // Перевіряємо і текст кнопки, і команду /admin
        if (text === "👮‍♂️ Адмін-панель" || text === "/admin") {
          sendAdminMenu(chatId);
          return;
        }
      }

      // --- ГОЛОВНЕ МЕНЮ ХАРЧУВАННЯ (ОНОВЛЕНЕ) ---
      if (text == "🍽 Харчування") {
          var kb = [
            [{text: "🎯 Мої норми КБЖВ", callback_data: "nutri_norms"}], // 👈 Нова кнопка
            [{text: "📖 Рецепти страв", callback_data: "nutri_recipes"}], // Додана кнопка
            [{text: "📅 Архів звітів", callback_data: "nutri_archive_ask"}],
            [{text: "🔙 Назад", callback_data: "back_to_main"}] 
          ];
          
          var msg = "📊 <b>Твій щоденник харчування</b>\n\n" +
                    "Тут ти можеш переглянути свої цілі та історію.\n\n" +
                    "📸 <b>Для швидкого внесення:</b>\n" +
                    "Використовуй команду /food у боковому меню ↙️";

          sendMessage(chatId, msg, JSON.stringify({inline_keyboard: kb}));
          return;
      }
      

      

      // --- ЛОГІКА ХАРЧУВАННЯ (GPT + Whisper + АРХІВ + КОРЕКЦІЯ) ---
      if (state == "nutrition_mode" || state == "waiting_for_food_correction" || state == "waiting_for_date_report") {
         
         if (text == "🔙 Назад") { deleteUserState(chatId); sendModeSelector(chatId, name); return; }

         // 🗓 ЯКЩО ЧЕКАЄМО ДАТУ ДЛЯ ЗВІТУ
         if (state == "waiting_for_date_report") {
             var parsedDate = parseUserDate(text);
             if (parsedDate) {
                 sendDailyNutritionReport(chatId, parsedDate);
                 var kb = [[{text: "📅 Інша дата", callback_data: "nutri_archive_ask"}], [{text: "🔙 Меню", callback_data: "nutri_add"}]];
                 sendMessage(chatId, "Що далі?", JSON.stringify({inline_keyboard: kb}));
                 setUserState(chatId, "nutrition_mode");
             } else {
                 sendMessage(chatId, "⚠️ Не розумію дату. Спробуй формат: <i>День Місяць</i> (напр. <code>12 05</code>)");
             }
             return;
         }

         // ДАЛІ ЙДЕ ЛОГІКА ВНЕСЕННЯ ЇЖІ
         var prompt = "";
         var imageBlob = null;
         var isCorrection = (state == "waiting_for_food_correction");

         // А) ГОЛОС
         if (contents.message.voice) {
            sendMessage(chatId, "🎙 Слухаю...");
            var txtVoice = transcribeAudio(contents.message.voice.file_id);
            if (!txtVoice) { sendMessage(chatId, "⚠️ Не розчув."); return; }
            prompt = txtVoice;
            sendMessage(chatId, "🗣 " + prompt);
         }
         // Б) ФОТО
         else if (contents.message.photo) {
            sendMessage(chatId, "📸 Аналізую...");
            var pArr = contents.message.photo;
            var fid = pArr[pArr.length - 1].file_id;
            var fPath = JSON.parse(UrlFetchApp.fetch(telegramUrl + "/getFile?file_id=" + fid).getContentText()).result.file_path;
            imageBlob = UrlFetchApp.fetch("https://api.telegram.org/file/bot" + token + "/" + fPath).getBlob();
            prompt = "Проаналізуй фото детально. ВКАЖИ ВАГУ КОЖНОГО ІНГРЕДІЄНТА В ГРАМАХ.";
         }
         // В) ТЕКСТ
         else if (text) {
            prompt = text;
            if (!isCorrection) sendMessage(chatId, "⏳ Рахую...");
         } else {
            return;
         }

         // 🔥 ВИЗНАЧАЄМО РЕЖИМ ТА ФОРМУЄМО ПРОМПТ
         var aiMode = "analyze_text";
         var finalPrompt = prompt;
         
         if (imageBlob) {
             aiMode = "analyze_photo";
         }
         
         if (isCorrection) {
             aiMode = "correction";
             var oldDataStr = PropertiesService.getScriptProperties().getProperty("temp_nutri_" + chatId);
             if (!oldDataStr) {
                 sendMessage(chatId, "⚠️ Немає даних для корекції. Спочатку додай страву.");
                 return;
             }
             
             var oldData = JSON.parse(oldDataStr);
             
             // Формуємо ТІЛЬКИ список назв (без КБЖВ — GPT їх не перераховуватиме)
             var namesList = "";
             if (oldData.original_items) {
                 for (var i = 0; i < oldData.original_items.length; i++) {
                     namesList += i + ". " + oldData.original_items[i].name + " (" + oldData.original_items[i].weight + "г)\n";
                 }
             }
             
             finalPrompt = "СПИСОК ІНГРЕДІЄНТІВ:\n" + namesList + "\nПРАВКА: \"" + prompt + "\"\n\nПроаналізуй кожен продукт у правці окремо. Якщо продукт Є в списку — зміни йому вагу. Якщо продукту НЕМАЄ в списку — додай як новий (old_index: -1). НЕ видаляй та НЕ замінюй інгредієнти яких користувач не просив видалити.";
         }
         
         // 🔥 ПЕРЕВІРКА: Чи це пряме внесення БЖВ?
         if (!imageBlob && !isCorrection && text) {
             var lowerText = text.toLowerCase();
             var hasP = lowerText.indexOf("білк") !== -1 || lowerText.indexOf("білок") !== -1 || lowerText.indexOf("б:") !== -1 || lowerText.indexOf("б ") !== -1;
             var hasF = lowerText.indexOf("жир") !== -1 || lowerText.indexOf("ж:") !== -1 || lowerText.indexOf("ж ") !== -1;
             var hasC = lowerText.indexOf("вугл") !== -1 || lowerText.indexOf("в:") !== -1 || lowerText.indexOf("в ") !== -1;
             
             if (hasP && hasF && hasC) {
                 // Витягуємо числа
                 var nums = text.match(/\d+/g);
                 if (nums && nums.length >= 3) {
                     var p = Number(nums[0]);
                     var f = Number(nums[1]);
                     var c = Number(nums[2]);
                     var kcal = (p * 4) + (f * 9) + (c * 4);
                     
                     var msg = "📝 <b>ВНЕСЕНО БЖВ:</b>\n\n";
                     msg += "🥩 Білки: <b>" + p + " г</b>\n";
                     msg += "🥑 Жири: <b>" + f + " г</b>\n";
                     msg += "🍞 Вуглеводи: <b>" + c + " г</b>\n";
                     msg += "━━━━━━━━━━━━━━━━\n";
                     msg += "🔥 <b>Калорій: " + Math.round(kcal) + " ккал</b>";
                     
                     var saveObj = {
                         food_name: "БЖВ (" + p + "/" + f + "/" + c + ")",
                         calories: kcal,
                         p: p,
                         f: f,
                         c: c,
                         fiber: 0,
                         photo_id: "",
                         original_items: [{id: 0, name: "БЖВ", weight: "—", kcal: kcal, p: p, f: f, c: c, fiber: 0}]
                     };
                     
                     PropertiesService.getScriptProperties().setProperty("temp_nutri_" + chatId, JSON.stringify(saveObj));
                     
                     var kb = [[{text: "✅ Записати", callback_data: "nutri_confirm_save"}]];
                     sendMessage(chatId, msg, JSON.stringify({inline_keyboard: kb}));
                     setUserState(chatId, "nutrition_mode");
                     return; // 🔥 ПРОПУСКАЄМО GPT
                 }
             }
         }
         // 🔢 Перевірка прямого вводу КБЖВ
         var result = null;
         if (!isCorrection && !imageBlob) {
           result = parseDirectNutrition(prompt);
         }
         
         // 🔥 ЄДИНИЙ ВИКЛИК GPT (тільки якщо не прямий ввід)
         if (!result) {
           result = callOpenAINutrition(finalPrompt, imageBlob, aiMode);
         }
         
         // 🔥 DEBUG
         if (!result) {
             sendMessage(chatId, "⚠️ GPT не відповів. Спробуй ще раз.");
             sendMessage(adminId, "❌ GPT null. Mode: " + aiMode);
             return;
         }
         // 🔥 ТОЧКОВА КОРЕКЦІЯ: Підставляємо результат програмно
         // 🔥 DEBUG КОРЕКЦІЇ
         

         if (isCorrection && result && (result.old_index !== undefined || result.changes)) {
             var oldSaved = JSON.parse(PropertiesService.getScriptProperties().getProperty("temp_nutri_" + chatId));
             var oldItems = oldSaved.original_items || [];
             
             // Підтримка і старого формату (один old_index) і нового (масив changes)
             var changesList = [];
             if (result.changes && result.changes.length > 0) {
                 changesList = result.changes;
             } else if (result.old_index !== undefined) {
                 changesList = [{ old_index: result.old_index, old_name: result.old_name, new_item: result.new_item }];
             }
             
             // Застосовуємо всі зміни
             var toDelete = [];
             var toAdd = [];
             for (var ch = 0; ch < changesList.length; ch++) {
                 var change = changesList[ch];
                 var idx = parseInt(change.old_index);
                 var ni = change.new_item;
                 
                 ni.kcal = Number(ni.kcal) || 0;
                 ni.p = Number(ni.p) || 0;
                 ni.f = Number(ni.f) || 0;
                 ni.c = Number(ni.c) || 0;
                 ni.fiber = Number(ni.fiber) || 0;
                 
                 if (idx === -1) {
                     // НОВИЙ інгредієнт — додаємо
                     ni.id = oldItems.length + toAdd.length;
                     toAdd.push(ni);
                 } else if (idx >= 0 && idx < oldItems.length) {
                     ni.id = idx;
                     if (Number(ni.kcal) === 0 && ni.name.indexOf("видалено") !== -1) {
                         toDelete.push(idx);
                     } else {
                         oldItems[idx] = ni;
                     }
                 }
             }
             
             // Додаємо нові інгредієнти
             for (var a = 0; a < toAdd.length; a++) {
                 oldItems.push(toAdd[a]);
             }
             
             // Видаляємо з кінця щоб не зсувати індекси
             toDelete.sort(function(a, b) { return b - a; });
             for (var d = 0; d < toDelete.length; d++) {
                 oldItems.splice(toDelete[d], 1);
             }
             
             // Перераховуємо total АРИФМЕТИКОЮ
             var newTotal = { calories: 0, p: 0, f: 0, c: 0, fiber: 0 };
             for (var t = 0; t < oldItems.length; t++) {
                 newTotal.calories += Number(oldItems[t].kcal) || 0;
                 newTotal.p += Number(oldItems[t].p) || 0;
                 newTotal.f += Number(oldItems[t].f) || 0;
                 newTotal.c += Number(oldItems[t].c) || 0;
                 newTotal.fiber += Number(oldItems[t].fiber) || 0;
             }
             
             result = {
                 status: "success",
                 items: oldItems,
                 total: newTotal,
                 photo_id: oldSaved.photo_id || ""
             };
         }
         // 🍎 ПЕРЕВІРКА ЧЕРЕЗ БАЗУ ПРОДУКТІВ
         if (result && result.items && !isCorrection) {
           var dbResult = processItemsWithDB(result.items);
           result.items = dbResult.items;
           result.total = dbResult.total;
         }
         // 🔥 ВАЛІДАЦІЯ 1: Чи ШІ просить вагу?
         if (result.status === "need_weights") {
             var items = result.detected_items || [];
             var msg = "⚠️ <b>Вкажи вагу кожного продукту:</b>\n\n";
             for (var i = 0; i < items.length; i++) {
                 msg += "• " + items[i] + ": __ г\n";
             }
             msg += "\nНаприклад: <code>Рис 150, Курка 200</code>";
             sendMessage(chatId, msg);
             setUserState(chatId, "nutrition_mode");
             return;
         }
         
         // 🔥 ВАЛІДАЦІЯ 2: Чи всі інгредієнти мають вагу?
         if (result.items) {
             var missingWeights = [];
             for (var i = 0; i < result.items.length; i++) {
                 var w = result.items[i].weight;
                 if (!w || String(w).trim() === "" || w === "порція") {
                     missingWeights.push(result.items[i].name);
                 }
             }
             
             if (missingWeights.length > 0) {
                 var msg = "⚠️ <b>Не вдалося визначити вагу:</b>\n\n";
                 for (var i = 0; i < missingWeights.length; i++) {
                     msg += "• " + missingWeights[i] + ": __ г\n";
                 }
                 msg += "\nВкажи грамовку.";
                 sendMessage(chatId, msg);
                 setUserState(chatId, "nutrition_mode");
                 return;
             }
         }


         // 🔥 НОРМАЛІЗАЦІЯ: перетворюємо protein→p, fat→f, carbs→c
         if (result.items) {
             for (var i = 0; i < result.items.length; i++) {
                 if (result.items[i].protein !== undefined) result.items[i].p = result.items[i].protein;
                 if (result.items[i].fat !== undefined) result.items[i].f = result.items[i].fat;
                 if (result.items[i].carbs !== undefined) result.items[i].c = result.items[i].carbs;
             }
         }
         if (result.total) {
             if (result.total.protein !== undefined) result.total.p = result.total.protein;
             if (result.total.fat !== undefined) result.total.f = result.total.fat;
             if (result.total.carbs !== undefined) result.total.c = result.total.carbs;
             if (result.total.kcal !== undefined) result.total.calories = result.total.kcal;
         }
         // Зберігаємо ID фото
         if (contents.message.photo) {
             var pArr = contents.message.photo;
             result.photo_id = pArr[pArr.length - 1].file_id;
         }
         // 🔥 ЗАХИСТ ВІД NaN - заповнюємо пропущені поля
if (result.total) {
    result.total.calories = Number(result.total.calories) || 0;
    result.total.p = Number(result.total.p) || 0;
    result.total.f = Number(result.total.f) || 0;
    result.total.c = Number(result.total.c) || 0;
    result.total.fiber = Number(result.total.fiber) || 0;
}

if (result.items) {
    for (var i = 0; i < result.items.length; i++) {
        result.items[i].kcal = Number(result.items[i].kcal) || 0;
        result.items[i].p = Number(result.items[i].p) || 0;
        result.items[i].f = Number(result.items[i].f) || 0;
        result.items[i].c = Number(result.items[i].c) || 0;
        result.items[i].fiber = Number(result.items[i].fiber) || 0;
    }
}

// РОЗБИРАЄМО Items
var items = result.items || [];

         // РОЗБИРАЄМО Items
         var items = result.items || [];
         
         // Fallback якщо items пустий
         if (items.length === 0) {
             var fallback = result.total || result;
             items.push({
                 id: 0,
                 name: "Страва", 
                 weight: "100", 
                 kcal: fallback.calories || 0, 
                 p: fallback.p || 0, 
                 f: fallback.f || 0, 
                 c: fallback.c || 0, 
                 fiber: fallback.fiber || 0
             });
         }

         // ФОРМУЄМО ПОВІДОМЛЕННЯ
         var total = result.total || result;
         
         var msg = (isCorrection ? "✅ <b>ВИПРАВЛЕНО:</b>\n\n" : "🍽 <b>СКЛАД СТРАВИ:</b>\n\n");
         
         // Список інгредієнтів з вагою
         for (var i = 0; i < items.length; i++) {
             var it = items[i];
             msg += (it.dbSource || "🔹") + " " + it.name + " — " + it.weight + "г\n";
         }
         msg += "\n";
         
         // Підсумок
         msg += "━━━━━━━━━━━━━━━━\n";
         msg += "🏆 <b>ЗАГАЛОМ:</b>\n";
         msg += "🔥 <b>" + Math.round(Number(total.calories)||0) + " ккал</b>\n";
         msg += "🥩 Білки: <b>" + Math.round(Number(total.p)||0) + " г</b>\n";
         msg += "🥑 Жири: <b>" + Math.round(Number(total.f)||0) + " г</b>\n";
         msg += "🍞 Вуглеводи: <b>" + Math.round(Number(total.c)||0) + " г</b>\n";
         msg += "🥗 Клітковина: <b>" + Math.round(Number(total.fiber)||0) + " г</b>";
         
         // Зберігаємо з ID
         var saveObj = {
             food_name: items.map(function(it) { return it.name + " (" + it.weight + "г)"; }).join(", "),
             calories: total.calories,
             p: total.p,
             f: total.f,
             c: total.c,
             fiber: total.fiber || 0,
             photo_id: result.photo_id || "",
             original_items: items
         };
         // 🔥 DEBUG
Logger.log("=== SAVE OBJ ===");
Logger.log("calories: " + saveObj.calories + " (type: " + typeof saveObj.calories + ")");
Logger.log("p: " + saveObj.p + " (type: " + typeof saveObj.p + ")");
Logger.log("f: " + saveObj.f + " (type: " + typeof saveObj.f + ")");
Logger.log("c: " + saveObj.c + " (type: " + typeof saveObj.c + ")");
         
         PropertiesService.getScriptProperties().setProperty("temp_nutri_" + chatId, JSON.stringify(saveObj));
         
         var kb = [
             [{text: "✅ Записати", callback_data: "nutri_confirm_save"}],
             [{text: "📊 Детальніше", callback_data: "nutri_detailed"}, {text: "✏️ Корективи", callback_data: "nutri_correct_ask"}]
         ];
         sendMessage(chatId, msg, JSON.stringify({inline_keyboard: kb}));
         setUserState(chatId, "nutrition_mode");
         return;
      }
      
      // ВІДПОВІДЬ ПРО ОПЛАТУ
      if (state == "waiting_payment_response") {
      }
      
      // ВІДПОВІДЬ ПРО ОПЛАТУ
      if (state == "waiting_payment_response") {
      }
      
      // РЕДАГУВАННЯ
      // 🔥 ЗАПИС ЧАСУ (для бігових)
      if (state && state.indexOf("waiting_for_time_") === 0) {
        var parts = state.replace("waiting_for_time_", "").split("_");
        var rowToEdit = parts[0];
        var activeSheet = parts.slice(1).join("_");
        
        if (!activeSheet) {
          activeSheet = getActiveSheetForUser(chatId);
        }
        
        if (activeSheet) { 
          writeTimeResult(activeSheet, rowToEdit, text); 
          sendMessage(chatId, "✅ Час записано!"); 
        } else {
          sendMessage(chatId, "❌ Не вдалося визначити лист для запису.");
        }
        deleteUserState(chatId);
        return;
      }
      if (state && state.indexOf("waiting_for_edit_") === 0) {
    var parts = state.replace("waiting_for_edit_", "").split("_");
    var rowToEdit = parts[0];
    var activeSheet = parts.slice(1).join("_"); // 🔥 Назва листа може містити "_"
    
    if (!activeSheet) {
      activeSheet = getActiveSheetForUser(chatId); // Fallback
    }
    
    if (activeSheet) { 
        writeExerciseResult(activeSheet, rowToEdit, text); 
        sendMessage(chatId, "✅ Зміни записано!"); 
    } else {
        sendMessage(chatId, "❌ Не вдалося визначити лист для запису.");
    }
    deleteUserState(chatId);
    return;
}


      if (state == "waiting_for_payment") {
        if (text.includes("/start")) {
           deleteUserState(chatId);
           if(u) sendModeSelector(chatId, u.name);
           else sendWelcomeMessage(chatId);
           return;
        }

        var photos = contents.message.photo;
        var doc = contents.message.document;

        if (photos || doc) {
          handlePaymentScreenshot(chatId, name, photos, doc, "");
          deleteUserState(chatId);
          sendMessage(chatId, "✅ <b>Квитанцію отримано!</b>\nОчікуй підтвердження.");
        } else {
          sendMessage(chatId, "📸 <b>Потрібен скріншот!</b>\nНадішли фото або файл.");
        }
        return;
      }

      if (String(chatId) == adminId) {
        if (text == "👮‍♂️ Адмін-панель" || text == "/admin") { sendAdminMenu(chatId); return; }
        if (state && state.indexOf("admin_invoice_wait_")===0) { 
            var targetId = state.replace("admin_invoice_wait_","");
            deleteUserState(adminId); 
            sendInvoice(targetId, text); 
            return; 
        }
        if (text.indexOf("/msg ") === 0) { sendPersonalMessage(text.replace("/msg ", "")); return; }
        
        // РОЗСИЛКА (З ЗАПОБІЖНИКОМ)
        if (state == "waiting_broadcast_text") { 
            if (text.startsWith("/") || text == "🔙 Назад" || text.includes("Архів")) {
                sendMessage(chatId, "❌ Розсилку скасовано."); 
                deleteUserState(chatId); 
            } else {
                sendBroadcast(text); 
                deleteUserState(chatId); 
                return; 
            }
        }
      }

      if (!u) { 
        sendWelcomeMessage(chatId, false); // Виклик нашої функції в режимі "Перший вхід"
        return; 
      }

      if (text.includes("/start") || text.includes("Головне меню") || text == "🔙 Назад") {
        if (u) {
            sendModeSelector(chatId, u.name);
        } else {
            sendWelcomeMessage(chatId, false);
        }
        return;
      }
      // 🏋️‍♂️ АКТУАЛЬНА ПРОГРАМА ТРЕНУВАНЬ
if (text === "🏋️‍♂️ Моє тренування") {
  // 🔒 Перевірка залишку тренувань
  var stats = getUserTrainingStats(chatId);
  if (stats.total > 0 && stats.remaining <= 0) {
    sendMessage(chatId, "🔒 <b>Пакет тренувань вичерпано!</b>\n\n" +
      "Ти використав(ла) всі <b>" + stats.total + "</b> тренувань.\n\n" +
      "Для продовження — зверніся до тренера 👇");
    return;
  }

  var mev = checkMorningEveningMode(chatId);
  
  // Якщо є Р/В режим - показуємо дні з поділом
  if (mev.hasMode) {
    sendDaySelector(chatId);
    return;
  }
  
  // Якщо НЕ Р/В режим - перевіряємо скільки програм
  var hasGym = u.gymSheet && isValidSheet(u.gymSheet);
  var hasRun = u.runSheet && isValidSheet(u.runSheet);
  
  // Якщо ДВІ програми - показуємо вибір
  if (hasGym && hasRun) {
    var kb = [[{text: u.gymHeader}], [{text: u.runHeader}], [{text: "🔙 Назад"}]];
    sendMessage(chatId, "📂 <b>Обери програму:</b>", JSON.stringify({keyboard: kb, resize_keyboard: true}));
    return;
  }
  
  // Якщо ОДНА програма - показуємо дні
  if (hasGym) {
    setActiveSheetForUser(chatId, u.gymSheet);
    sendDayButtons(chatId, u.gymSheet, u.gymHeader.toUpperCase());
    return;
  }
  
  if (hasRun) {
    setActiveSheetForUser(chatId, u.runSheet);
    sendDayButtons(chatId, u.runSheet, u.runHeader.toUpperCase());
    return;
  }
  
  // Якщо ЖОДНОЇ програми
  sendMessage(chatId, "⚠️ У тебе ще немає активних програм. Напиши тренеру.");
  return;
}
      // 🔥 ДИНАМІЧНІ КНОПКИ: ПЕРЕВІРКА ЗА ЗАГОЛОВКАМИ З USERS (C1 та E1)
      if (u && text === u.gymHeader) {
        var sheet = u.gymSheet;
        if (!isValidSheet(sheet)) { 
          sendMessage(chatId, "⚠️ Програма " + u.gymHeader + " ще не готова."); 
          return; 
        }
        setActiveSheetForUser(chatId, sheet); 
        sendDayButtons(chatId, sheet, u.gymHeader.toUpperCase());
        return;
      }

      if (u && text === u.runHeader) {
        var sheet = u.runSheet;
        if (!isValidSheet(sheet)) { 
          sendMessage(chatId, "⚠️ Програма " + u.runHeader + " ще не готова."); 
          return; 
        }
        setActiveSheetForUser(chatId, sheet); 
        sendDayButtons(chatId, sheet, u.runHeader.toUpperCase());
        return;
      }
// 🔥 ЗВ'ЯЗОК З ТРЕНЕРОМ
      if (text == "💬 Написати тренеру") {
        // Використовуємо adminId для створення прямого посилання на твій профіль
        var trainerUrl = "tg://user?id=" + adminId; 
        
        var kb = {
          inline_keyboard: [
            [{ text: "🚀 Відкрити чат з тренером", url: trainerUrl }]
          ]
        };
        
        sendMessage(chatId, "Натисни на кнопку нижче, щоб перейти в особисті повідомлення до тренера:", JSON.stringify(kb));
        return;
      }
      if (text.includes("Відеоінструкції")) { sendVideoInstructions(chatId); return; }
      if (text.includes("Реквізити")) { sendClientRequisites(chatId); return; }
      if (text.includes("Інструкція")) { sendBotInstruction(chatId); return; }
      
      if (text.includes("Архів")) { 
         var currentSheet = getActiveSheetForUser(chatId);
         if (!currentSheet) currentSheet = u.gymSheet || u.homeSheet;
         if(currentSheet) sendArchiveList(chatId, currentSheet); 
         else sendMessage(chatId, "⚠️ Спочатку обери програму.");
         return; 
      }

      var activeSheet = getActiveSheetForUser(chatId);
      if (!activeSheet) { 
        var sheet = u.gymSheet || u.homeSheet;
        if(isValidSheet(sheet)) setActiveSheetForUser(chatId, sheet);
        else {
             sendMessage(chatId, "Спочатку натисни '🏋️‍♂️ Актуальна програма'.");
             sendModeSelector(chatId, u.name);
             return;
        }
        activeSheet = getActiveSheetForUser(chatId);
      }

      var wo = findWorkout(text.trim(), activeSheet, null);
      if (wo.found) {
        // Сповіщення тренеру
        if (String(chatId) != adminId) {
           sendMessage(adminId, "👀 <b>" + u.name + "</b> відкрив(ла): " + text.trim());
        }

        var mk = null;
        if (wo.row) {
            // 🔗 Формуємо посилання на Web App
            var encSheet = encodeURIComponent(activeSheet);
            var trackerUrl = webAppUrl + "?page=tracker&chatId=" + chatId + "&row=" + wo.row + "&sheet=" + encSheet;
            
            mk = JSON.stringify({
                inline_keyboard: [[{
                    text: "📊 Трекер показників", // Твоя назва повернута
                    web_app: { url: trackerUrl } // Але тепер відкриває Web App
                }]]
            });
        }
        
        sendMessage(chatId, wo.text, mk);
        return;
      }
      
      sendModeSelector(chatId, u.name);
    }
  } catch (err) { sendMessage(adminId, "☠️ ERROR: " + err.toString()); }
}

// ----------------------------------------------------------------------------
// 🛠 ФУНКЦІЇ (HELPER FUNCTIONS)
// ----------------------------------------------------------------------------

function isValidSheet(val) {
     if (!val) return false;
     var s = String(val).trim();
     if (s.length < 2) return false; 
     if (s.match(/^\d+$/)) return false; 
     return true;
}

// 🔥 РЕКВІЗИТИ (КОПІЮВАННЯ ПО КЛІКУ + ШВИДКІ КНОПКИ)
function sendClientRequisites(id){
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settingsSheetName);
  
  var info = s.getRange("A2").getValue();       // ФОП, ЄДРПОУ
  var cleanIban = s.getRange("B2").getValue();  // Чистий IBAN
  var monoLink = s.getRange("C2").getValue();   
  var privatLink = s.getRange("D2").getValue();     
  
  var text = "💳 <b>РЕКВІЗИТИ ДЛЯ ОПЛАТИ:</b>\n\n" +
             info + "\n" +
             "👇 <b>Натисни на рахунок, щоб скопіювати:</b>\n" +
             "<code>" + cleanIban + "</code>\n\n" + 
             "або сплати швидко через посилання:";
  
  var keyboard = [];
  var bankButtons = [];

  if (monoLink && String(monoLink).includes("http")) {
    bankButtons.push({text: "🐈 Mono (Банка)", url: monoLink});
  }
  if (privatLink && String(privatLink).includes("http")) {
    bankButtons.push({text: "🟢 Privat24", url: privatLink});
  }

  if (bankButtons.length > 0) keyboard.push(bankButtons);
  keyboard.push([{text: "✅ Я оплатив(ла)", callback_data: "i_have_paid"}]);
  
  sendMessage(id, text, JSON.stringify({inline_keyboard: keyboard}));
}

function sendArchiveList(id, sheetName) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = s.getRange("B1:B" + s.getLastRow()).getValues();
  var keyboard = [];
  var row = [];
  
  for (var i = 0; i < data.length; i++) {
    var cellValue = String(data[i][0]);
    if (cellValue.match(/Ц\d+.*Т\d+/i)) {
      row.push({text: cellValue, callback_data: "arc_week_" + (i + 1) + "_" + cellValue});
      if (row.length === 2) { keyboard.push(row); row = []; }
    }
  }
  if (row.length > 0) keyboard.push(row);
  
  if (keyboard.length === 0) {
    sendMessage(id, "🗄 Архів порожній.");
  } else {
    sendMessage(id, "🗄 <b>АРХІВ:</b>\nОбери цикл:", JSON.stringify({inline_keyboard: keyboard}));
  }
}

function sendArchiveDaysMenu(id, sheetName, row, name) {
  var days = getWorkoutDays(sheetName, row);
  var keyboard = [], r = [];
  for (var i = 0; i < days.length; i++) {
    r.push({text: days[i], callback_data: "arc_day_" + row + "_" + days[i]});
    if (r.length === 2) { keyboard.push(r); r = []; }
  }
  if (r.length > 0) keyboard.push(r);
  sendMessage(id, "📂 <b>Архів: " + name + "</b>\nОбери тренування:", JSON.stringify({inline_keyboard: keyboard}));
}




function setActiveSheetForUser(id, sheetName) {
  PropertiesService.getScriptProperties().setProperty('active_sheet_' + id, sheetName);
}
function getActiveSheetForUser(id) {
  return PropertiesService.getScriptProperties().getProperty('active_sheet_' + id);
}

function sendDayButtons(id, sheetName, modeTitle) {
  var days = getWorkoutDays(sheetName, null);
  var buttons = [];
  var row = [];
  if (days.length === 0) { sendMessage(id, "⚠️ У цій програмі ще немає днів."); return; }
  for (var i = 0; i < days.length; i++) {
    var btnText = days[i];
    row.push({text: btnText});
    if (row.length === 2) { buttons.push(row); row = []; }
  }
  if (row.length > 0) buttons.push(row);
  buttons.push([{text: "🔙 Назад"}]); 
  sendMessage(id, "📂 <b>" + modeTitle + "</b>\nОбери день:", JSON.stringify({keyboard: buttons, resize_keyboard: true}));
}



function sendReminderToAll() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var d = s.getRange(2, 1, s.getLastRow()-1, 1).getValues();
  for (var i=0; i<d.length; i++) {
    var uid = d[i][0];
    if (uid && String(uid) != adminId) {
      try { sendMessage(uid, "Вітаю 👋 чекаю на фотозвіт"); Utilities.sleep(50); } catch(e){}
    }
  }
  sendMessage(adminId, "✅ Розсилку завершено.");
}

function sendBroadcast(txt) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var data = s.getRange(2, 1, s.getLastRow()-1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    var userId = data[i][0];
    if (userId && String(userId) != adminId) {
      try { sendMessage(userId, "📢 <b>Оголошення:</b>\n\n" + txt); Utilities.sleep(50); } catch (e) {}
    }
  }
  sendMessage(adminId, "✅ Розсилку завершено.");
}

function addUserToSheet(id, n) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var lr = s.getLastRow();
  var r = s.getRange(1, 1, lr + 20, 1).getValues();
  var ir = lr + 1;
  for (var i = 1; i < r.length; i++) {
    if (r[i][0] == "" || r[i][0] == null) { ir = i + 1; break; }
  }
  var today = new Date();
  var day = today.getDate(); 
  s.getRange(ir, 1, 1, 4).setValues([[id, n, "", day]]);
}


// 🔥 РАХУНОК (КОПІЮВАННЯ ПО КЛІКУ + ШВИДКІ КНОПКИ)
function sendInvoice(id, sum) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settingsSheetName);
  
  var info = s.getRange("A2").getValue();       
  var cleanIban = s.getRange("B2").getValue();  
  var monoLink = s.getRange("C2").getValue();      
  var privatLink = s.getRange("D2").getValue();     
  
  var text = "🧾 <b>РАХУНОК ДО СПЛАТИ: " + sum + " грн</b>\n\n" +
             "👤 " + info + "\n" +
             "👇 <b>Натисни на рахунок, щоб скопіювати:</b>\n" +
             "<code>" + cleanIban + "</code>\n\n" + 
             "<b>Що робити далі:</b>\n" +
             "1. Скопіюй рахунок (або тисни кнопки нижче).\n" +
             "2. Сплати суму.\n" +
             "3. <b>Надішли сюди скріншот квитанції.</b>";
  
  var keyboard = [];
  var bankButtons = [];
  
  if (monoLink && String(monoLink).includes("http")) {
    bankButtons.push({text: "🐈 Mono", url: monoLink});
  }
  if (privatLink && String(privatLink).includes("http")) {
    bankButtons.push({text: "🟢 Privat", url: privatLink});
  }

  if (bankButtons.length > 0) keyboard.push(bankButtons);

  if (keyboard.length > 0) {
    sendMessage(id, text, JSON.stringify({inline_keyboard: keyboard}));
  } else {
    sendMessage(id, text);
  }

  setUserState(id, "waiting_for_payment");
  sendMessage(adminId, "✅ Рахунок надіслано. Чекаємо скріншот.");
}

// === ФУНКЦІЇ ВІДПРАВКИ З ЗАХИСТОМ ===

function sendMessage(id, txt, mk) {
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  var payload = { chat_id: String(id), text: txt, parse_mode: "HTML", disable_web_page_preview: true, protect_content: shouldProtect };
  if (mk) payload.reply_markup = (typeof mk === "string") ? JSON.parse(mk) : mk;
  try { UrlFetchApp.fetch(telegramUrl + "/sendMessage", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); } catch (e) { Logger.log(e); }
}

function sendPhoto(id, pid, cap, mk) { 
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try { 
    var payload = { chat_id: String(id), photo: pid, caption: cap, parse_mode: "HTML", protect_content: shouldProtect };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendPhoto", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); 
    return true; 
  } catch(e){ return false; } 
}

function sendDocument(id, did, cap, mk) { 
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try { 
    var payload = { chat_id: String(id), document: did, caption: cap, parse_mode: "HTML", protect_content: shouldProtect };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendDocument", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); 
    return true; 
  } catch(e){ return false; } 
}

function sendVideo(id, videoId, caption, mk) {
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(id) !== String(adminId));
  try {
    var payload = {
      chat_id: String(id),
      video: videoId,
      caption: caption,
      parse_mode: "HTML",
      protect_content: shouldProtect
    };
    if (mk) payload.reply_markup = (typeof mk === 'string') ? JSON.parse(mk) : mk;
    UrlFetchApp.fetch(telegramUrl + "/sendVideo", { method: "post", contentType: "application/json", payload: JSON.stringify(payload) });
    return true;
  } catch (e) { Logger.log("Error sending video: " + e); return false; }
}

function editMessage(id, mid, txt) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/editMessageText", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, text: txt, parse_mode: "HTML" }) });
  } catch (e) {}
}

function editMessageReplyMarkup(id, mid, kb) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/editMessageReplyMarkup", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, reply_markup: (typeof kb === 'string' ? JSON.parse(kb) : {inline_keyboard: kb}) }) });
  } catch (e) {}
}

function handlePaymentScreenshot(id, n, photos, doc, username) {
  var fileId = "";
  var method = "";
  if (photos && photos.length > 0) { fileId = photos[photos.length - 1].file_id; method = "sendPhoto"; } 
  else if (doc) { fileId = doc.file_id; method = "sendDocument"; }
  
  if (!fileId) { sendMessage(adminId, "⚠️ Клієнт " + n + " щось надіслав, але формат не підтримується."); return; }

  var markup = JSON.stringify({
    inline_keyboard: [
      [{ text: "✅ Підтвердити", callback_data: "approve_pay_" + id + "_" + n }],
      [{ text: "❌ Відхилити", callback_data: "reject_pay_" + id }]
    ]
  });

  var caption = "💸 <b>ОПЛАТА!</b>\n👤 Від: " + n;
  var payload = { chat_id: String(adminId), caption: caption, parse_mode: "HTML", reply_markup: markup };
  if (method == "sendPhoto") payload.photo = fileId; else payload.document = fileId;

  try { UrlFetchApp.fetch(telegramUrl + "/" + method, { method: "post", contentType: "application/json", payload: JSON.stringify(payload) }); } 
  catch (e) { sendMessage(adminId, "⚠️ Помилка пересилання файлу."); }
}

function setMessageReaction(id, mid, em) {
  try {
    UrlFetchApp.fetch(telegramUrl + "/setMessageReaction", { method: "post", contentType: "application/json", payload: JSON.stringify({ chat_id: String(id), message_id: mid, reaction: [{type: "emoji", emoji: em}] }) });
  } catch (e) {}
}

function getExerciseVideoMap() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(exercisesSheetName);
  if (!sheet || sheet.getLastRow() < 2) return {};
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  var videoMap = {};
  for (var i = 0; i < data.length; i++) {
    var name = String(data[i][0]).trim().toLowerCase(); 
    var link = String(data[i][1]).trim(); 
    if (name && link) videoMap[name] = link;
  }
  return videoMap;
}

function cleanWorkoutName(str) { 
  return str.replace(/№/g, "").replace(/[^\w\sа-яА-ЯіІїЇєЄґҐ.,-]/gi, "").trim(); 
}

function getWorkoutDays(sheetName, specificStartRow) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var startRow = specificStartRow ? parseInt(specificStartRow) : getLatestCycleRow(sheetName);
  var lastRow = sheet.getLastRow();
  var limit = Math.min(lastRow, startRow + 100); 
  if (limit < startRow) return [];
  var data = sheet.getRange(startRow, 1, limit - startRow + 1, 1).getValues();
  var days = [];
  for (var i = 0; i < data.length; i++) {
    var cell = String(data[i][0]).trim();
    if (i > 0) { 
        if (cell.toLowerCase().includes("актуальний")) break;
        if (cell.match(/^ц\d+/i)) break; 
    }
    if (cell && !cell.toLowerCase().includes("актуальний") && !cell.match(/^ц\d+/i)) {
      if (days.indexOf(cell) === -1) days.push(cell);
    }
  }
  return days;
}


function getLatestCycleRow(sn) { 
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sn); if(!s)return 1;
  var lr = s.getLastRow(), d = s.getRange(1,1,lr,2).getValues();
  for(var i=0;i<d.length;i++) if(String(d[i][0]).toLowerCase().includes("актуальний")) return i+1;
  for(var i=0;i<d.length;i++) if(String(d[i][1]).match(/Ц(\d+).*Т(\d+)/i)) return i+1;
  return 1;
}

function processAnketaData(formData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Запис в архів (обов'язково для історії)
  var sheet = ss.getSheetByName("Анкети");
  if (!sheet) {
    sheet = ss.insertSheet("Анкети");
    sheet.appendRow(["Дата", "ID", "Ім'я", "Вік", "Ціль", "Рівень", "Статус бігу", "Дистанція", "Частота", "Місце", "Здоров'я", "Деталі"]);
  }
  
  // Форматуємо ID як текст
  var cleanId = "'" + formData.telegramId; 
  if (!formData.telegramId || formData.telegramId === "NOT_FOUND") cleanId = "'000000"; 

  sheet.appendRow([
    new Date(), cleanId, formData.name, formData.age, formData.goal, formData.level,       
    formData.runStatus, formData.distance, formData.freq, formData.location, formData.health, formData.details      
  ]);

  // 2. Текст для тренера
  var text = "🔔 <b>НОВИЙ КЛІЄНТ!</b>\n\n" +
             "👤 <b>" + formData.name + "</b> (" + formData.age + " р.)\n" +
             "🎯 Мета: " + formData.goal + "\n" +
             "📊 Рівень: " + formData.level + "\n" +
             "🏃 Біг: " + formData.runStatus + "\n" +
             "🏥 Здоров'я: " + formData.health + "\n\n" +
             "📝 Деталі: " + formData.details + "\n\n" +
             "🆔 ID: <code>" + formData.telegramId + "</code>";

  // 3. Три кнопки для адміна
  var keyboard = {
    "inline_keyboard": [
      [
        { "text": "💬 Написати в ЛС", "url": "tg://user?id=" + formData.telegramId }
      ],
      [
        { "text": "✅ Додати клієнта", "callback_data": "fast_add_" + formData.telegramId + "_" + formData.name },
        { "text": "💰 Виставити рахунок", "callback_data": "invoice_ask_" + formData.telegramId }
      ]
    ]
  };

  // Відправка адміну
  sendMessage(adminId, text, JSON.stringify(keyboard));
  
  return "Success";
}
// ============================================================================
// 🌐 ВІДОБРАЖЕННЯ АНКЕТИ (WEB APP)
// ============================================================================

function sendClientMenu(id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = ss.getSheetByName("users");
  
  // Отримуємо всі дані
  var data = usersSheet.getDataRange().getValues();
  
  var powerLink = "";
  var runLink = "";
  var userFound = false;

  // 1. Шукаємо клієнта за ID (Колонка A = індекс 0)
  for (var i = 1; i < data.length; i++) {
    // Порівнюємо ID (як рядки, щоб уникнути помилок типів)
    if (String(data[i][0]).trim() == String(id).trim()) { 
       
       // 🔥 ВАШІ КОЛОНКИ:
       // Колонка C (Силові) = індекс 2
       powerLink = data[i][2]; 
       
       // Колонка E (Біг) = індекс 4
       runLink = data[i][4]; 
       
       userFound = true;
       break;
    }
  }

  if (!userFound) {
    sendMessage(id, "⚠️ Тебе не знайдено в базі клієнтів. Напиши адміністратору.");
    return;
  }

  var text = "💪 **Привіт, чемпіоне!**\n\nОсь твої програми тренувань.\nТисни на кнопки нижче, щоб перейти до занять 👇";
  
  // 2. Формуємо кнопки
  var keyboard = [];
  var programsRow = [];

  // Кнопка "🏋️ Силові" (тільки якщо в C є посилання)
  if (powerLink && String(powerLink).includes("http")) {
     programsRow.push({ text: "🏋️ Силові", url: powerLink });
  }

  // Кнопка "🏃 Біг" (тільки якщо в E є посилання)
  if (runLink && String(runLink).includes("http")) {
     programsRow.push({ text: "🏃 Біг", url: runLink });
  }
  
  // Додаємо ряд кнопок програм, якщо вони є
  if (programsRow.length > 0) {
    keyboard.push(programsRow);
  }

  // Додаємо кнопку Панелі (вона має бути завжди)
  keyboard.push([{ text: "👤 Мій Кабінет (Панель)", web_app: { url: webAppUrl } }]);

  // Додаткова кнопка зв'язку (за бажанням)
  keyboard.push([{ text: "💬 Написати тренеру", url: "https://t.me/ТУТ_ВАШ_НІК" }]); 

  var markup = { inline_keyboard: keyboard };
  
  sendMessage(id, text, JSON.stringify(markup));
}
// ============================================================================
// 📋 ДИНАМІЧНА АНКЕТА - ЧИТАННЯ ПИТАНЬ З SETTINGS
// ============================================================================

/**
 * Читає питання анкети з листа Settings (колонки G і далі)
 * Повертає масив об'єктів з питаннями та варіантами відповідей
 */
function getAnketaQuestions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Settings");
  if (!sheet) return { status: "error", msg: "Лист Settings не знайдено" };
  
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  
  // Починаємо з колонки G (7)
  var startCol = 7;
  if (lastCol < startCol) {
    return { status: "error", msg: "Немає питань в Settings (колонка G і далі)" };
  }
  
  // Читаємо всі дані від G до останньої колонки
  var numCols = lastCol - startCol + 1;
  var numRows = Math.min(lastRow, 20); // Максимум 20 рядків (1 питання + 19 варіантів)
  
  if (numRows < 1) {
    return { status: "error", msg: "Лист Settings порожній" };
  }
  
  var data = sheet.getRange(1, startCol, numRows, numCols).getValues();
  
  var questions = [];
  
  // Проходимо по кожній колонці
  for (var col = 0; col < numCols; col++) {
    var questionText = String(data[0][col]).trim();
    
    // Якщо перший рядок порожній - пропускаємо колонку
    if (!questionText || questionText === "") continue;
    
    // Збираємо варіанти відповідей (рядки 2 і далі)
    var options = [];
    var hasCustomOption = false;
    
    for (var row = 1; row < numRows; row++) {
      var optionText = String(data[row][col]).trim();
      
      if (!optionText || optionText === "") continue;
      
      // Перевіряємо чи це "Власна відповідь"
      if (optionText.toLowerCase() === "власна відповідь") {
        hasCustomOption = true;
      } else {
        options.push(optionText);
      }
    }
    
    // Визначаємо тип питання
    var questionType = "text"; // За замовчуванням - текстове поле
    
    if (options.length === 0 && hasCustomOption) {
      // Тільки "Власна відповідь" - текстове поле
      questionType = "text";
    } else if (options.length > 0 && hasCustomOption) {
      // Є варіанти + "Власна відповідь" - комбінований
      questionType = "combo";
    } else if (options.length > 0) {
      // Тільки варіанти - вибір
      questionType = "select";
    }
    
    questions.push({
      id: "q" + (questions.length + 1),
      text: questionText,
      type: questionType,
      options: options,
      hasCustom: hasCustomOption
    });
  }
  
  if (questions.length === 0) {
    return { status: "error", msg: "Не знайдено жодного питання" };
  }
  
  return { status: "success", questions: questions };
}
/**
 * Обробляє динамічну анкету - зберігає відповіді та відправляє тренеру
 */
function processAnketaDataDynamic(formData) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Анкети");
    if (!sheet) sheet = ss.insertSheet("Анкети");

    // 1. Запис у таблицю (залишаємо для історії)
    var cleanId = String(formData.telegramId || "0000").replace("'", "");
    var rowData = [new Date(), "'" + cleanId];
    if (formData.questions) {
      for (var i = 0; i < formData.questions.length; i++) {
        var qId = "q" + (i + 1);
        rowData.push(formData.answers[qId] || "—");
      }
    }
    sheet.appendRow(rowData);

    // 2. Формування читабельного тексту для тренера
    var userName = formData.answers["q1"] || "Клієнт";
    var report = "✅ <b>АНКЕТА ЗАПОВНЕНА</b>\n";
    report += "━━━━━━━━━━━━━━━━━━\n";
    report += "👤 <b>Клієнт:</b> " + userName + "\n";
    report += "🆔 <b>ID:</b> <code>" + cleanId + "</code>\n";
    report += "━━━━━━━━━━━━━━━━━━\n\n";

    if (formData.questions) {
      for (var i = 0; i < formData.questions.length; i++) {
        var qId = "q" + (i + 1);
        var question = formData.questions[i];
        var answer = formData.answers[qId] || "—";
        
        // Форматування: Питання жирним, відповідь з нового рядка
        report += "❓ <b>" + question + "</b>\n";
        report += "💬 " + answer + "\n\n";
      }
    }

    report += "━━━━━━━━━━━━━━━━━━";

    // Перевірка на ліміт довжини (4000 символів), щоб повідомлення не «впало»
    if (report.length > 4000) {
      report = report.substring(0, 3950) + "...\n\n⚠️ <i>Текст обрізано через ліміт Telegram. Повну версію дивіться в таблиці.</i>";
    }

    // 3. Відправка повідомлення (без кнопок)
    sendMessage(adminId, report);
    
    return "Success";

  } catch (err) {
    console.error("Помилка: " + err.toString());
    sendMessage(adminId, "⚠️ Сталася помилка при обробці анкети: " + err.toString());
    return "Error";
  }
}


/**
 * Тестова функція - перевірити читання питань
 */
function testGetAnketaQuestions() {
  var result = getAnketaQuestions();
  Logger.log("=== ТЕСТ ПИТАНЬ АНКЕТИ ===");
  Logger.log("Status: " + result.status);
  
  if (result.status === "success") {
    Logger.log("Кількість питань: " + result.questions.length);
    for (var i = 0; i < result.questions.length; i++) {
      var q = result.questions[i];
      Logger.log("---");
      Logger.log("Питання " + (i+1) + ": " + q.text);
      Logger.log("Тип: " + q.type);
      Logger.log("Варіанти: " + JSON.stringify(q.options));
      Logger.log("Є 'Власна відповідь': " + q.hasCustom);
    }
  } else {
    Logger.log("Помилка: " + result.msg);
  }
}
function testPaymentReminder() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users");
  var data = s.getRange(2, 1, s.getLastRow() - 1, 5).getValues();
  
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var targetDay = tomorrow.getDate();
  
  Logger.log("=== ТЕСТ НАГАДУВАННЯ ===");
  Logger.log("Завтра: " + targetDay + "-е число");
  
  for (var i = 0; i < data.length; i++) {
    var userName = data[i][1];
    var payDay = data[i][3];
    
    if (payDay == targetDay) {
      Logger.log("✅ Нагадування для: " + userName);
    }
  }
}
function sendDaySelector(chatId) {
  var mev = checkMorningEveningMode(chatId);
  if (!mev.hasMode) {
    sendMessage(chatId, "❌ Режим Ранок/Вечір не налаштовано.");
    return;
  }
  
  var allDays = {};
  
  // 🔥 Автоматичне визначення: якщо один лист "ранок" - другий автоматично "вечір"
  var gymGlobal = (mev.gymMode && mev.gymMode.globalMode) ? mev.gymMode.globalMode : null;
  var runGlobal = (mev.runMode && mev.runMode.globalMode) ? mev.runMode.globalMode : null;
  
  // Автодоповнення
  if (gymGlobal && !runGlobal && mev.runMode) {
    runGlobal = (gymGlobal === "ранок") ? "вечір" : "ранок";
  }
  if (runGlobal && !gymGlobal && mev.gymMode) {
    gymGlobal = (runGlobal === "ранок") ? "вечір" : "ранок";
  }
  
  // Збираємо дні з силової програми
  if (mev.gymMode && mev.gymMode.foundDays) {
    for (var i = 0; i < mev.gymMode.foundDays.length; i++) {
      var day = mev.gymMode.foundDays[i];
      if (!allDays[day]) allDays[day] = {};
      allDays[day].gym = mev.gymMode.dayModes[day] || gymGlobal;
      allDays[day].gymSheet = mev.gymSheet;
    }
  }
  
  // Збираємо дні з бігової програми
  if (mev.runMode && mev.runMode.foundDays) {
    for (var i = 0; i < mev.runMode.foundDays.length; i++) {
      var day = mev.runMode.foundDays[i];
      if (!allDays[day]) allDays[day] = {};
      allDays[day].run = mev.runMode.dayModes[day] || runGlobal;
      allDays[day].runSheet = mev.runSheet;
    }
  }
  
  // Сортуємо дні
  var dayKeys = Object.keys(allDays).sort(function(a, b) {
    var numA = parseInt(a.match(/\d+/) || 0);
    var numB = parseInt(b.match(/\d+/) || 0);
    return numA - numB;
  });
  
  if (dayKeys.length === 0) {
    sendMessage(chatId, "❌ Не знайдено жодного дня в програмах.");
    return;
  }
  
  // Зберігаємо дані в кеш
  var cache = CacheService.getUserCache();
  cache.put("mev_data_" + chatId, JSON.stringify(allDays), 600);
  
  // Створюємо кнопки
  var kb = { inline_keyboard: [] };
  for (var i = 0; i < dayKeys.length; i++) {
    kb.inline_keyboard.push([{
      text: "📅 " + dayKeys[i],
      callback_data: "mev_day_" + dayKeys[i].replace(/\s+/g, "_")
    }]);
  }
  
  kb.inline_keyboard.push([{text: "⬅️ Назад", callback_data: "mev_back"}]);
  
  sendMessage(chatId, "📋 <b>Обери день тренування:</b>", JSON.stringify(kb));
}

// 🔥 Отримуємо список днів з листа
function getDaysFromSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getRange("A1:A" + sheet.getLastRow()).getValues();
  var days = [];
  
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][0]).trim();
    if (val.match(/^День\s*№?\s*\d+/i)) {
      // Нормалізуємо формат: "День №1" -> "День 1"
      var dayNum = val.match(/\d+/);
      if (dayNum) {
        var normalized = "День " + dayNum[0];
        if (days.indexOf(normalized) === -1) {
          days.push(normalized);
        }
      }
    }
  }
  
  return days;
}
function sendMorningEveningSelector(chatId, dayLabel) {
  var cache = CacheService.getUserCache();
  var cachedData = cache.get("mev_data_" + chatId);
  
  if (!cachedData) {
    sendDaySelector(chatId);
    return;
  }
  
  var allDays = JSON.parse(cachedData);
  var dayData = allDays[dayLabel];
  
  if (!dayData) {
    sendMessage(chatId, "❌ День не знайдено.");
    return;
  }
  
  var kb = { inline_keyboard: [] };
  
  // Збираємо тренування для цього дня
  var morningSheet = null, morningType = null;
  var eveningSheet = null, eveningType = null;
  
  // Перевіряємо силове
  if (dayData.gymSheet) {
    if (dayData.gym === "ранок") {
      morningSheet = dayData.gymSheet;
      morningType = "Силове";
    } else if (dayData.gym === "вечір") {
      eveningSheet = dayData.gymSheet;
      eveningType = "Силове";
    }
  }
  
  // Перевіряємо біг
  if (dayData.runSheet) {
    if (dayData.run === "ранок") {
      morningSheet = dayData.runSheet;
      morningType = "Біг";
    } else if (dayData.run === "вечір") {
      eveningSheet = dayData.runSheet;
      eveningType = "Біг";
    }
  }
  
  // Створюємо кнопки
  if (morningSheet && morningType) {
    kb.inline_keyboard.push([{
      text: "🌅 Ранкове (" + morningType + ")",
      callback_data: "mev_show_" + dayLabel.replace(/\s+/g, "_") + "_M_" + encodeSheetName(morningSheet)
    }]);
  }
  
  if (eveningSheet && eveningType) {
    kb.inline_keyboard.push([{
      text: "🌙 Вечірнє (" + eveningType + ")",
      callback_data: "mev_show_" + dayLabel.replace(/\s+/g, "_") + "_E_" + encodeSheetName(eveningSheet)
    }]);
  }
  
  // Якщо тільки одне тренування (день є тільки в одному листі)
  if (kb.inline_keyboard.length === 0) {
    var singleSheet = dayData.gymSheet || dayData.runSheet;
    var singleType = dayData.gymSheet ? "Силове" : "Біг";
    var singleTime = dayData.gym || dayData.run;
    
    if (singleSheet) {
      var emoji = (singleTime === "ранок") ? "🌅" : "🌙";
      var timeText = (singleTime === "ранок") ? "Ранкове" : "Вечірнє";
      
      kb.inline_keyboard.push([{
        text: emoji + " " + timeText + " (" + singleType + ")",
        callback_data: "mev_show_" + dayLabel.replace(/\s+/g, "_") + "_S_" + encodeSheetName(singleSheet)
      }]);
    }
  }
  
  kb.inline_keyboard.push([{text: "⬅️ До списку днів", callback_data: "mev_days"}]);
  
  sendMessage(chatId, "📅 <b>" + dayLabel + "</b>\n\nОбери тренування:", JSON.stringify(kb));
}

// 🔥 Допоміжна функція для кодування назви листа
function encodeSheetName(name) {
  return name.replace(/\s+/g, "_").substring(0, 25);
}

// 🔥 Допоміжна функція для декодування назви листа
function decodeSheetName(encoded, userId) {
  var u = getUserInfo(userId);
  if (!u) return encoded.replace(/_/g, " ");
  
  var decoded = encoded.replace(/_/g, " ");
  
  // Перевіряємо чи співпадає з початком назви листа
  if (u.gymSheet && u.gymSheet.indexOf(decoded) === 0) return u.gymSheet;
  if (u.runSheet && u.runSheet.indexOf(decoded) === 0) return u.runSheet;
  
  return decoded;
}
function testMorningEvening() {
  var u = getUserInfo("382654823");
  Logger.log("=== ТЕСТ Р/В ===");
  Logger.log("gymSheet: [" + u.gymSheet + "]");
  Logger.log("runSheet: [" + u.runSheet + "]");
  Logger.log("gymOrder: " + u.gymOrder);
  Logger.log("runOrder: " + u.runOrder);
  Logger.log("hasMorningEvening: " + u.hasMorningEvening);
}
function getSheetTimeMode(sheetName) {
  if (!sheetName || !isValidSheet(sheetName)) return null;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return null;
  
  var data = sheet.getRange("A1:A" + Math.min(sheet.getLastRow(), 300)).getValues();
  
  var globalMode = null;
  var dayModes = {};
  var foundDays = [];
  var isAfterActual = false;
  
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][0]).toLowerCase().trim();
    
    // Перевіряємо "Актуальний"
    if (val.indexOf("актуальн") !== -1) {
      isAfterActual = true;
      
      if (val.indexOf("ранок") !== -1 || val.indexOf("ран") !== -1) {
        globalMode = "ранок";
      } else if (val.indexOf("вечір") !== -1 || val.indexOf("вечор") !== -1 || val.indexOf("веч") !== -1) {
        globalMode = "вечір";
      }
      continue;
    }
    
    if (!isAfterActual) continue;
    
    // Перевіряємо "День №X"
    var dayMatch = val.match(/день\s*№?\s*(\d+)/i);
    if (dayMatch) {
      var dayNum = "День " + dayMatch[1];
      foundDays.push(dayNum);
      
      if (val.indexOf("ранок") !== -1 || val.indexOf("ран") !== -1) {
        dayModes[dayNum] = "ранок";
      } else if (val.indexOf("вечір") !== -1 || val.indexOf("вечор") !== -1 || val.indexOf("веч") !== -1) {
        dayModes[dayNum] = "вечір";
      }
    }
  }
  
  return {
    globalMode: globalMode,
    dayModes: dayModes,
    foundDays: foundDays,
    hasTimeMode: globalMode !== null || Object.keys(dayModes).length > 0
  };
}
// 🔥 Перевіряє чи клієнт має Р/В режим
function checkMorningEveningMode(userId) {
  var u = getUserInfo(userId);
  if (!u) return { hasMode: false };
  
  var gymMode = getSheetTimeMode(u.gymSheet);
  var runMode = getSheetTimeMode(u.runSheet);
  
  var hasMode = (gymMode && gymMode.hasTimeMode) || (runMode && runMode.hasTimeMode);
  
  return {
    hasMode: hasMode,
    gymSheet: u.gymSheet,
    runSheet: u.runSheet,
    gymMode: gymMode,
    runMode: runMode
  };
}
// 🔥 Р/В РЕЖИМ: Показуємо тренування конкретного дня (ОПТИМІЗОВАНО)
function sendMevDayPlan(chatId, dayLabel, sheetNameEncoded) {
  var sheetName = decodeSheetName(sheetNameEncoded, chatId);
  
  // ЗБЕРІГАЄМО АКТИВНИЙ ЛИСТ
  setActiveSheetForUser(chatId, sheetName);
  
  // 🔥 ОПТИМІЗАЦІЯ: Знаходимо рядок дня напряму, без повного сканування
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) {
    sendMessage(chatId, "❌ Лист не знайдено.");
    return;
  }
  
  var startRow = getLatestCycleRow(sheetName);
  var lastRow = sh.getLastRow();
  var rows = Math.min(100, lastRow - startRow + 1);
  
  if (rows <= 0) {
    sendMessage(chatId, "❌ Програма порожня.");
    return;
  }
  
  // Читаємо тільки колонку A для швидкого пошуку
  var colA = sh.getRange(startRow, 1, rows, 1).getValues();
  
  // Шукаємо рядок з потрібним днем
  var foundRow = null;
  var searchNum = dayLabel.match(/\d+/);
  
  for (var i = 0; i < colA.length; i++) {
    var cell = String(colA[i][0]).trim().toLowerCase();
    var cellNum = cell.match(/\d+/);
    
    if (cellNum && searchNum && cellNum[0] === searchNum[0] && cell.indexOf("день") !== -1) {
      foundRow = startRow + i;
      break;
    }
  }
  
  if (!foundRow) {
    sendMessage(chatId, "❌ Тренування для <b>" + dayLabel + "</b> не знайдено.");
    return;
  }
  
  // Тепер викликаємо findWorkout з конкретним рядком - це швидко!
  var wo = findWorkout(null, sheetName, foundRow);
  
  if (wo && wo.found) {
    var kb = null;
    if (wo.buttons && wo.buttons.length > 0 && wo.row) {
      kb = JSON.stringify({
        inline_keyboard: [[
          { text: "📊 Трекер показників", callback_data: "show_tracker_" + wo.row }
        ]]
      });
    }
    sendMessage(chatId, wo.text, kb);
  } else {
    sendMessage(chatId, "❌ Тренування для <b>" + dayLabel + "</b> не знайдено.");
  }
}
function testMevMode() {
  var chatId = "382654823"; // Ваш ID
  
  Logger.log("=== ТЕСТ Р/В РЕЖИМУ ===");
  
  var u = getUserInfo(chatId);
  Logger.log("gymSheet: " + u.gymSheet);
  Logger.log("runSheet: " + u.runSheet);
  
  var gymMode = getSheetTimeMode(u.gymSheet);
  Logger.log("--- GYM MODE ---");
  Logger.log("globalMode: " + (gymMode ? gymMode.globalMode : "null"));
  Logger.log("dayModes: " + (gymMode ? JSON.stringify(gymMode.dayModes) : "null"));
  
  var runMode = getSheetTimeMode(u.runSheet);
  Logger.log("--- RUN MODE ---");
  Logger.log("globalMode: " + (runMode ? runMode.globalMode : "null"));
  Logger.log("dayModes: " + (runMode ? JSON.stringify(runMode.dayModes) : "null"));
  
  var mev = checkMorningEveningMode(chatId);
  Logger.log("--- MEV CHECK ---");
  Logger.log("hasMode: " + mev.hasMode);
}
function testCallback() {
  var dayLabel = "День 1";
  var sheetName = "Мій тренувальний план";
  
  var encoded = encodeSheetName(sheetName);
  var callback = "mev_show_" + dayLabel.replace(/\s+/g, "_") + "_E_" + encoded;
  
  Logger.log("=== ТЕСТ CALLBACK ===");
  Logger.log("Encoded sheet: " + encoded);
  Logger.log("Full callback: " + callback);
  Logger.log("Callback length: " + callback.length);
  
  // Telegram обмеження - 64 символи
  if (callback.length > 64) {
    Logger.log("❌ ПОМИЛКА: callback занадто довгий!");
  } else {
    Logger.log("✅ OK: callback в межах ліміту");
  }
  
  // Тест декодування
  var decoded = decodeSheetName(encoded, "382654823");
  Logger.log("Decoded sheet: " + decoded);
}
function testSendMevDayPlan() {
  var chatId = "382654823";
  var dayLabel = "День 1";
  var sheetName = "Мій_тренувальний_план";
  
  Logger.log("=== ТЕСТ sendMevDayPlan ===");
  Logger.log("dayLabel: " + dayLabel);
  Logger.log("sheetName (encoded): " + sheetName);
  
  var decoded = decodeSheetName(sheetName, chatId);
  Logger.log("sheetName (decoded): " + decoded);
  
  // Перевіряємо чи існує лист
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(decoded);
  Logger.log("Sheet exists: " + (sheet !== null));
  
  // Перевіряємо чи існує функція sendDayPlan
  Logger.log("typeof sendDayPlan: " + typeof sendDayPlan);
}function testFindWorkout() {
  var sheetName = "Мій тренувальний план";
  var dayLabel = "День 1";
  
  Logger.log("=== ТЕСТ findWorkout ===");
  Logger.log("sheetName: " + sheetName);
  Logger.log("dayLabel: " + dayLabel);
  
  var wo = findWorkout(dayLabel, sheetName, null);
  
  Logger.log("found: " + wo.found);
  Logger.log("text: " + wo.text.substring(0, 200));
  
  // Перевіримо що є в таблиці
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sh.getRange("A140:A150").getValues();
  
  Logger.log("--- Дані в колонці A (рядки 140-150) ---");
  for (var i = 0; i < data.length; i++) {
    Logger.log("A" + (140+i) + ": [" + data[i][0] + "]");
  }
}
function testWriteResult() {
  var sheetName = "Мій тренувальний план";
  var row = 143; // Рядок з днем
  
  Logger.log("=== ТЕСТ ЗАПИСУ ===");
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    Logger.log("❌ Лист не знайдено: " + sheetName);
    return;
  }
  
  // Читаємо план
  var planRange = sheet.getRange(row, 4, 1, 3);
  var planData = planRange.getDisplayValues()[0];
  
  Logger.log("Row: " + row);
  Logger.log("Plan D (вага): [" + planData[0] + "]");
  Logger.log("Plan E (підходи): [" + planData[1] + "]");
  Logger.log("Plan F (повтори): [" + planData[2] + "]");
  
  // Перевіряємо колонку H
  var factValue = sheet.getRange(row, 8).getValue();
  Logger.log("Current H (факт): [" + factValue + "]");
}
function testParseWithSuffix() {
  Logger.log("=== ТЕСТ ПАРСИНГУ З ПРИСТАВКАМИ ===");
  
  // Силові з к.н.
  var r1 = parseFactString("16кг | 5 x 9 к.н.", "20", "3", "12 к.н.");
  Logger.log("16кг | 5 x 9 к.н. -> w:" + r1.w + " s:" + r1.s + " r:" + r1.r);
  
  // Біг з %
  var r2 = parseFactString("90% | 4 x 800", "90%", "5", "1600 м");
  Logger.log("90% | 4 x 800 -> w:" + r2.w + " s:" + r2.s + " r:" + r2.r);
  
  // Силові звичайні
  var r3 = parseFactString("45кг | 3 x 12", "40", "3", "10");
  Logger.log("45кг | 3 x 12 -> w:" + r3.w + " s:" + r3.s + " r:" + r3.r);
}
function testDaySearch() {
  var sheetName = "Мостовий"; // Ваш біговий лист
  
  Logger.log("=== ТЕСТ ПОШУКУ ДНЯ ===");
  
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) {
    Logger.log("Лист не знайдено: " + sheetName);
    return;
  }
  
  // Читаємо колонку A
  var data = sh.getRange("A1:A20").getValues();
  
  Logger.log("--- Дані в колонці A ---");
  for (var i = 0; i < data.length; i++) {
    var val = String(data[i][0]).trim();
    if (val) {
      Logger.log("A" + (i+1) + ": [" + val + "]");
    }
  }
  
  // Тест cleanWorkoutName
  Logger.log("--- Тест cleanWorkoutName ---");
  Logger.log("День №1 ранок -> [" + cleanWorkoutName("День №1 ранок") + "]");
  Logger.log("День 1 -> [" + cleanWorkoutName("День 1") + "]");
}
// 🔥 ЗАПИС ЧАСУ В КОЛОНКУ K (Реальний час)
function writeTimeResult(sheetName, row, text) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  
  var r = parseInt(row);
  
  // Записуємо як є - без змін
  sheet.getRange(r, 11).setValue(text.trim()); // Колонка K = 11
}
// ============================================================================
// 📊 СИСТЕМА ОБЛІКУ ТРЕНУВАНЬ
// ============================================================================

function getUserTrainingStats(userId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var uSheet = ss.getSheetByName(usersSheetName);
  var uData = uSheet.getDataRange().getValues();

  for (var i = 1; i < uData.length; i++) {
    if (String(uData[i][0]) == String(userId)) {
      var rawCell = uData[i][11];
      // Якщо Sheets перетворив "1/2" у дату — читаємо напряму з клітинки
      var raw = "";
      if (rawCell instanceof Date) {
        raw = uSheet.getRange(i + 1, 12).getDisplayValue().trim();
      } else {
        raw = String(rawCell).trim();
      }
      if (raw.indexOf("/") !== -1) {
        var parts = raw.split("/");
        var startDate = uData[i][12] || "";
      if (startDate instanceof Date) startDate = Utilities.formatDate(startDate, "GMT+2", "dd.MM.yyyy");
      return { remaining: parseInt(parts[0]) || 0, total: parseInt(parts[1]) || 0, startDate: String(startDate).trim() };
      }
      var num = parseInt(raw) || 0;
      var startDate = uData[i][12] || "";
      if (startDate instanceof Date) startDate = Utilities.formatDate(startDate, "GMT+2", "dd.MM.yyyy");
      return { remaining: num, total: num, startDate: String(startDate).trim() };
    }
  }
  return { total: 0, remaining: 0, startDate: "" };
}

function logFinishedTraining(chatId, userName, dayName, sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var uSheet = ss.getSheetByName(usersSheetName);
  var uData = uSheet.getDataRange().getValues();
  var remaining = 0;
  var total = 0;

  for (var i = 1; i < uData.length; i++) {
    if (String(uData[i][0]) == String(chatId)) {
      var raw = String(uData[i][11]).trim();
      if (raw.indexOf("/") !== -1) {
        var parts = raw.split("/");
        remaining = parseInt(parts[0]) || 0;
        total = parseInt(parts[1]) || 0;
      } else {
        total = parseInt(raw) || 0;
        remaining = total;
      }
      remaining = Math.max(0, remaining - 1);
      var cell = uSheet.getRange(i + 1, 12);
      cell.setNumberFormat("@"); // Формат "Текст" — Sheets не перетворить у дату
      cell.setValue(remaining + "/" + total);
      break;
    }
  }

  // Архів
  var hSheet = ss.getSheetByName("Історія Тренувань");
  if (hSheet) {
    hSheet.appendRow([new Date(), String(chatId), userName, sheetName, dayName, remaining + "/" + total]);
  }

  return { status: "success", remaining: remaining, total: total };
}
function getExercisesDatabase() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("список вправ");
  if (!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var db = {};
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][0]).toLowerCase().trim(); // Назва (Col A)
    var cat = String(data[i][2]).toUpperCase().trim();  // Категорія (Col C)
    if (name) db[name] = cat;
  }
  return db;
}
/**
 * Функція для проведення повного аудиту структури таблиці.
 * Результат буде виведено в консоль (Logger).
 */
function runFullSystemAudit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let report = "=== ТЕХНІЧНИЙ ЗВІТ СТРУКТУРИ ТАБЛИЦІ ===\n\n";
  
  report += "ID Таблиці: " + ss.getId() + "\n";
  report += "Кількість вкладок: " + sheets.length + "\n\n";

  sheets.forEach(sheet => {
    const name = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    report += `--- Вкладка: [${name}] ---\n`;
    report += `Розмір: ${lastRow} рядків, ${lastCol} колонок\n`;

    if (lastRow > 0 && lastCol > 0) {
      // Отримуємо заголовки
      const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      report += `Заголовки: ${headers.join(" | ")}\n`;

      // Шукаємо формули
      const formulas = sheet.getRange(1, 1, lastRow, lastCol).getFormulas();
      let foundFormulas = [];
      for (let r = 0; r < formulas.length; r++) {
        for (let c = 0; c < formulas[r].length; c++) {
          if (formulas[r][c]) {
            foundFormulas.push(`Комірка [${r+1},${c+1}]: ${formulas[r][c]}`);
          }
        }
      }
      
      if (foundFormulas.length > 0) {
        report += `Знайдено формул (${foundFormulas.length}):\n   ` + foundFormulas.slice(0, 10).join("\n   ") + (foundFormulas.length > 10 ? "\n   ...та інші" : "") + "\n";
      }
    }
    report += "\n";
  });

  // Перевірка іменованих діапазонів (часто використовуються в ботах)
  const namedRanges = ss.getNamedRanges();
  if (namedRanges.length > 0) {
    report += "=== ІМЕНОВАНІ ДІАПАЗОНИ ===\n";
    namedRanges.forEach(range => {
      report += `${range.getName()} => ${range.getRange().getA1Notation()}\n`;
    });
  }

  console.log(report);
  return report;
}
function transcribeAudio(fileId) {
  try {
    var fileUrl = "https://api.telegram.org/bot" + token + "/getFile?file_id=" + fileId;
    var filePath = JSON.parse(UrlFetchApp.fetch(fileUrl).getContentText()).result.file_path;
    var audioUrl = "https://api.telegram.org/file/bot" + token + "/" + filePath;
    var audioBlob = UrlFetchApp.fetch(audioUrl).getBlob();
    
    var url = "https://api.openai.com/v1/audio/transcriptions";
    var payload = { "file": audioBlob, "model": "whisper-1", "language": "uk" };
    var options = { "method": "post", "headers": { "Authorization": "Bearer " + OPENAI_API_KEY }, "payload": payload, "muteHttpExceptions": true };
    return JSON.parse(UrlFetchApp.fetch(url, options).getContentText()).text;
  } catch (e) { return null; }
}
// ============================================================================
// 🍎 БАЗА ПРОДУКТІВ — ПОШУК ТА АВТОПОПОВНЕННЯ
// ============================================================================

function getFoodDB() {
  return SpreadsheetApp.openById(FOOD_DB_ID);
}

function findProductInDB(name) {
  var db = getFoodDB();
  var nameLower = name.toLowerCase().trim();
  
  // 1. Шукаємо в синонімах
  var synSheet = db.getSheetByName("Синоніми");
  if (synSheet && synSheet.getLastRow() > 1) {
    var synData = synSheet.getRange(2, 1, synSheet.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < synData.length; i++) {
      if (String(synData[i][0]).toLowerCase().trim() === nameLower) {
        var mainName = String(synData[i][1]).trim();
        var found = findExactProduct(mainName);
        if (found) return found;
      }
    }
  }
  
  // 2. Шукаємо в брендах
  var brandSheet = db.getSheetByName("Бренди");
  if (brandSheet && brandSheet.getLastRow() > 1) {
    var brandData = brandSheet.getRange(2, 1, brandSheet.getLastRow() - 1, 6).getValues();
    for (var i = 0; i < brandData.length; i++) {
      var brandName = String(brandData[i][0]).toLowerCase().trim();
      if (nameLower.indexOf(brandName) !== -1 || brandName.indexOf(nameLower) !== -1) {
        return {
          name: String(brandData[i][0]),
          kcal: Number(brandData[i][1]),
          p: Number(brandData[i][2]),
          f: Number(brandData[i][3]),
          c: Number(brandData[i][4]),
          fiber: Number(brandData[i][5]),
          source: "brands"
        };
      }
    }
  }
  
  // 3. Шукаємо точне співпадіння в продуктах
  var exact = findExactProduct(name);
  if (exact) return exact;
  
  // 4. Нечіткий пошук — чи містить назва ключове слово
  var prodSheet = db.getSheetByName("Продукти");
  if (prodSheet && prodSheet.getLastRow() > 1) {
    var prodData = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 7).getValues();
    var bestMatch = null;
    var bestScore = 0;
    
    for (var i = 0; i < prodData.length; i++) {
      var prodName = String(prodData[i][0]).toLowerCase().trim();
      var score = 0;
      
      // Точне входження
      if (prodName.indexOf(nameLower) !== -1) score = 3;
      else if (nameLower.indexOf(prodName) !== -1) score = 2;
      else {
        // Пошук по словах
        var words = nameLower.split(/[\s,]+/);
        for (var w = 0; w < words.length; w++) {
          if (words[w].length > 2 && prodName.indexOf(words[w]) !== -1) score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          name: String(prodData[i][0]),
          kcal: Number(prodData[i][1]),
          p: Number(prodData[i][2]),
          f: Number(prodData[i][3]),
          c: Number(prodData[i][4]),
          fiber: Number(prodData[i][5]),
          source: "products"
        };
      }
    }
    
    if (bestScore >= 2) return bestMatch;
  }
  
  return null; // Не знайдено
}

function findExactProduct(name) {
  var db = getFoodDB();
  var nameLower = name.toLowerCase().trim();
  var prodSheet = db.getSheetByName("Продукти");
  if (!prodSheet || prodSheet.getLastRow() <= 1) return null;
  
  var prodData = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, 7).getValues();
  for (var i = 0; i < prodData.length; i++) {
    if (String(prodData[i][0]).toLowerCase().trim() === nameLower) {
      return {
        name: String(prodData[i][0]),
        kcal: Number(prodData[i][1]),
        p: Number(prodData[i][2]),
        f: Number(prodData[i][3]),
        c: Number(prodData[i][4]),
        fiber: Number(prodData[i][5]),
        source: "products"
      };
    }
  }
  return null;
}

function calcNutrition(product, weightG) {
  var k = weightG / 100;
  return {
    name: product.name,
    weight: String(weightG),
    kcal: Math.round(product.kcal * k),
    p: Math.round(product.p * k * 10) / 10,
    f: Math.round(product.f * k * 10) / 10,
    c: Math.round(product.c * k * 10) / 10,
    fiber: Math.round(product.fiber * k * 10) / 10
  };
}

function addProductToDB(name, kcal, p, f, c, fiber, category) {
  var db = getFoodDB();
  var sheet = db.getSheetByName("Продукти");
  sheet.appendRow([name, kcal, p, f, c, fiber, category || "Автододані"]);
}

function addSynonymToDB(synonym, mainName) {
  var db = getFoodDB();
  var sheet = db.getSheetByName("Синоніми");
  sheet.appendRow([synonym.toLowerCase().trim(), mainName]);
}

function processItemsWithDB(gptItems) {
  var results = [];
  var needGPT = [];
  
  for (var i = 0; i < gptItems.length; i++) {
    var item = gptItems[i];
    var name = String(item.name).trim();
    var weight = parseFloat(item.weight) || 100;
    
    var dbProduct = findProductInDB(name);
    
    if (dbProduct) {
      var calculated = calcNutrition(dbProduct, weight);
      calculated.id = i;
      calculated.dbSource = "📗";
      results.push(calculated);
    } else {
      // GPT вже порахував — використовуємо його дані як fallback
      item.id = i;
      item.kcal = Number(item.kcal) || 0;
      item.p = Number(item.p) || 0;
      item.f = Number(item.f) || 0;
      item.c = Number(item.c) || 0;
      item.fiber = Number(item.fiber) || 0;
      item.dbSource = "🤖";
      results.push(item);
      
      // Додаємо в базу на 100г для майбутнього
      if (weight > 0 && item.kcal > 0) {
        var per100 = {
          kcal: Math.round(item.kcal / weight * 100),
          p: Math.round(item.p / weight * 1000) / 10,
          f: Math.round(item.f / weight * 1000) / 10,
          c: Math.round(item.c / weight * 1000) / 10,
          fiber: Math.round(item.fiber / weight * 1000) / 10
        };
        addProductToDB(name, per100.kcal, per100.p, per100.f, per100.c, per100.fiber, "Автододані");
        addSynonymToDB(name, name);
      }
    }
  }
  
  // Перераховуємо total
  var total = { calories: 0, p: 0, f: 0, c: 0, fiber: 0 };
  for (var t = 0; t < results.length; t++) {
    total.calories += Number(results[t].kcal) || 0;
    total.p += Number(results[t].p) || 0;
    total.f += Number(results[t].f) || 0;
    total.c += Number(results[t].c) || 0;
    total.fiber += Number(results[t].fiber) || 0;
  }
  
  return { items: results, total: total };
}

function parseDirectNutrition(text) {
  // Перевіряємо чи це прямий ввід КБЖВ (без продуктів)
  // Наприклад: "білок 40г" або "250 ккал 30б 10ж 25в"
  var patterns = [
    // "білок 40г" або "білки 40"
    /б[іi]лк[иі]?\s*[:=]?\s*(\d+[\.,]?\d*)\s*г?/i,
    // Повний формат: "250 ккал 30б 10ж 25в"
    /(\d+)\s*ккал\s+(\d+[\.,]?\d*)\s*б\s+(\d+[\.,]?\d*)\s*ж\s+(\d+[\.,]?\d*)\s*в/i,
    // "КБЖВ: 250/30/10/25"
    /(\d+)\s*[\/\\]\s*(\d+[\.,]?\d*)\s*[\/\\]\s*(\d+[\.,]?\d*)\s*[\/\\]\s*(\d+[\.,]?\d*)/,
  ];
  
  // Повний КБЖВ
  var fullMatch = text.match(/(\d+)\s*ккал\s+(\d+[\.,]?\d*)\s*б\s+(\d+[\.,]?\d*)\s*ж\s+(\d+[\.,]?\d*)\s*в/i);
  if (fullMatch) {
    return {
      status: "success",
      items: [{
        id: 0, name: "Ручний ввід", weight: "0",
        kcal: parseFloat(fullMatch[1]),
        p: parseFloat(fullMatch[2].replace(",", ".")),
        f: parseFloat(fullMatch[3].replace(",", ".")),
        c: parseFloat(fullMatch[4].replace(",", "."))  ,
        fiber: 0
      }],
      total: {
        calories: parseFloat(fullMatch[1]),
        p: parseFloat(fullMatch[2].replace(",", ".")),
        f: parseFloat(fullMatch[3].replace(",", ".")),
        c: parseFloat(fullMatch[4].replace(",", ".")),
        fiber: 0
      }
    };
  }
  
  // Формат через дріб: "250/30/10/25"
  var slashMatch = text.match(/^(\d+)\s*[\/\\]\s*(\d+[\.,]?\d*)\s*[\/\\]\s*(\d+[\.,]?\d*)\s*[\/\\]\s*(\d+[\.,]?\d*)$/);
  if (slashMatch) {
    return {
      status: "success",
      items: [{
        id: 0, name: "Ручний ввід", weight: "0",
        kcal: parseFloat(slashMatch[1]),
        p: parseFloat(slashMatch[2].replace(",", ".")),
        f: parseFloat(slashMatch[3].replace(",", ".")),
        c: parseFloat(slashMatch[4].replace(",", ".")),
        fiber: 0
      }],
      total: {
        calories: parseFloat(slashMatch[1]),
        p: parseFloat(slashMatch[2].replace(",", ".")),
        f: parseFloat(slashMatch[3].replace(",", ".")),
        c: parseFloat(slashMatch[4].replace(",", ".")),
        fiber: 0
      }
    };
  }
  
  // Тільки білок: "білок 40г"
  var protMatch = text.match(/б[іi]лк[иі]?\s*[:=]?\s*(\d+[\.,]?\d*)\s*г?/i);
  if (protMatch && text.length < 30) {
    var pVal = parseFloat(protMatch[1].replace(",", "."));
    return {
      status: "success",
      items: [{
        id: 0, name: "Білок (ручний ввід)", weight: "0",
        kcal: Math.round(pVal * 4),
        p: pVal, f: 0, c: 0, fiber: 0
      }],
      total: { calories: Math.round(pVal * 4), p: pVal, f: 0, c: 0, fiber: 0 }
    };
  }
  
  return null; // Не є прямим вводом
}
function callOpenAINutrition(promptText, imageBlob, mode) {
  var url = "https://api.openai.com/v1/chat/completions";
  
  // 🔥 ВИБІР ПРОМПТУ ЗАЛЕЖНО ВІД РЕЖИМУ
  var systemPrompt = "";
  
  if (mode === "analyze_photo") {
    systemPrompt = 
      "Ти професійний дієтолог-аналізатор. ВІДПОВІДАЙ ТІЛЬКИ У ФОРМАТІ JSON. МОВА: УКРАЇНСЬКА.\n\n" +
      "🔥 КРИТИЧНО ВАЖЛИВО:\n" +
      "Ти ОБОВ'ЯЗКОВО маєш оцінити вагу КОЖНОГО інгредієнта в грамах.\n" +
      "Використовуй розмір тарілки, приладів, порівняй з іншими об'єктами.\n" +
      "Якщо це стандартна страва - використовуй типові порції.\n\n" +
      "ТВОЄ ЗАВДАННЯ:\n" +
      "1. Розпізнай ВСІ продукти\n" +
      "2. Оціни вагу КОЖНОГО в грамах (ОБОВ'ЯЗКОВО!)\n" +
      "3. Розбий складні страви (плов → рис, м'ясо, морква)\n" +
      "4. Порахуй КБЖВ для кожного\n\n" +
      "❌ ЗАБОРОНЕНО:\n" +
      "- Писати 'порція'\n" +
      "- Залишати weight порожнім\n" +
      "- Повертати need_weights (тільки якщо ТИ ФІЗИЧНО НЕ БАЧИШ ЇЖУ)\n\n" +
      "ФОРМАТ JSON:\n" +
      "{\n" +
      "  \"status\": \"success\",\n" +
      "  \"items\": [\n" +
      "    {\"name\": \"Авокадо\", \"weight\": \"50\", \"kcal\": 80, \"p\": 1, \"f\": 7, \"c\": 4, \"fiber\": 3}\n" +
      "  ],\n" +
      "  \"total\": {\"calories\": 80, \"p\": 1, \"f\": 7, \"c\": 4, \"fiber\": 3}\n" +
      "}";
      
  } else if (mode === "analyze_text") {
    systemPrompt = 
      "Ти дієтолог. ВІДПОВІДАЙ ТІЛЬКИ JSON. МОВА: УКРАЇНСЬКА.\n\n" +
      "ПРАВИЛА:\n" +
      "1. Розпізнай продукти та їх вагу з тексту\n" +
      "2. Якщо вага Є - порахуй КБЖВ\n" +
      "3. Якщо ваги НЕМАЄ - верни need_weights\n\n" +
      "ПРИКЛАДИ:\n" +
      "✅ 'Авокадо 35г, курка 45г' → success з items\n" +
      "✅ 'Рис 150, курка 200' → success (г можна не писати)\n" +
      "❌ 'З'їв курку та рис' → need_weights\n\n" +
      "ФОРМАТ need_weights:\n" +
      "{\n" +
      "  \"status\": \"need_weights\",\n" +
      "  \"detected_items\": [\"Курка\", \"Рис\"]\n" +
      "}\n\n" +
      "ФОРМАТ success:\n" +
      "{\n" +
      "  \"status\": \"success\",\n" +
      "  \"items\": [{\"name\": \"Курка\", \"weight\": \"200\", \"kcal\": 260, \"p\": 31, \"f\": 15, \"c\": 0, \"fiber\": 0}],\n" +
      "  \"total\": {\"calories\": 260, \"p\": 31, \"f\": 15, \"c\": 0, \"fiber\": 0}\n" +
      "}";
      
  } else if (mode === "correction") {
    systemPrompt = "Ти у РЕЖИМІ ТОЧКОВОЇ КОРЕКЦІЇ. ВІДПОВІДАЙ ТІЛЬКИ JSON. МОВА: УКРАЇНСЬКА. " +
      "ТИ ОТРИМАЄШ: список інгредієнтів з індексами та правку від користувача. " +
      "ТВОЄ ЗАВДАННЯ: " +
      "1. Визнач ЯКИЙ інгредієнт користувач хоче замінити. " +
      "2. Порахуй КБЖВ ТІЛЬКИ для НОВОГО інгредієнта. " +
      "3. Якщо змінюється вага — перерахуй КБЖВ для нової ваги. " +
      "НЕ рахуй КБЖВ для інших інгредієнтів. НЕ повертай повний список. " +
      "ФОРМАТ ВІДПОВІДІ (ЗАВЖДИ тільки JSON, ЗАВЖДИ масив changes навіть для однієї зміни): " +
      "{changes: [{old_index: число або -1 для нового, old_name: назва, new_item: {name: назва, weight: вага в грамах, kcal: число, p: число, f: число, c: число, fiber: число}}]} " +
      "old_index = індекс зі списку. old_index = -1 означає НОВИЙ продукт якого не було в списку. " +
      "КОЖНУ зміну та КОЖНЕ додавання — окремим елементом в масиві changes. " +
      "Приклад правки 'замість риса гречка': old_index = індекс рису, new_item = гречка з КБЖВ. " +
      "Приклад правки 'курки було 300г': old_index = індекс курки, new_item = курка з КБЖВ на 300г. " +
      "Приклад правки 'прибери салат': old_index = індекс салату, new_item з name=(видалено), weight=0, всі КБЖВ = 0. " +
      "КРИТИЧНО ВАЖЛИВЕ ПРАВИЛО: " +
      "Якщо користувач згадує продукт якого НЕМАЄ в списку — це ЗАВЖДИ додавання нового, а НЕ заміна існуючого. " +
      "Існуючі інгредієнти видаляються ТІЛЬКИ якщо користувач прямо каже прибери або видали або замість. " +
      "Якщо користувач НЕ згадав якийсь інгредієнт зі списку — він ЗАЛИШАЄТЬСЯ без змін. " +
      "Для нового інгредієнта: old_index: -1, old_name: (новий). " +
      "Якщо правка стосується КІЛЬКОХ інгредієнтів — поверни масив changes з усіма змінами. " +
      "ПРИКЛАД: Список: [0.Вівсянка, 1.Молоко]. Правка: 'Вівсянка 140г, протеїн 30г'. " +
      "Результат: changes: [{old_index:0, змінити вагу вівсянки}, {old_index:-1, додати протеїн}]. Молоко НЕ чіпати!";
  }
  

  var messages = [{ "role": "system", "content": systemPrompt }];
  
  // 🔥 ВИПРАВЛЕННЯ: Правильний формат content
  if (imageBlob) {
    // Для фото - масив з текстом та зображенням
    var content = [
      { "type": "text", "text": promptText },
      { "type": "image_url", "image_url": { "url": "data:image/jpeg;base64," + Utilities.base64Encode(imageBlob.getBytes()) } }
    ];
    messages.push({ "role": "user", "content": content });
  } else {
    // Для тексту - просто рядок
    messages.push({ "role": "user", "content": promptText });
  }

  var payload = { 
    "model": "gpt-4o", 
    "messages": messages, 
    "max_tokens": 1000, 
    "response_format": { "type": "json_object" }
  };

  var options = { 
    "method": "post", 
    "headers": { 
      "Authorization": "Bearer " + OPENAI_API_KEY, 
      "Content-Type": "application/json" 
    }, 
    "payload": JSON.stringify(payload), 
    "muteHttpExceptions": true 
  };
// 🔥 DEBUG LOG
  Logger.log("=== ЗАПИТ ДО GPT ===");
  Logger.log("Mode: " + mode);
  Logger.log("Has image: " + (imageBlob !== null));
  Logger.log("Messages count: " + messages.length);
  Logger.log("System prompt length: " + systemPrompt.length);
  Logger.log("User prompt: " + promptText.substring(0, 150));
  try {
     var response = UrlFetchApp.fetch(url, options);
     var res = JSON.parse(response.getContentText());
     // 🔥 DEBUG: Логуємо відповідь
     Logger.log("=== ВІДПОВІДЬ GPT ===");
     Logger.log("HTTP Code: " + response.getResponseCode());
     Logger.log("Full response: " + response.getContentText());
     // 🔥 ЛОГУВАННЯ ПОМИЛОК
     if (res.error) {
       Logger.log("OpenAI Error: " + JSON.stringify(res.error));
       sendMessage(adminId, "🚨 OpenAI Error:\n" + res.error.message);
       return null; 
     }
     
     if (!res.choices || !res.choices[0]) {
       Logger.log("No choices in response: " + JSON.stringify(res));
       sendMessage(adminId, "🚨 GPT не повернув відповідь");
       return null;
     }
     
     var rawContent = res.choices[0].message.content;
     Logger.log("Raw content from GPT: " + rawContent);
     
     // Якщо GPT повернув текст замість JSON - пробуємо витягнути JSON
     var jsonMatch = rawContent.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
         rawContent = jsonMatch[0];
     }
     
     var result = JSON.parse(rawContent);
     
     // Додаємо ID до кожного інгредієнта
     if (result.items) {
       for (var i = 0; i < result.items.length; i++) {
         if (!result.items[i].id) result.items[i].id = i;
       }
     }
     
     return result;
     
  } catch(e) { 
     Logger.log("Fetch Error: " + e.toString());
     sendMessage(adminId, "🚨 Помилка запиту:\n" + e.toString());
     return null; 
  }
}
function saveNutritionToSheet(id, name, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  if (!sheet) {
     sheet = ss.insertSheet(nutritionSheetName);
     sheet.appendRow(["ID", "Name", "Date", "Time", "Food", "Kcal", "P", "F", "C", "Fiber", "PhotoID"]);
  }
  
  var now = new Date();
  var fiber = data.fiber || 0; // Якщо AI забув, пишемо 0

  sheet.appendRow([
    id, name, 
    Utilities.formatDate(now, "GMT+2", "dd.MM.yyyy"), 
    Utilities.formatDate(now, "GMT+2", "HH:mm"), 
    data.food_name, 
    Number(data.calories)||0, 
    Number(data.p)||0, 
    Number(data.f)||0, 
    Number(data.c)||0, 
    Number(fiber)||0, 
    data.photo_id || "" 
  ]);
}
function sendDailyNutritionReport(chatId, dateObj, targetUserId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  if (!sheet) { sendMessage(chatId, "⚠️ Ще немає записів."); return; }
  
  var userIdToSearch = targetUserId || chatId;
  var targetDate = dateObj || new Date(); 
  var targetDateStr = Utilities.formatDate(targetDate, "GMT+2", "dd.MM.yyyy");

  // 1. ОТРИМУЄМО НОРМИ
  var targets = getUserTargets(userIdToSearch); 

  var data = sheet.getDataRange().getValues();
  var title = (targetUserId) ? "🕵️‍♂️ <b>ЗВІТ КЛІЄНТА</b>" : "📊 <b>ЗВІТ</b>";
  var msg = title + " ЗА " + targetDateStr + ":\n\n";
  
  var totalKcal = 0, totalP = 0, totalF = 0, totalC = 0, totalFiber = 0;
  var count = 0;
  var hasPhotos = false;

  // 2. РАХУЄМО ЩО З'ЇЛИ
  for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) == String(userIdToSearch)) { 
        var rowDate = data[i][2];
        var checkDate = (rowDate instanceof Date) ? Utilities.formatDate(rowDate, "GMT+2", "dd.MM.yyyy") : String(rowDate);

        if (checkDate == targetDateStr) {
            count++;
            var kcal = Number(data[i][5])||0; 
            var p = Number(data[i][6])||0; 
            var f = Number(data[i][7])||0; 
            var c = Number(data[i][8])||0;
            var fib = Number(data[i][9])||0; 
            var photoId = data[i][10] ? String(data[i][10]) : "";

            if (photoId.length > 5) hasPhotos = true;

            var niceTime = (data[i][3] instanceof Date) ? Utilities.formatDate(data[i][3], "GMT+2", "HH:mm") : String(data[i][3]).substring(0, 5);
           msg += "🍽 <b>Прийом #" + count + " (" + niceTime + ")</b>\n" + data[i][4] + "\n└ <i>" + Math.round(kcal) + " ккал</i>\n\n";
            
            totalKcal += kcal; totalP += p; totalF += f; totalC += c; totalFiber += fib;
        }
      }
  }

  if (count === 0) {
     sendMessage(chatId, "📅 За <b>" + targetDateStr + "</b> записів не знайдено.");
     return;
  }

  // 3. ФОРМУЄМО ПІДСУМОК З ПОРІВНЯННЯМ
  
  function formatLine(emoji, label, fact, target) {
      fact = Math.round(fact);
      if (!target || target === 0) {
          return emoji + " " + label + ": " + fact; 
      }
      var diff = Math.round(target - fact);
      var status = (diff >= 0) ? " (Ще " + diff + ")" : " (⚠️ Перебір " + Math.abs(diff) + ")";
      return emoji + " " + label + ": <b>" + fact + " / " + target + "</b>" + status;
  }

  msg += "➖➖➖➖➖➖➖➖\n🏆 <b>ПІДСУМОК ДНЯ:</b>\n";
  
  msg += formatLine("🔥", "Ккал", totalKcal, targets.kcal) + "\n";
  msg += formatLine("🥩", "Білки", totalP, targets.p) + "\n";
  msg += formatLine("🥑", "Жири", totalF, targets.f) + "\n";
  msg += formatLine("🍞", "Вугл", totalC, targets.c) + "\n";
  
  // 🔥 КЛІТКОВИНА ТЕПЕР ТЕЖ З НОРМОЮ
  msg += formatLine("🥗", "Клітк", totalFiber, targets.fiber);

  if (targets.kcal > 0 && totalKcal > targets.kcal + 100) {
      msg += "\n\n⚠️ <b>Увага! Норму калорій перевищено!</b>";
  }

  var kb = [];
  if (hasPhotos) {
     kb.push([{ text: "📸 Переглянути фото страв", callback_data: "show_ph_" + userIdToSearch + "_" + targetDateStr }]);
  }
  kb.push([{ text: "📊 Детальний звіт за день", callback_data: "detailed_day_" + userIdToSearch + "_" + targetDateStr }]);
  
  sendMessage(chatId, msg, JSON.stringify({inline_keyboard: kb}));
}
function getUserTargets(userId) {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(usersSheetName);
  var data = s.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) == String(userId)) {
      // Індекси: A=0, B=1, C=2, D=3, E=4(Розтяжка), F=5, G=6, H=7, I=8, J=9
      var tKcal = Number(data[i][5]);
      var tP = Number(data[i][6]);
      var tF = Number(data[i][7]);
      var tC = Number(data[i][8]);
      var tFiber = Number(data[i][9]); // 🔥 Клітковина (Колонка J)

      // Авто-розрахунок калорій, якщо їх немає
      if (!tKcal && (tP || tF || tC)) {
         tKcal = (tP * 4) + (tF * 9) + (tC * 4);
      }

      return { kcal: tKcal, p: tP, f: tF, c: tC, fiber: tFiber };
    }
  }
  return { kcal: 0, p: 0, f: 0, c: 0, fiber: 0 };
}
function sendAdminMenu(id) {
  var kb = []; // Створюємо основу для кнопок

  // --- 🥦 БЛОК ХАРЧУВАННЯ (Тільки якщо ON) ---
  if (APP_SETTINGS.ENABLE_NUTRITION) {
    kb.push([{text: "🥦 Щоденники Харчування", callback_data: "admin_nutri_list"}]);
  }

  // --- 📋 АНКЕТА ТА ЗВІТ ---
  var row2 = [{text: "📋 Відправити анкету", callback_data: "admin_send_anketa_menu"}];
  // Якщо харчування вимкнено, нагадування про звіт (фото) теж зазвичай не потрібне
  if (APP_SETTINGS.ENABLE_NUTRITION) {
    row2.push({text: "📸 Нагадати про звіт", callback_data: "admin_remind_menu"});
  }
  kb.push(row2);

  // --- 🆕 ПРОГРАМИ ТА РАХУНКИ ---
  var row3 = [];
  if (APP_SETTINGS.ENABLE_TRAINING) {
    row3.push({text: "🆕 Нова програма", callback_data: "admin_mode_plan"});
  }
  if (APP_SETTINGS.ENABLE_BILLING) {
    row3.push({text: "💰 Виставити Рахунок", callback_data: "admin_mode_invoice"});
  }
  if (row3.length > 0) kb.push(row3);

  // --- 📢 КОМУНІКАЦІЯ ТА ПОСИЛАННЯ ---
  if (APP_SETTINGS.ENABLE_TRAINING) {
    kb.push([{text: "👁 Переглянути тренування клієнта", callback_data: "admin_view_training"}]);
  }
  kb.push([
    {text: "📢 Розсилка (Текст)", callback_data: "admin_broadcast_start"},
    {text: "🔗 Посилання на бот", callback_data: "admin_share_link"}
  ]);

  // --- 👶 ТЕСТИ ТА ГРОШІ ---
  kb.push([
    {text: "👶 Тест Новачка", callback_data: "admin_test_newcomer"},
    {text: "🏦 Баланс OpenAI ($)", url: "https://platform.openai.com/settings/organization/billing/overview"}
  ]);

  // Відправляємо фінальне меню
  sendMessage(id, "👮‍♂️ <b>ПОВНА АДМІН-ПАНЕЛЬ:</b>", JSON.stringify({ inline_keyboard: kb }));
}
function sendFoodPhotosAlbum(chatId, userId, dateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
     // Перевіряємо ID користувача
     if (String(data[i][0]) == String(userId)) {
        
        // Перевіряємо дату
        var rowDate = data[i][2];
        var checkDate = (rowDate instanceof Date) ? Utilities.formatDate(rowDate, "GMT+2", "dd.MM.yyyy") : String(rowDate);
        
        if (checkDate == dateStr) {
            // Перевіряємо чи є фото (Колонка 10 = K, індекс 10)
            var photoId = (data[i].length > 10) ? data[i][10] : "";
            var foodName = data[i][4];
            var time = (data[i][3] instanceof Date) ? Utilities.formatDate(data[i][3], "GMT+2", "HH:mm") : String(data[i][3]).substring(0, 5);

            if (photoId) {
                try {
                   sendPhoto(chatId, photoId, "🕒 " + time + ": " + foodName);
                   Utilities.sleep(200); // Пауза, щоб телеграм не заблокував за спам
                } catch(e) {}
            }
        }
     }
  }
}
function setBotCommands() {
  var commands = [{command: "start", description: "🏠 Головне меню"}];

  // Якщо харчування ON - додаємо команди в меню
  if (APP_SETTINGS.ENABLE_NUTRITION) {
    commands.push({command: "food", description: "📸 Швидке внесення їжі"});
    commands.push({command: "report", description: "📊 Звіт за сьогодні"});
  }

  commands.push({command: "admin", description: "👮‍♂️ Адмін-панель"});

  var url = telegramUrl + "/setMyCommands";
  UrlFetchApp.fetch(url, {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify({ "commands": commands })
  });
}
function sendMyNorms(chatId) {
  var targets = getUserTargets(chatId); 
  
  if (!targets || (targets.p === 0 && targets.f === 0 && targets.c === 0)) {
    sendMessage(chatId, "⚠️ <b>Твої норми ще не встановлені.</b>\nЗвернись до тренера, щоб він заповнив твій профіль.");
    return;
  }

  // Розрахунок калорій: Білки*4 + Жири*9 + Вуглеводи*4
  var calculatedKcal = (targets.p * 4) + (targets.f * 9) + (targets.c * 4);
  
  var msg = "🎯 <b>ТВОЇ ДЕННІ НОРМИ:</b>\n\n" +
            "🥩 <b>Білки:</b> " + targets.p + " г\n" +
            "🥑 <b>Жири:</b> " + targets.f + " г\n" +
            "🍞 <b>Вуглеводи:</b> " + targets.c + " г\n" +
            "🥗 <b>Клітковина:</b> " + (targets.fiber || 0) + " г\n" +
            "➖➖➖➖➖➖➖➖\n" +
            "🔥 <b>ВСЬОГО: " + Math.round(calculatedKcal) + " ккал</b>\n\n" +
            "<i>(Розраховано автоматично на основі БЖВ)</i>";

  sendMessage(chatId, msg);
}
function parseUserDate(text) {
  try {
    var parts = text.match(/\d+/g); 
    if (!parts || parts.length === 0) return null;

    var now = new Date();
    var day = parseInt(parts[0]);
    var month = (parts.length > 1) ? parseInt(parts[1]) - 1 : now.getMonth(); 
    var year = (parts.length > 2) ? parseInt(parts[2]) : now.getFullYear();

    if (year < 100) year += 2000;
    
    var d = new Date(year, month, day);
    if (d.getDate() !== day) return null; // Перевірка на "криві" дати (31 червня тощо)

    return d;
  } catch (e) { return null; }
}
function debugUserData() {
  var userId = "382654823"; // Ваш ID
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(usersSheetName);
  
  Logger.log("=== ДІАГНОСТИКА ТАБЛИЦІ USERS ===");
  Logger.log("Назва листа: " + usersSheetName);
  Logger.log("Останній рядок: " + s.getLastRow());
  Logger.log("Останній стовпець: " + s.getLastColumn());
  
  Logger.log("\n--- ЗАГОЛОВКИ (рядок 1) ---");
  var headers = s.getRange(1, 1, 1, 10).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    Logger.log("Колонка " + String.fromCharCode(65 + i) + ": [" + headers[i] + "]");
  }
  
  Logger.log("\n--- ПОШУК КОРИСТУВАЧА ---");
  var data = s.getRange(2, 1, s.getLastRow() - 1, 5).getValues();
  Logger.log("Зчитано рядків: " + data.length);
  
  for (var i = 0; i < data.length; i++) {
    var rowId = String(data[i][0]).trim();
    if (rowId == userId) {
      Logger.log("\n✅ ЗНАЙДЕНО В РЯДКУ " + (i + 2) + ":");
      Logger.log("A (ID): [" + data[i][0] + "]");
      Logger.log("B (Ім'я): [" + data[i][1] + "]");
      Logger.log("C (Силові): [" + data[i][2] + "]");
      Logger.log("D (День оплати): [" + data[i][3] + "]");
      Logger.log("E (Біг): [" + data[i][4] + "]");
      
      Logger.log("\n--- ПЕРЕВІРКА ТРИМОВАНИХ ЗНАЧЕНЬ ---");
      var gymVal = String(data[i][2] || "").trim();
      var runVal = String(data[i][4] || "").trim();
      Logger.log("gymSheet після trim: [" + gymVal + "]");
      Logger.log("runSheet після trim: [" + runVal + "]");
      
      Logger.log("\n--- ПЕРЕВІРКА ЧИ ІСНУЮТЬ ЛИСТИ ---");
      var gymExists = ss.getSheetByName(gymVal);
      var runExists = ss.getSheetByName(runVal);
      Logger.log("Лист '" + gymVal + "' існує: " + (gymExists !== null));
      Logger.log("Лист '" + runVal + "' існує: " + (runExists !== null));
    }
  }
  
  Logger.log("\n--- СПИСОК ВСІХ ЛИСТІВ ---");
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    Logger.log((i+1) + ". [" + sheets[i].getName() + "]");
  }
}
function testProtection() {
  Logger.log("=== ТЕСТ ЗАХИСТУ ===");
  Logger.log("ENABLE_CONTENT_PROTECTION: " + APP_SETTINGS.ENABLE_CONTENT_PROTECTION);
  
  var testId = "123456789";
  var shouldProtect = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(testId) !== String(adminId));
  Logger.log("shouldProtect для клієнта: " + shouldProtect);
  
  var shouldProtectAdmin = APP_SETTINGS.ENABLE_CONTENT_PROTECTION && (String(adminId) !== String(adminId));
  Logger.log("shouldProtect для адміна: " + shouldProtectAdmin);
}
function saveStepsToSheet(id, name, steps) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // Чекаємо черги, якщо записують одночасно

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(nutritionSheetName);
    if (!sheet) return steps;

    // Примусово оновлюємо дані в пам'яті
    SpreadsheetApp.flush();

    var now = new Date();
    var dateStr = Utilities.formatDate(now, "GMT+2", "dd.MM.yyyy");
    var timeStr = Utilities.formatDate(now, "GMT+2", "HH:mm");
    
    var lastRow = sheet.getLastRow();
    var data = (lastRow > 1) ? sheet.getRange(1, 1, lastRow, 12).getValues() : [];
    
    var foundRow = -1;
    var currentStepsInSheet = 0;

    // Шукаємо рядок за СЬОГОДНІ
    for (var i = data.length - 1; i >= 1; i--) {
      var rowId = String(data[i][0]).trim();
      var rowType = String(data[i][4]).trim();
      var cellDate = data[i][2];
      
      var rowDateStr = (cellDate instanceof Date) 
                       ? Utilities.formatDate(cellDate, "GMT+2", "dd.MM.yyyy") 
                       : String(cellDate).trim();

      if (rowId == String(id) && rowDateStr == dateStr && rowType == "Кроки") {
        foundRow = i + 1;
        currentStepsInSheet = parseInt(data[i][11]) || 0;
        break; 
      }
    }

    if (foundRow !== -1) {
      // ОНОВЛЮЄМО існуючий рядок
      var newTotal = currentStepsInSheet + steps;
      sheet.getRange(foundRow, 12).setValue(newTotal);
      sheet.getRange(foundRow, 4).setValue(timeStr);
      SpreadsheetApp.flush();
      return newTotal;
    } else {
      // СТВОРЮЄМО новий рядок, якщо за сьогодні ще нічого немає
      sheet.appendRow([id, name, dateStr, timeStr, "Кроки", "", "", "", "", "", "", steps]);
      SpreadsheetApp.flush();
      return steps;
    }

  } catch (e) {
    Logger.log("Помилка запису кроків: " + e.toString());
    return steps;
  } finally {
    lock.releaseLock();
  }
}

// Допоміжна функція, щоб не дублювати appendRow
function appendNewStepsRow(sheet, rowData) {
  sheet.appendRow(rowData);
}
function sendEveningAdminStepsAlert() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var uSheet = ss.getSheetByName(usersSheetName);
  var nSheet = ss.getSheetByName(nutritionSheetName);
  if (!uSheet || !nSheet) return;

  var now = new Date();
  var dateStr = Utilities.formatDate(now, "GMT+2", "dd.MM.yyyy");

  // 1. Отримуємо список усіх клієнтів (ID, Ім'я, Норма в колонці K)
  var lastRowU = uSheet.getLastRow();
  if (lastRowU < 2) return;
  var uData = uSheet.getRange(2, 1, lastRowU - 1, 11).getValues();

  // 2. Отримуємо всі записи про кроки за сьогодні з листа Nutrition
  var nData = nSheet.getDataRange().getValues();
  var stepsMap = {}; // Створюємо словник {id: кроки}
  
  for (var i = 1; i < nData.length; i++) {
    var rowId = String(nData[i][0]);
    var rowType = String(nData[i][4]);
    var cellDate = nData[i][2];
    var rowDate = (cellDate instanceof Date) 
                  ? Utilities.formatDate(cellDate, "GMT+2", "dd.MM.yyyy") 
                  : String(cellDate).trim();

    if (rowDate == dateStr && rowType == "Кроки") {
      stepsMap[rowId] = parseInt(nData[i][11]) || 0;
    }
  }

  // 3. Формуємо звіт
  var report = "📊 <b>ВЕЧІРНІЙ ЗВІТ ПО КРОКАХ</b> (" + dateStr + ")\n\n";
  var totalClients = 0;

  for (var j = 0; j < uData.length; j++) {
    var uid = String(uData[j][0]);
    var uName = uData[j][1];
    var uGoal = parseInt(uData[j][10]) || 10000;

    if (uid == String(adminId) || !uid) continue; // Пропускаємо адміна та пусті рядки
    totalClients++;

    if (stepsMap[uid] !== undefined) {
      var walked = stepsMap[uid];
      var statusEmoji = (walked >= uGoal) ? "✅" : "⚠️";
      report += statusEmoji + " " + uName + ": <b>" + walked + "</b> / " + uGoal + "\n";
    } else {
      report += "❌ " + uName + ": <i>дані не внесені</i>\n";
    }
  }

  if (totalClients == 0) return;

  // 4. Відправляємо адміну
  sendMessage(adminId, report);
}
function checkMe() {
  // Ця функція створена лише для перевірки видимості
}
function getStepsLeaderboard(period) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nSheet = ss.getSheetByName(nutritionSheetName);
  var uSheet = ss.getSheetByName(usersSheetName);
  
  var now = new Date();
  var startTime = new Date();
  
  if (period === 'week') {
    // Визначаємо початок поточного тижня (понеділок 00:00)
    var day = now.getDay(); // 0 - неділя, 1 - понеділок...
    var diff = now.getDate() - day + (day == 0 ? -6 : 1); 
    startTime = new Date(now.setDate(diff));
    startTime.setHours(0, 0, 0, 0); 
  } else {
    // Початок сьогоднішнього дня (00:00:00)
    startTime.setHours(0, 0, 0, 0);
  }

  var data = nSheet.getDataRange().getValues();
  var users = uSheet.getDataRange().getValues();
  var stats = {}; 
  var userNames = {};

  // Збираємо імена юзерів (ID -> Name)
  for (var i = 1; i < users.length; i++) {
    var uid = String(users[i][0]).trim();
    if (uid) userNames[uid] = users[i][1];
  }

  // Збираємо кроки
  for (var j = 1; j < data.length; j++) {
    var rowId = String(data[j][0]).trim();
    var cellDate = data[j][2];
    var rowDate = (cellDate instanceof Date) ? cellDate : new Date(cellDate);
    var rowType = String(data[j][4]);

    // Фільтруємо за типом "Кроки" та часом
    if (rowType === "Кроки" && rowDate >= startTime) {
      var steps = parseInt(data[j][11]) || 0;
      stats[rowId] = (stats[rowId] || 0) + steps;
    }
  }

  // Знайдіть це у своїй функції getStepsLeaderboard:
  var leaderboard = [];
  for (var id in stats) {
    if (userNames[id]) {
      // ДОДАЄМО СЮДИ id: id 👇
      leaderboard.push({ name: userNames[id], steps: stats[id], id: id });
    }
  }
  // Сортуємо: хто більше пройшов — той вище
  return leaderboard.sort((a, b) => b.steps - a.steps);
}
function checkWeeklyWinner() {
  // 1. Отримуємо рейтинг за тиждень
  var leaderboard = getStepsLeaderboard('week');
  
  if (leaderboard.length === 0) {
    sendMessage(adminId, "📢 <b>Звіт по тижню:</b> Учасників з даними по кроках не знайдено.");
    return;
  }

  // 2. Визначаємо переможця та срібного призера
  var winner = leaderboard[0];
  var runnerUp = (leaderboard.length > 1) ? leaderboard[1] : { name: "самого себе", steps: 0 };
  
  // 3. Рахуємо різницю
  var diff = winner.steps - runnerUp.steps;

  // 4. Формуємо текст привітання
  var congratsText = "🏆 <b>ТИТУЛ ЧЕМПІОНА ТИЖНЯ ЗДОБУТО!</b>\n\n" +
                     "🥇 Вітаємо, <b>" + winner.name + "</b>!\n\n" +
                     "Твій результат за останні 7 днів просто вражає: <b>" + winner.steps.toLocaleString() + "</b> кроків! 🔥\n\n" +
                     "Ти став лідером нашого рейтингу, випередивши найближчого суперника (" + runnerUp.name + ") на <b>" + diff.toLocaleString() + "</b> кроків.\n\n" +
                     "Чудова робота! Так тримати! 💪✨";

  // 5. Відправляємо повідомлення переможцю
  // Перевіряємо чи є ID (якщо ми збирали ID в getStepsLeaderboard)
  if (winner.id) {
    sendMessage(winner.id, congratsText);
  }

  // 6. Обов'язково дублюємо адміну
  var adminReport = "📢 <b>ПЕРЕМОЖЕЦЬ ТИЖНЯ ВИЗНАЧЕНИЙ!</b>\n" +
                    "🏆 " + winner.name + "\n" +
                    "👣 Кроків: " + winner.steps.toLocaleString() + "\n" +
                    "📈 Відрив: " + diff.toLocaleString() + " від " + runnerUp.name;
  
  sendMessage(adminId, adminReport);
}
function repairStepsDuplicates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var data = sheet.getDataRange().getValues();
  var toDelete = [];
  var sums = {}; // { "ID_Date": {sum: X, firstRow: Y} }

  for (var i = 1; i < data.length; i++) {
    var id = String(data[i][0]);
    var date = (data[i][2] instanceof Date) ? Utilities.formatDate(data[i][2], "GMT+2", "dd.MM.yyyy") : String(data[i][2]);
    var type = String(data[i][4]);
    var steps = parseInt(data[i][11]) || 0;

    if (type === "Кроки") {
      var key = id + "_" + date;
      if (!sums[key]) {
        sums[key] = { sum: steps, firstRow: i + 1 };
      } else {
        sums[key].sum += steps;
        toDelete.push(i + 1); // Позначаємо дублікат на видалення
      }
    }
  }

  // Оновлюємо перші рядки новими сумами
  for (var key in sums) {
    sheet.getRange(sums[key].firstRow, 12).setValue(sums[key].sum);
  }

  // Видаляємо дублікати з кінця до початку
  toDelete.sort((a, b) => b - a).forEach(row => sheet.deleteRow(row));
  
  Logger.log("Видалено дублікатів: " + toDelete.length);
}
function sendRecipesList(id, msgId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(recipesSheetName);
  
  if (!sheet) {
    sendMessage(id, "⚠️ Лист '" + recipesSheetName + "' не знайдено в таблиці.");
    return;
  }

  var data = sheet.getDataRange().getValues();
  var msg = "📖 <b>КОРИСНІ РЕЦЕПТИ</b>\n\n";
  var count = 0;

  for (var i = 1; i < data.length; i++) {
    var title = data[i][0]; // Колонка А
    var link = data[i][1];  // Колонка В
    
    if (title && link && String(link).includes("http")) {
      msg += (count + 1) + ". <a href='" + link + "'>" + title + "</a>\n";
      count++;
    }
  }

  if (count === 0) {
    msg = "📂 Список рецептів поки порожній. Тренер скоро їх додасть!";
  }

  var kb = {
    inline_keyboard: [[{ text: "⬅️ Назад до харчування", callback_data: "nutri_back_from_recipes" }]]
  };

  if (msgId) {
    editMessage(id, msgId, msg);
    editMessageReplyMarkup(id, msgId, JSON.stringify(kb));
  } else {
    sendMessage(id, msg, JSON.stringify(kb));
  }
}
function testGPT() {
  var prompt = "Проаналізуй: курка 200г, рис 150г. Відповідай JSON.";
  var result = callOpenAINutrition(prompt, null, "analyze_text");
  Logger.log("=== РЕЗУЛЬТАТ GPT ===");
  Logger.log(JSON.stringify(result, null, 2));
}
function debugLastNutrition() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    var data = sheet.getRange(lastRow, 1, 1, 11).getValues()[0];
    Logger.log("=== ОСТАННІЙ ЗАПИС ===");
    Logger.log("Food: " + data[4]);
    Logger.log("Kcal: " + data[5]);
    Logger.log("P: " + data[6]);
    Logger.log("F: " + data[7]);
    Logger.log("C: " + data[8]);
    Logger.log("Fiber: " + data[9]);
  }
}
function testCorrectionDebug() {
  var namesList = "0. Вівсянка (100г)\n1. Молоко (250г)\n";
  var userCorrection = "Вівсянка в сухому вигляді 150 грамів, протеїн джем бім 35 грамів.";
  
  var finalPrompt = "СПИСОК ІНГРЕДІЄНТІВ:\n" + namesList + "\nПРАВКА: \"" + userCorrection + "\"\n\nПроаналізуй кожен продукт у правці окремо. Якщо продукт Є в списку — зміни йому вагу. Якщо продукту НЕМАЄ в списку — додай як новий (old_index: -1). НЕ видаляй та НЕ замінюй інгредієнти яких користувач не просив видалити.";
  
  var result = callOpenAINutrition(finalPrompt, null, "correction");
  
  var msg = "🔬 <b>ТЕСТ КОРЕКЦІЇ:</b>\n\n";
  msg += "<b>Промпт:</b>\n" + finalPrompt.substring(0, 300) + "\n\n";
  msg += "<b>GPT відповів:</b>\n<code>" + JSON.stringify(result, null, 2).substring(0, 3000) + "</code>";
  
  sendMessage(adminId, msg);
}
function testDateDebug2() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var data = sheet.getDataRange().getValues();
  
  var today = new Date();
  var todayStr = Utilities.formatDate(today, "GMT+2", "dd.MM.yyyy");
  
  var msg = "🔬 <b>DEBUG для ID " + adminId + ":</b>\n";
  msg += "Сьогодні: <b>" + todayStr + "</b>\n";
  msg += "Всього рядків: " + data.length + "\n\n";
  
  var count = 0;
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) == String(adminId)) {
      var rawDate = data[i][2];
      var isDate = rawDate instanceof Date;
      var formatted = isDate ? Utilities.formatDate(rawDate, "GMT+2", "dd.MM.yyyy") : String(rawDate);
      var food = String(data[i][4]).substring(0, 30);
      var match = (formatted == todayStr) ? "✅" : "❌";
      
      msg += "Рядок " + (i+1) + ": [" + formatted + "] " + match + " | " + food + "\n";
      count++;
      if (count >= 5) break;
    }
  }
  
  if (count === 0) msg += "❌ Записів з ID " + adminId + " не знайдено!";
  
  sendMessage(adminId, msg);
}
function testReportDebug() {
  var today = new Date();
  var todayStr = Utilities.formatDate(today, "GMT+2", "dd.MM.yyyy");
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nutritionSheetName);
  var data = sheet.getDataRange().getValues();
  
  var msg = "🔬 <b>DEBUG ЗВІТУ:</b>\n";
  msg += "ID: " + adminId + " | Дата: " + todayStr + "\n\n";
  
  var count = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) == String(adminId)) {
      var cellDate = data[i][2];
      var checkDate = (cellDate instanceof Date) ? Utilities.formatDate(cellDate, "GMT+2", "dd.MM.yyyy") : String(cellDate);
      var food = String(data[i][4]).substring(0, 25);
      var isSteps = (String(data[i][4]) === "Кроки");
      
      msg += "Рядок " + (i+1) + ": date=" + checkDate + " match=" + (checkDate == todayStr) + " food=" + food + " isSteps=" + isSteps + "\n";
      count++;
    }
  }
  
  msg += "\nЗнайдено рядків з цим ID: " + count;
  
  // Тепер викликаємо сам звіт
  msg += "\n\n🔥 Запускаю sendDailyNutritionReport...";
  sendMessage(adminId, msg);
  
  sendDailyNutritionReport(adminId);
}
function redeployWebhook() {
  var result = UrlFetchApp.fetch(telegramUrl + "/setWebhook?url=" + webAppUrl).getContentText();
  Logger.log(result);
  sendMessage(adminId, "🔧 Webhook оновлено:\n" + result);
}
function generateFullSystemDocumentation() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = "";
  
  // === ЗАГОЛОВОК ===
  report += "═══════════════════════════════════════════════════════════\n";
  report += "🤖 ПОВНА ТЕХНІЧНА ДОКУМЕНТАЦІЯ TELEGRAM ФІТНЕС-БОТА\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  report += "📅 Згенеровано: " + new Date().toLocaleString("uk-UA") + "\n";
  report += "🆔 Spreadsheet ID: " + ss.getId() + "\n";
  report += "🔗 Bot Token: " + token.substring(0, 15) + "...\n";
  report += "👤 Admin ID: " + adminId + "\n";
  report += "🌐 Web App URL: " + webAppUrl + "\n";
  report += "🔑 OpenAI Key: " + OPENAI_API_KEY.substring(0, 20) + "...\n";
  report += "📊 Food DB ID: " + FOOD_DB_ID + "\n\n";
  
  // === 1. АНАЛІЗ GOOGLE SHEETS ===
  report += "═══════════════════════════════════════════════════════════\n";
  report += "📊 1. СТРУКТУРА GOOGLE ТАБЛИЦІ\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  var sheets = ss.getSheets();
  report += "Всього листів: " + sheets.length + "\n\n";
  
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    report += "--- Лист " + (i+1) + ": [" + name + "] ---\n";
    report += "Розмір: " + lastRow + " рядків × " + lastCol + " колонок\n";
    
    if (lastRow > 0 && lastCol > 0) {
      var headers = sheet.getRange(1, 1, 1, Math.min(lastCol, 20)).getValues()[0];
      report += "Колонки: ";
      for (var h = 0; h < Math.min(headers.length, 20); h++) {
        var colLetter = String.fromCharCode(65 + h);
        if (h > 25) colLetter = "A" + String.fromCharCode(65 + h - 26);
        report += colLetter + "=" + String(headers[h]).substring(0, 15);
        if (h < headers.length - 1 && h < 19) report += " | ";
      }
      if (lastCol > 20) report += "... ще " + (lastCol - 20) + " колонок";
      report += "\n";
      
      // Спеціальний аналіз для системних листів
      if (name === usersSheetName) {
        report += "\n💡 ПРИЗНАЧЕННЯ: База користувачів\n";
        report += "   A - Telegram ID\n";
        report += "   B - Ім'я\n";
        report += "   C - Силові тренування (назва листа)\n";
        report += "   D - День оплати\n";
        report += "   E - Біг (назва листа)\n";
        report += "   F-J - Норми КБЖВ (Ккал, Білки, Жири, Вуглеводи, Клітковина)\n";
        report += "   K - Норма кроків\n";
        report += "   L - Залишок тренувань (формат: 5/10)\n";
        report += "   M - Дата початку абонементу\n";
      }
      
      if (name === nutritionSheetName) {
        report += "\n💡 ПРИЗНАЧЕННЯ: Щоденник харчування та активності\n";
        report += "   A - ID користувача\n";
        report += "   B - Ім'я\n";
        report += "   C - Дата (dd.MM.yyyy)\n";
        report += "   D - Час\n";
        report += "   E - Назва страви (або 'Кроки')\n";
        report += "   F - Калорії\n";
        report += "   G - Білки\n";
        report += "   H - Жири\n";
        report += "   I - Вуглеводи\n";
        report += "   J - Клітковина\n";
        report += "   K - ID фото з Telegram\n";
        report += "   L - Кількість кроків (якщо E='Кроки')\n";
      }
      
      if (name === "Settings") {
        report += "\n💡 ПРИЗНАЧЕННЯ: Налаштування бота\n";
        report += "   A2-D2: Реквізити для оплати (ФОП, IBAN, Mono, Privat)\n";
        report += "   E2: URL медіа для вітального повідомлення\n";
        report += "   F2: Текст вітального повідомлення\n";
        report += "   G2→: Питання анкети (кожна колонка = питання)\n";
        report += "          Рядок 1 = текст питання\n";
        report += "          Рядки 2+ = варіанти відповідей\n";
      }
      
      if (name === exercisesSheetName) {
        report += "\n💡 ПРИЗНАЧЕННЯ: База вправ з відео\n";
        report += "   A - Назва вправи\n";
        report += "   B - Посилання на відео\n";
        report += "   C - Категорія (RUN/STRENGTH)\n";
        report += "   D - Група м'язів\n";
      }
      
      if (name === "Анкети") {
        report += "\n💡 ПРИЗНАЧЕННЯ: Архів заповнених анкет\n";
      }
      
      if (name === "Історія Тренувань") {
        report += "\n💡 ПРИЗНАЧЕННЯ: Лог завершених тренувань\n";
      }
      
      if (name === recipesSheetName) {
        report += "\n💡 ПРИЗНАЧЕННЯ: Корисні рецепти\n";
        report += "   A - Назва рецепту\n";
        report += "   B - Посилання\n";
      }
      
      // Аналіз програм тренувань
      if (name !== usersSheetName && name !== nutritionSheetName && name !== "Settings" && 
          name !== exercisesSheetName && name !== "Анкети" && name !== recipesSheetName &&
          name !== "Історія Тренувань" && lastRow > 10) {
        report += "\n💡 ПРИЗНАЧЕННЯ: Програма тренувань\n";
        report += "   A - День (День №1, День №2...)\n";
        report += "   B - Цикл або Назва вправи\n";
        report += "   C - Примітка\n";
        report += "   D - План: Вага/Інтенсивність\n";
        report += "   E - План: Підходи\n";
        report += "   F - План: Повтори\n";
        report += "   G - Минулий факт\n";
        report += "   H - Зміна показників (факт поточний)\n";
        report += "   I - Примітки до вправи\n";
        report += "   J - Час виконання\n";
        report += "   K - Реальний час (факт)\n";
      }
    }
    report += "\n";
  }
  
  // === 2. HTML ФАЙЛИ ===
  report += "\n═══════════════════════════════════════════════════════════\n";
  report += "📄 2. HTML ФАЙЛИ (WEB APP)\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  // Отримуємо список HTML файлів через аналіз doGet
  var htmlFiles = [
    {name: "TrackerApp.html", route: "?page=tracker", desc: "Трекер вправ"},
    {name: "MeasurementsView.html", route: "?page=measurements", desc: "Заміри тіла"},
    {name: "LeaderboardApp.html", route: "?page=leaderboard", desc: "Рейтинг кроків"},
    {name: "Anketa.html", route: "за замовчуванням", desc: "Анкета новачка"}
  ];
  
  for (var f = 0; f < htmlFiles.length; f++) {
    var file = htmlFiles[f];
    report += (f+1) + ". " + file.name + "\n";
    report += "   Маршрут: " + file.route + "\n";
    report += "   Призначення: " + file.desc + "\n";
    
    if (file.name === "TrackerApp.html") {
      report += "   Технології: Swiper.js, Telegram Web App SDK\n";
      report += "   Ключові JS функції:\n";
      report += "     - init() - завантаження та ініціалізація\n";
      report += "     - renderUI() - відображення списку вправ\n";
      report += "     - initSwiper() - ініціалізація слайдера\n";
      report += "     - incrementSets(index) - +1 підхід\n";
      report += "     - decrementSets(index) - -1 підхід\n";
      report += "     - toggleEditForm(index) - показ/приховування форми\n";
      report += "     - saveExercise(index) - збереження змін вправи\n";
      report += "     - sendDataToBot() - відправка через tg.sendData()\n";
      report += "   Дані IN: exercisesJSON через <?= ?>\n";
      report += "   Дані OUT: JSON через web_app_data → doPost\n";
    }
    
    if (file.name === "MeasurementsView.html") {
      report += "   Технології: Telegram Web App SDK\n";
      report += "   Поля форми: Вага, Талія, Стегна, Груди, Бара\n";
      report += "   Відправка: tg.sendData() → doPost\n";
    }
    
    if (file.name === "LeaderboardApp.html") {
      report += "   Технології: Telegram Web App SDK\n";
      report += "   Дані: fetch() від getStepsLeaderboard()\n";
      report += "   Відображення: Топ користувачів по кроках\n";
    }
    
    if (file.name === "Anketa.html") {
      report += "   Технології: Telegram Web App SDK\n";
      report += "   Структура: Динамічна (питання з Settings G+)\n";
      report += "   Обробка: processAnketaDataDynamic()\n";
    }
    
    report += "\n";
  }
  
  // === 3. GOOGLE APPS SCRIPT ===
  report += "\n═══════════════════════════════════════════════════════════\n";
  report += "💻 3. СТРУКТУРА КОДУ (Apps Script)\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  report += "ФАЙЛ: TelegramBot.gs\n";
  report += "Розмір: ~4500+ рядків коду\n\n";
  
  // Аналіз функцій
  var functionsList = [
    "// === БЛОК: НАЛАШТУВАННЯ ===",
    "token, adminId, OPENAI_API_KEY - глобальні константи",
    "webAppUrl - URL для Web App",
    "APP_SETTINGS - прапорці вкл/викл функцій",
    "",
    "// === БЛОК: TELEGRAM API ===",
    "sendMessage(id, txt, mk) - відправка повідомлення",
    "sendPhoto(id, pid, cap, mk) - відправка фото",
    "sendVideo(id, videoId, caption, mk) - відправка відео",
    "sendDocument(id, did, cap, mk) - відправка документа",
    "editMessage(id, mid, txt) - редагування повідомлення",
    "editMessageReplyMarkup(id, mid, kb) - оновлення кнопок",
    "setMessageReaction(id, mid, em) - реакція на повідомлення",
    "",
    "// === БЛОК: КОРИСТУВАЧІ ===",
    "getUserInfo(id) - отримання даних користувача",
    "addUserToSheet(id, n) - додавання нового користувача",
    "getUserTrainingStats(userId) - статистика тренувань",
    "getUserTargets(userId) - норми КБЖВ",
    "setUserState(id, s) - збереження стану діалогу",
    "getUserState(id) - отримання стану",
    "deleteUserState(id) - очищення стану",
    "",
    "// === БЛОК: МЕНЮ ТА НАВІГАЦІЯ ===",
    "sendModeSelector(id, name) - головне меню",
    "sendDayButtons(id, sheetName, modeTitle) - кнопки днів",
    "sendAdminMenu(id) - адмін-панель",
    "sendWelcomeMessage(id, isManualQuest) - вітальне повідомлення",
    "sendBotInstruction(id) - інструкція",
    "",
    "// === БЛОК: ТРЕНУВАННЯ ===",
    "findWorkout(dayName, sheetName, specificRow) - пошук тренування",
    "getWorkoutDays(sheetName, specificStartRow) - список днів",
    "getLatestCycleRow(sn) - останній актуальний цикл",
    "cleanWorkoutName(str) - очищення назви дня",
    "getExerciseVideoMap() - карта відео вправ",
    "getExercisesDatabase() - категорії вправ (RUN/STRENGTH)",
    "getExerciseDataForTracker(chatId, rowId, sheetName) - дані для трекера",
    "writeExerciseResult(sheetName, row, text) - запис результату",
    "writeTimeResult(sheetName, row, text) - запис часу",
    "handleTrackerClick(chatId, messageId, currentMarkup, row, sheetName) - лічильник підходів",
    "logFinishedTraining(chatId, userName, dayName, sheetName) - лог завершення",
    "",
    "// === БЛОК: РЕЖИМ РАНОК/ВЕЧІР ===",
    "checkMorningEveningMode(userId) - перевірка Р/В режиму",
    "getSheetTimeMode(sheetName) - визначення часу",
    "sendDaySelector(chatId) - меню днів Р/В",
    "sendMorningEveningSelector(chatId, dayLabel) - вибір часу",
    "sendMevDayPlan(chatId, dayLabel, sheetNameEncoded) - показ плану",
    "encodeSheetName(name) - кодування назви листа",
    "decodeSheetName(encoded, userId) - декодування",
    "",
    "// === БЛОК: ВІДЕО ===",
    "sendVideoInstructions(id, msgId) - меню відео",
    "sendVideoByCategory(id, category) - відео по категорії",
    "",
    "// === БЛОК: АРХІВ ===",
    "sendArchiveList(id, sheetName) - список циклів",
    "sendArchiveDaysMenu(id, sheetName, row, name) - дні архіву",
    "",
    "// === БЛОК: ОПЛАТА ===",
    "sendClientRequisites(id) - реквізити",
    "sendInvoice(id, sum) - виставлення рахунку",
    "handlePaymentScreenshot(id, n, photos, doc, username) - обробка скріншоту",
    "checkPaymentDates() - перевірка днів оплати (тригер)",
    "",
    "// === БЛОК: ХАРЧУВАННЯ - ОСНОВА ===",
    "callOpenAINutrition(promptText, imageBlob, mode) - виклик GPT-4o",
    "transcribeAudio(fileId) - розпізнавання голосу (Whisper)",
    "saveNutritionToSheet(id, name, data) - збереження прийому їжі",
    "sendDailyNutritionReport(chatId, dateObj, targetUserId) - звіт за день",
    "sendMyNorms(chatId) - показ норм КБЖВ",
    "parseUserDate(text) - парсинг дати (25.01 або 25 01)",
    "parseDirectNutrition(text) - прямий ввід КБЖВ",
    "sendFoodPhotosAlbum(chatId, userId, dateStr) - альбом фото страв",
    "",
    "// === БЛОК: БАЗА ПРОДУКТІВ ===",
    "getFoodDB() - доступ до бази продуктів",
    "findProductInDB(name) - пошук продукту",
    "findExactProduct(name) - точне співпадіння",
    "calcNutrition(product, weightG) - розрахунок на вагу",
    "addProductToDB(name, kcal, p, f, c, fiber, category) - додавання",
    "addSynonymToDB(synonym, mainName) - додавання синоніма",
    "processItemsWithDB(gptItems) - гібрид БД+GPT",
    "",
    "// === БЛОК: ШТРИХ-КОДИ ===",
    "scanBarcode(barcode) - OpenFoodFacts API",
    "",
    "// === БЛОК: РЕЦЕПТИ ===",
    "sendRecipesList(id, msgId) - список рецептів",
    "",
    "// === БЛОК: КРОКИ ===",
    "saveStepsToSheet(id, name, steps) - запис кроків (з lock)",
    "getStepsLeaderboard(period) - рейтинг ('day'/'week')",
    "checkWeeklyWinner() - визначення переможця тижня",
    "sendEveningAdminStepsAlert() - вечірній звіт адміну",
    "repairStepsDuplicates() - видалення дублікатів",
    "",
    "// === БЛОК: АНКЕТА ===",
    "getAnketaQuestions() - читання питань з Settings",
    "processAnketaData(formData) - обробка (стара версія)",
    "processAnketaDataDynamic(formData) - обробка (нова динамічна)",
    "",
    "// === БЛОК: АДМІН ===",
    "sendUserListForAdmin(id, p) - список користувачів",
    "sendPersonalMessage(r) - особисте повідомлення клієнту",
    "sendBroadcast(txt) - розсилка всім",
    "sendReminderToAll() - нагадування про звіт",
    "",
    "// === БЛОК: ГОЛОВНІ ОБРОБНИКИ ===",
    "doGet(e) - роутер Web App",
    "doPost(e) - обробник Telegram запитів",
    "setWebhook() - встановлення webhook",
    "setBotCommands() - встановлення команд меню",
    "",
    "// === БЛОК: ТЕСТИ ТА DEBUG ===",
    "runFullSystemAudit() - повний аудит таблиці",
    "generateFullSystemDocumentation() - ця функція :)",
    "testGenerateDocs() - тест документації (Logger)",
    "testSendDocsToTelegram() - тест відправки в Telegram"
  ];
  
  for (var fn = 0; fn < functionsList.length; fn++) {
    report += functionsList[fn] + "\n";
  }
  
  // === 4. ІНТЕГРАЦІЇ ===
  report += "\n\n═══════════════════════════════════════════════════════════\n";
  report += "🔌 4. ЗОВНІШНІ ІНТЕГРАЦІЇ\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  report += "1. OpenAI GPT-4o + Whisper\n";
  report += "   Модель: gpt-4o\n";
  report += "   Endpoint: https://api.openai.com/v1/chat/completions\n";
  report += "   Використання:\n";
  report += "     - Аналіз фото їжі (Vision)\n";
  report += "     - Розпізнавання штрих-кодів (Vision)\n";
  report += "     - Розпізнавання етикеток (Vision)\n";
  report += "     - Транскрипція голосу (Whisper)\n";
  report += "   API Key: " + OPENAI_API_KEY.substring(0, 20) + "...\n\n";
  
  report += "2. Telegram Bot API\n";
  report += "   Base URL: https://api.telegram.org/bot" + token.substring(0, 15) + "...\n";
  report += "   Методи:\n";
  report += "     - sendMessage, sendPhoto, sendVideo, sendDocument\n";
  report += "     - editMessageText, editMessageReplyMarkup\n";
  report += "     - setMessageReaction, answerCallbackQuery\n";
  report += "     - setWebhook, setMyCommands\n";
  report += "   Web App SDK: https://telegram.org/js/telegram-web-app.js\n\n";
  
  report += "3. OpenFoodFacts API\n";
  report += "   URL: https://world.openfoodfacts.org/api/v2/\n";
  report += "   Використання: Пошук продуктів по штрих-коду\n";
  report += "   Формат: GET /product/{barcode}.json\n\n";
  
  report += "4. Google Sheets API (вбудований)\n";
  report += "   SpreadsheetApp, Sheet, Range\n";
  report += "   Використання: Основне сховище даних\n\n";
  
  report += "5. База Продуктів (окрема таблиця)\n";
  report += "   ID: " + FOOD_DB_ID + "\n";
  report += "   Листи:\n";
  report += "     - Продукти (назва, КБЖВ на 100г)\n";
  report += "     - Синоніми (варіанти назв)\n";
  report += "     - Бренди (брендові продукти)\n\n";
  
  // === 5. WORKFLOW ===
  report += "\n═══════════════════════════════════════════════════════════\n";
  report += "🔄 5. ОСНОВНІ СЦЕНАРІЇ РОБОТИ\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  report += "A. НОВИЙ КОРИСТУВАЧ\n";
  report += "   1. /start → sendWelcomeMessage()\n";
  report += "   2. Показ медіа (якщо є в Settings E2)\n";
  report += "   3. Кнопка 'Надіслати заявку' → callback: start_request\n";
  report += "   4. Адмін отримує сповіщення з 3 кнопками:\n";
  report += "      - Написати в ЛС\n";
  report += "      - Додати клієнта → addUserToSheet()\n";
  report += "      - Виставити рахунок\n\n";
  
  report += "B. ТРЕНУВАННЯ (звичайний режим)\n";
  report += "   1. Меню → '🏋️‍♂️ Моє тренування'\n";
  report += "   2. Якщо 2 програми → вибір (силові/біг)\n";
  report += "   3. Список днів → вибір дня\n";
  report += "   4. findWorkout() → показ вправ\n";
  report += "   5. Кнопка 'Трекер показників' → Web App (TrackerApp.html)\n";
  report += "   6. Редагування вправ → sendDataToBot()\n";
  report += "   7. doPost отримує web_app_data\n";
  report += "   8. writeExerciseResult() → запис в колонку H\n\n";
  
  report += "C. ТРЕНУВАННЯ (режим Ранок/Вечір)\n";
  report += "   1. checkMorningEveningMode() → виявляє Р/В\n";
  report += "   2. sendDaySelector() → меню днів\n";
  report += "   3. sendMorningEveningSelector() → вибір часу\n";
  report += "   4. Далі як у звичайному режимі\n\n";
  
  report += "D. ХАРЧУВАННЯ (фото страви)\n";
  report += "   1. /food або меню '🍽 Харчування'\n";
  report += "   2. setUserState(chatId, 'nutrition_mode')\n";
  report += "   3. Користувач надсилає фото\n";
  report += "   4. callOpenAINutrition(prompt, imageBlob, 'analyze_photo')\n";
  report += "   5. GPT повертає JSON з items та total\n";
  report += "   6. processItemsWithDB() - гібрид БД + GPT\n";
  report += "   7. Показ результату з кнопками:\n";
  report += "      - Записати\n";
  report += "      - Детальніше\n";
  report += "      - Корективи\n";
  report += "   8. Підтвердження → saveNutritionToSheet()\n\n";
  
  report += "E. ХАРЧУВАННЯ (корекція)\n";
  report += "   1. Кнопка 'Корективи'\n";
  report += "   2. setUserState(chatId, 'waiting_for_food_correction')\n";
  report += "   3. Користувач пише текст або голос\n";
  report += "   4. callOpenAINutrition(prompt, null, 'correction')\n";
  report += "   5. GPT повертає changes[] з old_index та new_item\n";
  report += "   6. Застосування змін локально (без перерахунку всього)\n";
  report += "   7. Показ оновленого результату\n\n";
  
  report += "F. ШТРИХ-КОД (в розробці)\n";
  report += "   1. Фото упаковки → GPT розпізнає\n";
  report += "   2. Якщо status='barcode_detected':\n";
  report += "      - scanBarcode() → OpenFoodFacts\n";
  report += "      - Якщо знайдено → показ КБЖВ\n";
  report += "      - Питання про вагу\n";
  report += "   3. Якщо status='label_detected':\n";
  report += "      - GPT витягує КБЖВ з етикетки\n";
  report += "      - Одразу показ результату\n\n";
  
  report += "G. КРОКИ ТА РЕЙТИНГ\n";
  report += "   1. Меню → '👣 Кроки'\n";
  report += "   2. Кнопка 'Внести дані' → запит числа\n";
  report += "   3. saveStepsToSheet() - підсумовує за день\n";
  report += "   4. Показ звіту: пройдено / норма\n";
  report += "   5. Кнопка 'Рейтинг' → Web App (LeaderboardApp.html)\n";
  report += "   6. getStepsLeaderboard() → топ учасників\n\n";
  
  report += "H. ЗАМІРИ ТІЛА\n";
  report += "   1. Меню → '📏 Внести заміри'\n";
  report += "   2. Web App (MeasurementsView.html)\n";
  report += "   3. Форма: вага, талія, стегна, груди, бара\n";
  report += "   4. tg.sendData() → doPost\n";
  report += "   5. Запис в таблицю (окремий лист або Nutrition)\n\n";
  
  report += "I. АНКЕТА (адмін відправляє вручну)\n";
  report += "   1. Адмін → кнопка 'Відправити анкету'\n";
  report += "   2. Вибір клієнта зі списку\n";
  report += "   3. sendWelcomeMessage(targetId, true)\n";
  report += "   4. Клієнт отримує кнопку Web App\n";
  report += "   5. Anketa.html - динамічна форма\n";
  report += "   6. getAnketaQuestions() - читання з Settings\n";
  report += "   7. processAnketaDataDynamic() - обробка\n";
  report += "   8. Адмін отримує звіт (без кнопок)\n\n";
  
  // === 6. НАЛАШТУВАННЯ ===
  report += "\n═══════════════════════════════════════════════════════════\n";
  report += "⚙️ 6. НАЛАШТУВАННЯ СИСТЕМИ\n";
  report += "═══════════════════════════════════════════════════════════\n\n";
  
  report += "APP_SETTINGS (глобальні прапорці):\n";
  report += "  ENABLE_TRAINING: " + (typeof APP_SETTINGS !== 'undefined' && APP_SETTINGS.ENABLE_TRAINING ? "✅ ON" : "❌ OFF") + "\n";
  report += "  ENABLE_NUTRITION: " + (typeof APP_SETTINGS !== 'undefined' && APP_SETTINGS.ENABLE_NUTRITION ? "✅ ON" : "❌ OFF") + "\n";
  report += "  ENABLE_BILLING: " + (typeof APP_SETTINGS !== 'undefined' && APP_SETTINGS.ENABLE_BILLING ? "✅ ON" : "❌ OFF") + "\n";
  report += "  ENABLE_CONTENT_PROTECTION: " + (typeof APP_SETTINGS !== 'undefined' && APP_SETTINGS.ENABLE_CONTENT_PROTECTION ? "✅ ON" : "❌ OFF") + "\n\n";
  
  report += "ЗМІННІ СЕРЕДОВИЩА:\n";
  report += "  token - токен бота\n";
  report += "  adminId - ID адміністратора\n";
  report += "  OPENAI_API_KEY - ключ OpenAI\n";
  report += "  webAppUrl - URL після deploy\n";
  report += "  FOOD_DB_ID - ID таблиці з продуктами\n\n";
  
  report += "НАЗВИ ЛИСТІВ:\n";
  report += "  usersSheetName = '" + usersSheetName + "'\n";
  report += "  nutritionSheetName = '" + nutritionSheetName + "'\n";
  report += "  settingsSheetName = '" + settingsSheetName + "'\n";
  report += "  exercisesSheetName = '" + exercisesSheetName + "'\n";
  report += "  warmupSheetName = '" + warmupSheetName + "'\n";
  report += "  recipesSheetName = '" + recipesSheetName + "'\n\n";
  
  // === ЗАВЕРШЕННЯ ===
  report += "\n═══════════════════════════════════════════════════════════\n";
  report += "✅ ПОВНУ ДОКУМЕНТАЦІЮ ЗГЕНЕРОВАНО\n";
  report += "═══════════════════════════════════════════════════════════\n";
  report += "\nЦей звіт містить всю інформацію про структуру бота.\n";
  report += "Використовуй його для швидкого онбордингу ШІ-асистентів.\n\n";
  report += "Документація оновлена: " + new Date().toLocaleString("uk-UA") + "\n";
  
  return report;
}
function testSendDocsToTelegram() {
  try {
    Logger.log("=== ПОЧАТОК ===");
    Logger.log("Admin ID: " + adminId);
    Logger.log("Token: " + token.substring(0, 15) + "...");
    
    Logger.log("\n1. Генерую документацію...");
    var doc = generateFullSystemDocumentation();
    Logger.log("   ✅ Згенеровано: " + doc.length + " символів");
    
    Logger.log("\n2. Відправляю тестове повідомлення...");
    sendMessage(adminId, "🧪 Тест: якщо бачиш це - sendMessage працює!");
    Logger.log("   ✅ Тестове повідомлення відправлено");
    
    Logger.log("\n3. Створюю файл...");
    var blob = Utilities.newBlob(doc, "text/plain; charset=utf-8", "BOT_DOCS.txt");
    Logger.log("   ✅ Blob створено. Розмір: " + blob.getBytes().length + " байт");
    
    Logger.log("\n4. Формую запит до Telegram...");
    var url = "https://api.telegram.org/bot" + token + "/sendDocument";
    Logger.log("   URL: " + url.substring(0, 50) + "...");
    
    var formData = {
      'chat_id': String(adminId),
      'document': blob,
      'caption': '📊 Технічна документація системи'
    };
    
    var options = {
      'method': 'post',
      'payload': formData,
      'muteHttpExceptions': true
    };
    
    Logger.log("\n5. Відправляю документ...");
    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseCode = response.getResponseCode();
    
    Logger.log("   Response Code: " + responseCode);
    Logger.log("   Response Body: " + responseText);
    
    if (responseCode === 200) {
      Logger.log("\n✅ ДОКУМЕНТ ВІДПРАВЛЕНО УСПІШНО!");
    } else {
      Logger.log("\n❌ ПОМИЛКА при відправці документа");
    }
    
  } catch(e) {
    Logger.log("\n❌ EXCEPTION: " + e.toString());
    Logger.log("Stack: " + e.stack);
  }
}