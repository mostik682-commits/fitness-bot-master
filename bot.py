import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandObject
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton, 
    ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
)
from supabase import create_client, Client
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiohttp import web

# --- 1. НАЛАШТУВАННЯ ТА СТАНИ ---
load_dotenv('bot.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
BOT_TOKEN = os.getenv("BOT_TOKEN")
CHANNEL_ID = os.getenv("CHANNEL_ID")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
scheduler = AsyncIOScheduler()

logging.basicConfig(level=logging.INFO)

# Стани для зручного введення тексту без команд
class AdminStates(StatesGroup):
    waiting_for_price = State()
    waiting_for_details = State()
    waiting_for_greeting = State()
    waiting_for_payment_text = State()
    waiting_for_success_text = State()
    waiting_for_reminder_text = State()

# --- 2. ДОПОМІЖНІ ФУНКЦІЇ ---

def get_config(key, default="Не встановлено"):
    try:
        res = supabase.table("bot_config").select("value").eq("key", key).execute()
        return res.data[0]['value'] if res.data else default
    except:
        return default

def set_config(key, value):
    supabase.table("bot_config").upsert({"key": key, "value": str(value)}).execute()

# Головне меню адміна (Reply)
def main_admin_kb():
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="📊 Кількість учасників")],
        [KeyboardButton(text="👁️ Відображення")],
        [KeyboardButton(text="⚙️ Налаштування")]
    ], resize_keyboard=True)

# Меню налаштувань (Inline)
def settings_kb():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="💵 Ціна", callback_data="set_price"), 
         InlineKeyboardButton(text="💳 Реквізити", callback_data="set_details")],
        [InlineKeyboardButton(text="👋 Привітання", callback_data="set_greet")],
        [InlineKeyboardButton(text="📝 Текст оплати", callback_data="set_paytext")],
        [InlineKeyboardButton(text="🎉 Текст успіху", callback_data="set_success")],
        [InlineKeyboardButton(text="⏰ Текст нагадування", callback_data="set_remind")]
    ])

# --- 3. ВЕБ-СЕРВЕР ---
async def handle(request): return web.Response(text="Bot is running!")
async def start_web_server():
    app = web.Application()
    app.router.add_get("/", handle)
    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", int(os.getenv("PORT", 8080))).start()

# --- 4. АДМІН-ЛОГІКА ---

@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if str(message.from_user.id) != str(get_config("admin_id")): return
    await message.answer("🔧 <b>Вітаю, Антоне! Панель керування активована.</b>", 
                         reply_markup=main_admin_kb(), parse_mode="HTML")

@dp.message(F.text == "📊 Кількість учасників")
async def admin_count(message: types.Message):
    if str(message.from_user.id) != str(get_config("admin_id")): return
    try:
        count = await bot.get_chat_member_count(CHANNEL_ID)
        await message.answer(f"📈 На даний момент у каналі: <b>{count} учасників</b>", parse_mode="HTML")
    except Exception as e:
        await message.answer(f"❌ Помилка запиту: {e}")

@dp.message(F.text == "👁️ Відображення")
async def admin_view(message: types.Message):
    if str(message.from_user.id) != str(get_config("admin_id")): return
    
    price = get_config("subscription_price", "500 грн")
    details = get_config("payment_details", "Карта...")
    greet = get_config("text_greeting", "Привіт! Бажаєш підписатися?")
    
    await message.answer(f"<b>ТАК БАЧИТЬ КЛІЄНТ:</b>\n\n{greet}\n\n[Кнопка: 💳 Купити ({price})]", parse_mode="HTML")
    await message.answer(f"<b>РЕКВІЗИТИ:</b>\n\n<code>{details}</code>", parse_mode="HTML")

@dp.message(F.text == "⚙️ Налаштування")
async def admin_settings_menu(message: types.Message):
    if str(message.from_user.id) != str(get_config("admin_id")): return
    await message.answer("Оберіть параметр для редагування:", reply_markup=settings_kb())

# ОБРОБНИКИ КНОПОК РЕДАГУВАННЯ
@dp.callback_query(F.data.startswith("set_"))
async def start_editing(callback: types.CallbackQuery, state: FSMContext):
    action = callback.data
    
    config_map = {
        "set_price": (AdminStates.waiting_for_price, "Введіть нову ціну (наприклад: 400 грн)"),
        "set_details": (AdminStates.waiting_for_details, "Введіть нові реквізити"),
        "set_greet": (AdminStates.waiting_for_greeting, "Введіть привітальний текст (можна з лінком на відео)"),
        "set_paytext": (AdminStates.waiting_for_payment_text, "Введіть інструкцію для оплати"),
        "set_success": (AdminStates.waiting_for_success_text, "Введіть текст при активації підписки"),
        "set_remind": (AdminStates.waiting_for_reminder_text, "Введіть текст нагадування (за 3 дні)")
    }
    
    next_state, prompt = config_map[action]
    await state.set_state(next_state)
    await callback.message.answer(f"📝 {prompt}:")
    await callback.answer()

