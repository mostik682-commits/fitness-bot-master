import asyncio
import logging
import os
from datetime import datetime, timedelta, timezone

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command, CommandObject
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton, 
    ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
)
from supabase import create_client, Client
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from aiohttp import web

# --- 1. НАЛАШТУВАННЯ ---
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

# --- 2. ДОПОМІЖНІ ФУНКЦІЇ ---

def get_config(key):
    response = supabase.table("bot_config").select("value").eq("key", key).execute()
    return response.data[0]['value'] if response.data else None

def set_config(key, value):
    supabase.table("bot_config").update({"value": str(value)}).eq("key", key).execute()

# Клавіатура для адміна (постійна)
def get_admin_keyboard():
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="💰 Змінити ціну"), KeyboardButton(text="💳 Реквізити")],
            [KeyboardButton(text="📊 Статистика")]
        ],
        resize_keyboard=True
    )

# --- 3. ВЕБ-СЕРВЕР (Для Render) ---
async def handle(request):
    return web.Response(text="Bot is running!")

async def start_web_server():
    app = web.Application()
    app.router.add_get("/", handle)
    runner = web.AppRunner(app)
    await runner.setup()
    port = int(os.getenv("PORT", 8080))
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()

# --- 4. ГОЛОВНА ЛОГІКА АВТОМАТИЗАЦІЇ ---
async def daily_check():
    print("🔄 Запускаю щоденну перевірку підписок...")
    response = supabase.table("users").select("*").eq("is_active", True).execute()
    active_users = response.data
    now = datetime.now(timezone.utc)
    
    for user in active_users:
        user_id = user['user_id']
        expiry_str = user['expiry_date']
        if not expiry_str: continue
        
        expiry_date = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
        days_left = (expiry_date - now).days
        
        if days_left == 3:
            try:
                await bot.send_message(user_id, "⚠️ Твоя підписка закінчується через 3 дні!")
            except: pass
        elif days_left < 0:
            try:
                await bot.ban_chat_member(CHANNEL_ID, user_id)
                await bot.unban_chat_member(CHANNEL_ID, user_id)
                supabase.table("users").update({"is_active": False}).eq("user_id", user_id).execute()
                await bot.send_message(user_id, "⛔️ Підписка завершилась. Доступ закрито.")
            except: pass

# --- 5. АДМІН-ФУНКЦІЇ ---

@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    admin_id = get_config("admin_id")
    if str(message.from_user.id) != str(admin_id): return
    await message.answer("🔧 <b>Адмін-панель активована.</b>\nВикористовуйте кнопки внизу для керування.", 
                         reply_markup=get_admin_keyboard(), parse_mode="HTML")

@dp.message(F.text == "💰 Змінити ціну")
async def admin_help_price(message: types.Message):
    await message.answer("Щоб змінити ціну, просто надішліть повідомлення у форматі:\n<code>/setprice 300 грн</code>", parse_mode="HTML")

@dp.message(F.text == "💳 Реквізити")
async def admin_help_details(message: types.Message):
    await message.answer("Щоб оновити реквізити, надішліть повідомлення у форматі:\n<code>/setdetails Карта Mono 4444...</code>", parse_mode="HTML")

@dp.message(F.text == "📊 Статистика")
async def admin_stats(message: types.Message):
    res = supabase.table("users").select("*", count="exact").eq("is_active", True).execute()
    await message.answer(f"📈 <b>Активних підписників:</b> {res.count}", parse_mode="HTML")

# Обробники команд встановлення
@dp.message(Command("setprice"))
async def process_set_price(message: types.Message, command: CommandObject):
    admin_id = get_config("admin_id")
    if str(message.from_user.id) != str(admin_id) or not command.args: return
    set_config("subscription_price", command.args)
    await message.answer(f"✅ Ціна оновлена на: <b>{command.args}</b>", parse_mode="HTML")

@dp.message(Command("setdetails"))
async def process_set_details(message: types.Message, command: CommandObject):
    admin_id = get_config("admin_id")
    if str(message.from_user.id) != str(admin_id) or not command.args: return
    set_config("payment_details", command.args)
    await message.answer(f"✅ Реквізити оновлено:\n<code>{command.args}</code>", parse_mode="HTML")

# --- 6. КОРИСТУВАЦЬКА ЛОГІКА ---

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    admin_id = get_config("admin_id")
    
    # Реєстрація
    supabase.table("users").upsert({"user_id": user_id, "username": message.from_user.username, "full_name": message.from_user.full_name}).execute()
    
    # Перевірка статусу
    res = supabase.table("users").select("*").eq("user_id", user_id).execute()
    user = res.data[0] if res.data else {}

    # Якщо адмін заходить через старт, теж даємо клавіатуру
    kb = get_admin_keyboard() if str(user_id) == str(admin_id) else ReplyKeyboardRemove()

    if user.get('is_active'):
        await message.answer("✅ Твоя підписка активна!", reply_markup=kb)
    else:
        price = get_config("subscription_price") or "..."
        buy_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text=f"💳 Купити ({price})", callback_data="buy_sub")]])
        await message.answer(f"Привіт! 🔐 Доступ закритий.", reply_markup=buy_kb, parse_mode="HTML")

@dp.callback_query(F.data == "buy_sub")
async def cb_buy(callback: types.CallbackQuery):
    price = get_config("subscription_price")
    details = get_config("payment_details")
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✅ Я оплатив", callback_data="check_payment")]])
    await callback.message.edit_text(f"💳 <b>Оплата: {price}</b>\n\nРеквізити:\n<code>{details}</code>", reply_markup=kb, parse_mode="HTML")

@dp.callback_query(F.data == "check_payment")
async def cb_check(callback: types.CallbackQuery):
    admin_id = get_config("admin_id")
    await callback.message.edit_text("⏳ Заявку відправлено адміну.")
    admin_kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="✅ Підтвердити", callback_data=f"approve_{callback.from_user.id}")],
        [InlineKeyboardButton(text="❌ Відхилити", callback_data=f"reject_{callback.from_user.id}")]
    ])
    await bot.send_message(admin_id, f"💰 Оплата від: {callback.from_user.full_name}\nID: {callback.from_user.id}", reply_markup=admin_kb)

@dp.callback_query(F.data.startswith("approve_"))
async def cb_approve(callback: types.CallbackQuery):
    user_id = int(callback.data.split("_")[1])
    new_expiry = datetime.now(timezone.utc) + timedelta(days=30)
    supabase.table("users").update({"expiry_date": new_expiry.isoformat(), "is_active": True}).eq("user_id", user_id).execute()
    invite = await bot.create_chat_invite_link(CHANNEL_ID, member_limit=1)
    await bot.send_message(user_id, f"🎉 Доступ відкрито!\n{invite.invite_link}")
    await callback.message.edit_text(f"✅ Доступ активовано для {user_id}")

@dp.callback_query(F.data.startswith("reject_"))
async def cb_reject(callback: types.CallbackQuery):
    user_id = int(callback.data.split("_")[1])
    await bot.send_message(user_id, "❌ Платіж відхилено.")
    await callback.message.edit_text(f"❌ Заявку {user_id} відхилено.")

# --- 7. ЗАПУСК ---
async def main():
    await start_web_server()
    scheduler.add_job(daily_check, 'interval', hours=24)
    scheduler.start()
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())