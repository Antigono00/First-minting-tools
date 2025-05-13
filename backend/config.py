# config.py
import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Required secrets
BOT_TOKEN   = os.getenv("BOT_TOKEN", "YOUR_FALLBACK_BOT_TOKEN")
SECRET_KEY  = os.getenv("SECRET_KEY", "YOUR_FALLBACK_SECRET_KEY")

# Optional
GROUP_ID    = os.getenv("GROUP_ID", "YOUR_OPTIONAL_GROUP_ID")
FLASK_ENV   = os.getenv("FLASK_ENV", "development")

DATABASE_PATH = "/root/telegram_bot/bot.db"