# ЗБЕРЕЖЕННЯ ВВЕДЕНОГО ТЕКСТУ
@dp.message(AdminStates.waiting_for_price)
@dp.message(AdminStates.waiting_for_details)
@dp.message(AdminStates.waiting_for_greeting)
@dp.message(AdminStates.waiting_for_payment_text)
@dp.message(AdminStates.waiting_for_success_text)
@dp.message(AdminStates.waiting_for_reminder_text)
async def save_config_value(message: types.Message, state: FSMContext):
    current_state = await state.get_state()
    
    state_to_key = {
        "AdminStates:waiting_for_price": "subscription_price",
        "AdminStates:waiting_for_details": "payment_details",
        "AdminStates:waiting_for_greeting": "text_greeting",
        "AdminStates:waiting_for_payment_text": "text_payment",
        "AdminStates:waiting_for_success_text": "text_success",
        "AdminStates:waiting_for_reminder_text": "text_warning_3days"
    }
    
    key = state_to_key[current_state]
    set_config(key, message.text)
    
    await message.answer(f"✅ Збережено!\nТепер це виглядає так:\n\n{message.text}")
    await state.clear()

# --- 5. КОРИСТУВАЦЬКА ЛОГІКА ---

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    admin_id = get_config("admin_id")
    
    supabase.table("users").upsert({"user_id": user_id, "username": message.from_user.username, "full_name": message.from_user.full_name}).execute()
    
    res = supabase.table("users").select("*").eq("user_id", user_id).execute()
    user = res.data[0] if res.data else {}

    if user.get('is_active'):
        kb = main_admin_kb() if str(user_id) == str(admin_id) else ReplyKeyboardRemove()
        await message.answer("✅ Ваша підписка активна!", reply_markup=kb)
    else:
        greet = get_config("text_greeting", "Привіт! 🔐 Доступ закритий.")
        price = get_config("subscription_price", "...")
        buy_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"💳 Купити ({price})", callback_data="buy_sub")]])
        await message.answer(greet, reply_markup=buy_kb, parse_mode="HTML")

@dp.callback_query(F.data == "buy_sub")
async def cb_buy(callback: types.CallbackQuery):
    price = get_config("subscription_price")
    details = get_config("payment_details")
    pay_text = get_config("text_payment", "Реквізити для оплати:")
    
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✅ Я оплатив", callback_data="check_payment")]])
    await callback.message.edit_text(f"💳 <b>Сума: {price}</b>\n\n{pay_text}\n<code>{details}</code>", reply_markup=kb, parse_mode="HTML")

@dp.callback_query(F.data == "check_payment")
async def cb_check(callback: types.CallbackQuery):
    await callback.message.edit_text("⏳ Ваша заявка відправлена адміну на перевірку.")
    admin_id = get_config("admin_id")
    admin_kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Підтвердити", callback_data=f"approve_{callback.from_user.id}")],
        [InlineKeyboardButton(text="❌ Відхилити", callback_data=f"reject_{callback.from_user.id}")]
    ])
    await bot.send_message(admin_id, f"💰 Нова оплата від: {callback.from_user.full_name}\nID: <code>{callback.from_user.id}</code>", reply_markup=admin_kb, parse_mode="HTML")

@dp.callback_query(F.data.startswith("approve_"))
async def cb_approve(callback: types.CallbackQuery):
    user_id = int(callback.data.split("_")[1])
    success_text = get_config("text_success", "🎉 Оплату підтверджено!")
    new_expiry = datetime.now(timezone.utc) + timedelta(days=30)
    
    supabase.table("users").update({"expiry_date": new_expiry.isoformat(), "is_active": True}).eq("user_id", user_id).execute()
    invite = await bot.create_chat_invite_link(CHANNEL_ID, member_limit=1)
    
    await bot.send_message(user_id, f"{success_text}\n\nТвоє посилання: {invite.invite_link}")
    await callback.message.edit_text(f"✅ Доступ активовано")

@dp.callback_query(F.data.startswith("reject_"))
async def cb_reject(callback: types.CallbackQuery):
    user_id = int(callback.data.split("_")[1])
    await bot.send_message(user_id, "❌ Платіж відхилено.")
    await callback.message.edit_text(f"❌ Заявку відхилено.")

# --- 6. ЗАПУСК ---
async def main():
    await start_web_server()
    # Щоденна перевірка підписок через scheduler
    scheduler.add_job(daily_check_task, 'interval', hours=24)
    scheduler.start()
    await dp.start_polling(bot)

async def daily_check_task():
    logging.info("🔄 Перевірка підписок...")
    response = supabase.table("users").select("*").eq("is_active", True).execute()
    now = datetime.now(timezone.utc)
    remind_text = get_config("text_warning_3days", "⚠️ Твоя підписка закінчується через 3 дні!")

    for user in response.data:
        expiry = datetime.fromisoformat(user['expiry_date'].replace('Z', '+00:00'))
        days = (expiry - now).days
        if days == 3:
            try: await bot.send_message(user['user_id'], remind_text)
            except: pass
        elif days < 0:
            try:
                await bot.ban_chat_member(CHANNEL_ID, user['user_id'])
                await bot.unban_chat_member(CHANNEL_ID, user['user_id'])
                supabase.table("users").update({"is_active": False}).eq("user_id", user['user_id']).execute()
            except: pass

if __name__ == "__main__":
    asyncio.run(main())