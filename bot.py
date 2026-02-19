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

def main_admin_kb():
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="📊 Кількість учасників")],
        [KeyboardButton(text="👁️ Відображення")],
        [KeyboardButton(text="⚙️ Налаштування")]
    ], resize_keyboard=True)

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
    count = await bot.get_chat_member_count(CHANNEL_ID)
    await message.answer(f"📈 На даний момент у каналі: <b>{count} учасників</b>", parse_mode="HTML")

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

@dp.callback_query(F.data.startswith("set_"))
async def start_editing(callback: types.CallbackQuery, state: FSMContext):
    action = callback.data
    config_map = {
        "set_price": (AdminStates.waiting_for_price, "Введіть нову ціну"),
        "set_details": (AdminStates.waiting_for_details, "Введіть нові реквізити"),
        "set_greet": (AdminStates.waiting_for_greeting, "Введіть привітальний текст"),
        "set_paytext": (AdminStates.waiting_for_payment_text, "Введіть інструкцію для оплати"),
        "set_success": (AdminStates.waiting_for_success_text, "Введіть текст при активації"),
        "set_remind": (AdminStates.waiting_for_reminder_text, "Введіть текст нагадування")
    }
    next_state, prompt = config_map[action]
    await state.set_state(next_state)
    await callback.message.answer(f"📝 {prompt}:")
    await callback.answer()

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
    await message.answer(f"✅ Збережено!\n\n{message.text}")
    await state.clear()

# --- 5. КОРИСТУВАЦЬКА ЛОГІКА ---

@dp.message(Command("start"))
async def cmd_start
