import requests
import os
import time
import hashlib
import hmac
import sqlite3
import json
import random
import base64
import uuid
import traceback

from flask import Flask, request, session, redirect, jsonify, send_from_directory
from config import BOT_TOKEN, SECRET_KEY, DATABASE_PATH

app = Flask(__name__, 
            static_folder='static',  # React build files go here
            static_url_path='')

app.secret_key = SECRET_KEY

app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Flag to track if we need to add the provisional_mint column
NEEDS_SCHEMA_UPDATE = False
# Flag to track if we need to add the room column
NEEDS_ROOM_COLUMN = False
# Flag to track if we need to add the seen_room_unlock column
NEEDS_SEEN_ROOM_COLUMN = False
# Flag to track if we need to ensure eggs resource exists for everyone
NEEDS_EGGS_RESOURCE = False
# Flag to track if we need to add the pets table
NEEDS_PETS_TABLE = False

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def check_and_update_schema():
    """Check if the database schema needs updating and update if necessary."""
    global NEEDS_SCHEMA_UPDATE
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the provisional_mint column exists
        cursor.execute("PRAGMA table_info(user_machines)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'provisional_mint' not in columns:
            print("Adding provisional_mint column to user_machines table")
            try:
                cursor.execute("ALTER TABLE user_machines ADD COLUMN provisional_mint INTEGER DEFAULT 0")
                conn.commit()
                print("Column added successfully")
            except sqlite3.Error as e:
                print(f"Error adding column: {e}")
                NEEDS_SCHEMA_UPDATE = True
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking schema: {e}")
        NEEDS_SCHEMA_UPDATE = True

def check_and_update_room_column():
    """Check if the room column exists in user_machines and add if necessary."""
    global NEEDS_ROOM_COLUMN
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the room column exists
        cursor.execute("PRAGMA table_info(user_machines)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'room' not in columns:
            print("Adding room column to user_machines table")
            try:
                cursor.execute("ALTER TABLE user_machines ADD COLUMN room INTEGER DEFAULT 1")
                conn.commit()
                print("Room column added successfully")
            except sqlite3.Error as e:
                print(f"Error adding room column: {e}")
                NEEDS_ROOM_COLUMN = True
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking room column: {e}")
        NEEDS_ROOM_COLUMN = True

def check_and_update_seen_room_column():
    """Check if the seen_room_unlock column exists in users and add if necessary."""
    global NEEDS_SEEN_ROOM_COLUMN
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the seen_room_unlock column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'seen_room_unlock' not in columns:
            print("Adding seen_room_unlock column to users table")
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN seen_room_unlock INTEGER DEFAULT 0")
                conn.commit()
                print("seen_room_unlock column added successfully")
            except sqlite3.Error as e:
                print(f"Error adding seen_room_unlock column: {e}")
                NEEDS_SEEN_ROOM_COLUMN = True
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking seen_room_unlock column: {e}")
        NEEDS_SEEN_ROOM_COLUMN = True

def check_and_update_pets_table():
    """Check if the pets table exists and create if necessary."""
    global NEEDS_PETS_TABLE
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if the pets table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='pets'")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("Creating pets table")
            try:
                cursor.execute("""
                    CREATE TABLE pets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        x INTEGER NOT NULL,
                        y INTEGER NOT NULL,
                        room INTEGER DEFAULT 1,
                        type TEXT DEFAULT 'cat',
                        parent_machine INTEGER DEFAULT NULL
                    )
                """)
                conn.commit()
                print("Pets table created successfully")
            except sqlite3.Error as e:
                print(f"Error creating pets table: {e}")
                NEEDS_PETS_TABLE = True
        
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error checking pets table: {e}")
        NEEDS_PETS_TABLE = True

def ensure_eggs_resource_exists():
    """Ensure the eggs resource exists for all users."""
    global NEEDS_EGGS_RESOURCE
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all user IDs
        cursor.execute("SELECT user_id FROM users")
        user_ids = [row['user_id'] for row in cursor.fetchall()]
        
        # Check and create eggs resource for each user
        for user_id in user_ids:
            cursor.execute(
                "SELECT COUNT(*) FROM resources WHERE user_id=? AND resource_name='eggs'", 
                (user_id,)
            )
            count = cursor.fetchone()[0]
            
            if count == 0:
                print(f"Adding eggs resource for user {user_id}")
                cursor.execute(
                    "INSERT INTO resources (user_id, resource_name, amount) VALUES (?, 'eggs', 0)",
                    (user_id,)
                )
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Eggs resource check completed")
    except Exception as e:
        print(f"Error ensuring eggs resource: {e}")
        NEEDS_EGGS_RESOURCE = True

# Run schema checks on startup
check_and_update_schema()
check_and_update_room_column()
check_and_update_seen_room_column()
ensure_eggs_resource_exists()
check_and_update_pets_table()

def fetch_scvx_balance(account_address):
    """Fetch sCVX balance for a Radix account using the Gateway API."""
    if not account_address:
        print("No account address provided")
        return 0
        
    try:
        # sCVX resource address
        scvx_resource = 'resource_rdx1t5q4aa74uxcgzehk0u3hjy6kng9rqyr4uvktnud8ehdqaaez50n693'
        
        # Use the Gateway API
        url = "https://mainnet.radixdlt.com/state/entity/page/fungibles/"
        print(f"Fetching sCVX for {account_address} using Gateway API")
        
        # Prepare request payload
        payload = {
            "address": account_address,
            "limit_per_page": 100  # Get a reasonable number of tokens
        }
        
        # Set appropriate headers
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CorvaxLab Game/1.0'
        }
        
        print(f"Making Gateway API request with payload: {json.dumps(payload)}")
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        print(f"Gateway API Response Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Gateway API error: Status {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return 0
        
        # Parse the JSON response
        data = response.json()
        
        # Print debugging info
        print(f"Gateway API total_count: {data.get('total_count', 0)}")
        
        # Look for the sCVX resource in the items
        items = data.get('items', [])
        print(f"Found {len(items)} resources in the account")
        
        # Dump all resources for debugging
        print("All resources in account:")
        for i, item in enumerate(items):
            resource_addr = item.get('resource_address', '')
            amount = item.get('amount', '0')
            print(f"Resource {i}: {resource_addr} = {amount}")
            
            # Check if this is the sCVX resource
            if resource_addr == scvx_resource:
                amount_value = float(amount)
                print(f"FOUND sCVX RESOURCE: {amount_value}")
                return amount_value
        
        # If we get here, we didn't find the resource - look for partial matches
        print("Trying partial resource address matching...")
        for item in items:
            resource_addr = item.get('resource_address', '')
            if scvx_resource[-8:] in resource_addr:  # Match on last few chars
                amount = float(item.get('amount', '0'))
                print(f"Found potential sCVX match with amount: {amount}")
                return amount
                
        return 0
    except Exception as e:
        print(f"Error fetching sCVX with Gateway API: {e}")
        traceback.print_exc()
        return 0

def can_build_fomo_hit(cur, user_id):
    """Check if user has built and fully operational all other machine types."""
    print(f"Checking FOMO HIT prerequisites for user_id: {user_id}")
    try:
        # 1. Check if they've built all required machine types
        required_types = ['catLair', 'reactor', 'amplifier', 'incubator']
        for machine_type in required_types:
            cur.execute("""
                SELECT COUNT(*) as count FROM user_machines
                WHERE user_id=? AND machine_type=?
            """, (user_id, machine_type))
            row = cur.fetchone()
            count = row[0] if row else 0
            print(f"  Machine type {machine_type}: {count} found")
            if count == 0:
                print(f"  Missing required machine: {machine_type}")
                return False
        
        # 2. For cat lairs and reactors, check ALL are at max level (3)
        # First, get total count of each type
        for machine_type in ['catLair', 'reactor']:
            # Get total number of this machine type
            cur.execute("""
                SELECT COUNT(*) as total FROM user_machines
                WHERE user_id=? AND machine_type=?
            """, (user_id, machine_type))
            total_row = cur.fetchone()
            total = total_row[0] if total_row else 0
            
            # Get how many are at max level
            cur.execute("""
                SELECT COUNT(*) as max_count FROM user_machines 
                WHERE user_id=? AND machine_type=? AND level>=3
            """, (user_id, machine_type))
            max_row = cur.fetchone()
            max_count = max_row[0] if max_row else 0
            
            print(f"  {machine_type}: {max_count}/{total} at max level")
            
            # For now, as long as one machine is at max level for each type, that counts as success
            if max_count == 0:
                print(f"  No {machine_type} machines at max level")
                return False
        
        # 3. For amplifier, check it's at max level (5)
        cur.execute("""
            SELECT MAX(level) as max_level FROM user_machines
            WHERE user_id=? AND machine_type='amplifier'
        """, (user_id,))
        max_level_row = cur.fetchone()
        max_level = max_level_row[0] if max_level_row else 0
        print(f"  Amplifier max level: {max_level}/5")
        
        # For now, level 3 amplifier is ok as a prerequisite 
        if max_level < 3:
            print(f"  Amplifier not at required level")
            return False
        
        # 4. Check that incubator is operational (not offline)
        cur.execute("""
            SELECT is_offline FROM user_machines
            WHERE user_id=? AND machine_type='incubator'
            LIMIT 1
        """, (user_id,))
        row = cur.fetchone()
        is_offline = row[0] if row else 1
        print(f"  Incubator offline status: {is_offline}")
        
        # For testing, let's ignore the incubator online check
        # Remove this if-statement in production
        if is_offline == 1:
            print(f"  Incubator is offline but we'll allow FOMO HIT for testing")
            # return False  # Comment this out for easier testing
            
        print("✅ All FOMO HIT prerequisites met!")
        return True
    except Exception as e:
        print(f"Error in can_build_fomo_hit: {e}")
        import traceback
        traceback.print_exc()
        return False

def can_build_third_reactor(cur, user_id):
    """Check if user can build a third reactor (has incubator and fomoHit)."""
    try:
        # Check if incubator exists
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='incubator'
        """, (user_id,))
        has_incubator = cur.fetchone()[0] > 0
        
        # Check if fomoHit exists
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='fomoHit'
        """, (user_id,))
        has_fomo_hit = cur.fetchone()[0] > 0
        
        # Count current reactors
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='reactor'
        """, (user_id,))
        reactor_count = cur.fetchone()[0]
        
        # Can build third reactor if:
        # 1. Has both incubator and fomoHit
        # 2. Currently has 2 reactors (this would be the third)
        return has_incubator and has_fomo_hit and reactor_count == 2
    except Exception as e:
        print(f"Error in can_build_third_reactor: {e}")
        traceback.print_exc()
        return False

def create_nft_mint_manifest(account_address):
    """Create the Radix transaction manifest for NFT minting."""
    try:
        # Generate a random ID for the NFT
        nft_id = str(uuid.uuid4())[:8]
        
        # Simple manifest that calls a component to mint an NFT
        # The component address should be your actual minting component
        manifest = f"""
CALL_METHOD
    Address("component_rdx1cqpv4nfsgfk9c2r9ymnqyksfkjsg07mfc49m9qw3dpgzrmjmsuuquv")
    "mint_user_nft"
;
CALL_METHOD
    Address("{account_address}")
    "try_deposit_batch_or_abort"
    Expression("ENTIRE_WORKTOP")
    None
;
"""
        return manifest
    except Exception as e:
        print(f"Error creating NFT mint manifest: {e}")
        traceback.print_exc()
        return None

def create_buy_energy_manifest(account_address):
    """Create the Radix transaction manifest for buying energy with CVX."""
    try:
        cvx_resource        = "resource_rdx1th04p2c55884yytgj0e8nq79ze9wjnvu4rpg9d7nh3t698cxdt0cr9"
        destination_account = "account_rdx16ya2ncwya20j2w0k8d49us5ksvzepjhhh7cassx9jp9gz6hw69mhks"
        cvx_amount          = "200.0"

        manifest = f"""
CALL_METHOD
    Address("{account_address}")
    "withdraw"
    Address("{cvx_resource}")
    Decimal("{cvx_amount}")
;
CALL_METHOD
    Address("{destination_account}")
    "try_deposit_batch_or_abort"
    Expression("ENTIRE_WORKTOP")
    None
;
"""
        print(f"Generated manifest:\n{manifest}")
        return manifest

    except Exception as e:
        print(f"Error creating energy purchase manifest: {e}")
        traceback.print_exc()
        return None

def get_transaction_status(intent_hash):
    """Check the status of a transaction using the Gateway API."""
    try:
        url = "https://mainnet.radixdlt.com/transaction/status"
        payload = {"intent_hash": intent_hash}
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CorvaxLab Game/1.0'
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Gateway API error: Status {response.status_code}")
            return {"status": "Unknown", "error": f"HTTP {response.status_code}"}
        
        data = response.json()
        return {
            "status": data.get("status", "Unknown"),
            "intent_status": data.get("intent_status", "Unknown"),
            "error_message": data.get("error_message", "")
        }
    except Exception as e:
        print(f"Error checking transaction status: {e}")
        traceback.print_exc()
        return {"status": "Error", "error": str(e)}

def verify_telegram_login(query_dict, bot_token):
    try:
        their_hash = query_dict.pop("hash", None)
        if not their_hash:
            return False
        secret_key = hashlib.sha256(bot_token.encode('utf-8')).digest()
        sorted_kv = sorted(query_dict.items(), key=lambda x: x[0])
        data_check_str = "\n".join([f"{k}={v}" for k, v in sorted_kv])
        calc_hash_bytes = hmac.new(secret_key, data_check_str.encode('utf-8'), hashlib.sha256).hexdigest()
        return calc_hash_bytes == their_hash
    except Exception as e:
        print(f"Error in verify_telegram_login: {e}")
        traceback.print_exc()
        return False

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    try:
        if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        else:
            return send_from_directory(app.static_folder, 'index.html')
    except Exception as e:
        print(f"Error serving path {path}: {e}")
        traceback.print_exc()
        return "Server error", 500

@app.route("/callback")
def telegram_login_callback():
    print("=== Telegram Callback Called ===")
    try:
        args = request.args.to_dict()
        print(f"Args received: {args}")
        
        user_id = args.get("id")
        tg_hash = args.get("hash")
        auth_date = args.get("auth_date")
        
        if not user_id or not tg_hash or not auth_date:
            print("Missing login data!")
            return "<h3>Missing Telegram login data!</h3>", 400

        if not verify_telegram_login(args, BOT_TOKEN):
            print(f"Invalid hash! Data: {args}")
            return "<h3>Invalid hash - data might be forged!</h3>", 403

        print(f"Login successful for user {user_id}")
        
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            user_id_int = int(user_id)
        except ValueError:
            user_id_int = user_id

        cursor.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id_int,))
        row = cursor.fetchone()
        if row is None:
            first_name = args.get("first_name", "Unknown")
            print(f"Creating new user: {first_name}")
            cursor.execute(
                "INSERT INTO users (user_id, first_name, corvax_count, seen_room_unlock) VALUES (?, ?, 0, 0)",
                (user_id_int, first_name)
            )
            conn.commit()
            
            # Also create initial eggs resource for new user
            cursor.execute(
                "INSERT INTO resources (user_id, resource_name, amount) VALUES (?, 'eggs', 0)",
                (user_id_int,)
            )
            conn.commit()

        cursor.close()
        conn.close()

        session['telegram_id'] = str(user_id_int)
        print(f"Session set, redirecting to homepage")
        return redirect("https://cvxlab.net/")
    except Exception as e:
        print(f"Error in telegram_login_callback: {e}")
        traceback.print_exc()
        return "<h3>Server error</h3>", 500

@app.route("/api/whoami")
def whoami():
    try:
        print("=== WHOAMI CALLED ===")
        if 'telegram_id' not in session:
            print("User not logged in")
            return jsonify({"loggedIn": False}), 200

        user_id = session['telegram_id']
        print(f"User logged in with ID: {user_id}")
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT first_name FROM users WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row:
            return jsonify({"loggedIn": True, "firstName": row[0]})
        else:
            return jsonify({"loggedIn": True, "firstName": "Unknown"})
    except Exception as e:
        print(f"Error in whoami: {e}")
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

@app.route("/api/machines", methods=["GET"])
def get_machines():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        try:
            # Try with provisional_mint and room columns
            cur.execute("""
                SELECT id, machine_type, x, y, level, last_activated, is_offline, provisional_mint, room
                FROM user_machines
                WHERE user_id=?
            """, (user_id,))
            rows = cur.fetchall()
            
            machines = []
            for r in rows:
                machine = dict(r)
                machines.append(machine)
                
        except sqlite3.OperationalError:
            try:
                # Try with provisional_mint only
                cur.execute("""
                    SELECT id, machine_type, x, y, level, last_activated, is_offline, provisional_mint
                    FROM user_machines
                    WHERE user_id=?
                """, (user_id,))
                rows = cur.fetchall()
                
                machines = []
                for r in rows:
                    machine = dict(r)
                    machine["room"] = 1  # Default room
                    machines.append(machine)
            except sqlite3.OperationalError:
                # Fall back to old schema without provisional_mint and room
                cur.execute("""
                    SELECT id, machine_type, x, y, level, last_activated, is_offline
                    FROM user_machines
                    WHERE user_id=?
                """, (user_id,))
                rows = cur.fetchall()
                
                machines = []
                for r in rows:
                    machine = dict(r)
                    machine["provisionalMint"] = 0  # Default value
                    machine["room"] = 1  # Default room
                    machines.append(machine)

        cur.close()
        conn.close()

        # Convert SQLite row objects to proper dictionaries for JSON
        machine_list = []
        for m in machines:
            machine_dict = {
                "id": m["id"],
                "type": m["machine_type"],
                "x": m["x"],
                "y": m["y"],
                "level": m["level"],
                "lastActivated": m["last_activated"],
                "isOffline": m["is_offline"],
                "room": m.get("room", 1)  # Default to room 1 if not present
            }
            
            if "provisional_mint" in m:
                machine_dict["provisionalMint"] = m["provisional_mint"]
            else:
                machine_dict["provisionalMint"] = 0
                
            machine_list.append(machine_dict)

        return jsonify(machine_list)
    except Exception as e:
        print(f"Error in get_machines: {e}")
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

@app.route("/api/resources", methods=["GET"])
def get_resources():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        tcorvax = row["corvax_count"] if row else 0

        catNips = get_or_create_resource(cur, user_id, 'catNips')
        energy = get_or_create_resource(cur, user_id, 'energy')
        eggs = get_or_create_resource(cur, user_id, 'eggs')

        cur.close()
        conn.close()

        return jsonify({
            "tcorvax": float(tcorvax),
            "catNips": float(catNips),
            "energy": float(energy),
            "eggs": float(eggs)
        })
    except Exception as e:
        print(f"Error in get_resources: {e}")
        traceback.print_exc()
        return jsonify({"error": "Server error"}), 500

def get_or_create_resource(cursor, user_id, resource_name):
    try:
        cursor.execute("SELECT amount FROM resources WHERE user_id=? AND resource_name=?", (user_id, resource_name))
        row = cursor.fetchone()
        if row is None:
            cursor.execute("INSERT INTO resources (user_id, resource_name, amount) VALUES (?, ?, 0)",
                        (user_id, resource_name))
            return 0
        else:
            return row[0]
    except Exception as e:
        print(f"Error in get_or_create_resource: {e}")
        traceback.print_exc()
        return 0

def set_resource_amount(cursor, user_id, resource_name, amount):
    try:
        cursor.execute("SELECT amount FROM resources WHERE user_id=? AND resource_name=?", (user_id, resource_name))
        row = cursor.fetchone()
        if row is None:
            cursor.execute("INSERT INTO resources (user_id, resource_name, amount) VALUES (?, ?, ?)",
                        (user_id, resource_name, amount))
        else:
            cursor.execute("UPDATE resources SET amount=? WHERE user_id=? AND resource_name=?",
                        (amount, user_id, resource_name))
    except Exception as e:
        print(f"Error in set_resource_amount: {e}")
        traceback.print_exc()

def update_amplifiers_status(user_id, conn, cur):
    try:
        cur.execute("""
            SELECT id, level, is_offline, next_cost_time
            FROM user_machines
            WHERE user_id=? AND machine_type='amplifier'
        """, (user_id,))
        amps = cur.fetchall()
        if not amps:
            return

        now_ms = int(time.time() * 1000)
        energy_val = get_or_create_resource(cur, user_id, 'energy')

        for amp in amps:
            amp_id = amp["id"]
            level = amp["level"]
            is_offline = amp["is_offline"]
            next_cost = amp["next_cost_time"]

            if next_cost == 0:
                next_cost = now_ms + 24*60*60*1000
                cur.execute("""
                    UPDATE user_machines
                    SET next_cost_time=?
                    WHERE user_id=? AND id=?
                """, (next_cost, user_id, amp_id))
                conn.commit()

            cost = 2 * level
            if is_offline == 0:
                while next_cost <= now_ms:
                    if energy_val >= cost:
                        energy_val -= cost
                        set_resource_amount(cur, user_id, 'energy', energy_val)
                        next_cost += 24*60*60*1000
                    else:
                        is_offline = 1
                        cur.execute("""
                            UPDATE user_machines
                            SET is_offline=1
                            WHERE user_id=? AND id=?
                        """, (user_id, amp_id))
                        conn.commit()
                        break
            else:
                if next_cost <= now_ms:
                    if energy_val >= cost:
                        energy_val -= cost
                        set_resource_amount(cur, user_id, 'energy', energy_val)
                        next_cost = now_ms + 24*60*60*1000
                        is_offline = 0
                        cur.execute("""
                            UPDATE user_machines
                            SET is_offline=0, next_cost_time=?
                            WHERE user_id=? AND id=?
                        """, (next_cost, user_id, amp_id))
                        conn.commit()
                    else:
                        pass

            cur.execute("""
                UPDATE user_machines
                SET next_cost_time=?, is_offline=?
                WHERE user_id=? AND id=?
            """, (next_cost, is_offline, user_id, amp_id))
            conn.commit()
    except Exception as e:
        print(f"Error in update_amplifiers_status: {e}")
        traceback.print_exc()

@app.route("/api/getGameState", methods=["GET"])
def get_game_state():
    try:
        print("=== GET GAME STATE CALLED ===")
        if 'telegram_id' not in session:
            print("No telegram_id in session")
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        print(f"Fetching game state for user: {user_id}")
        
        conn = get_db_connection()
        cur = conn.cursor()

        # Try to update amplifier status
        try:
            update_amplifiers_status(user_id, conn, cur)
        except Exception as e:
            print(f"Error updating amplifier status: {e}")
            # Continue anyway

        # Get tcorvax and seen_room_unlock flag
        has_seen_room_column = True
        try:
            cur.execute("PRAGMA table_info(users)")
            columns = [column[1] for column in cur.fetchall()]
            has_seen_room_column = 'seen_room_unlock' in columns
        except:
            has_seen_room_column = False
        
        if has_seen_room_column:
            cur.execute("SELECT corvax_count, seen_room_unlock FROM users WHERE user_id=?", (user_id,))
        else:
            cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
            
        row = cur.fetchone()
        tcorvax = row["corvax_count"] if row else 0
        seen_room_unlock = row["seen_room_unlock"] if (row and has_seen_room_column) else 0

        # Get other resources
        catNips = get_or_create_resource(cur, user_id, 'catNips')
        energy = get_or_create_resource(cur, user_id, 'energy')
        eggs = get_or_create_resource(cur, user_id, 'eggs')

        # Check if provisional_mint and room columns exist
        has_provisional_mint = True
        has_room_column = True
        try:
            cur.execute("PRAGMA table_info(user_machines)")
            columns = [column[1] for column in cur.fetchall()]
            has_provisional_mint = 'provisional_mint' in columns
            has_room_column = 'room' in columns
        except:
            has_provisional_mint = False
            has_room_column = False
        
        # Get machines with appropriate query
        machines = []
        try:
            if has_provisional_mint and has_room_column:
                print("Querying with provisional_mint and room columns")
                cur.execute("""
                    SELECT id, machine_type, x, y, level, last_activated, is_offline, provisional_mint, room
                    FROM user_machines
                    WHERE user_id=?
                """, (user_id,))
            elif has_provisional_mint:
                print("Querying with provisional_mint column")
                cur.execute("""
                    SELECT id, machine_type, x, y, level, last_activated, is_offline, provisional_mint
                    FROM user_machines
                    WHERE user_id=?
                """, (user_id,))
            else:
                print("Querying without provisional_mint column")
                cur.execute("""
                    SELECT id, machine_type, x, y, level, last_activated, is_offline
                    FROM user_machines
                    WHERE user_id=?
                """, (user_id,))
                
            rows = cur.fetchall()
            for row in rows:
                # Convert SQLite row to Python dict
                machine = dict(row)
                
                # Prepare proper JSON object
                machine_dict = {
                    "id": machine["id"],
                    "type": machine["machine_type"],
                    "x": machine["x"],
                    "y": machine["y"],
                    "level": machine["level"],
                    "lastActivated": machine["last_activated"],
                    "isOffline": machine["is_offline"]
                }
                
                # Add provisional_mint if available
                if "provisional_mint" in machine:
                    machine_dict["provisionalMint"] = machine["provisional_mint"]
                else:
                    machine_dict["provisionalMint"] = 0
                
                # Add room information if available
                if "room" in machine:
                    machine_dict["room"] = machine["room"]
                else:
                    machine_dict["room"] = 1  # Default to room 1
                    
                machines.append(machine_dict)
            
        except Exception as e:
            print(f"Error fetching machines: {e}")
            traceback.print_exc()

        # Get count of machines by type to determine if second room is unlocked
        room_unlocked = 1  # Default to 1 room
        
        # Check machine counts to determine if room 2 is unlocked
        cur.execute("""
            SELECT machine_type, COUNT(*) as count
            FROM user_machines
            WHERE user_id=?
            GROUP BY machine_type
        """, (user_id,))
        
        machine_counts = {}
        for row in cur.fetchall():
            machine_counts[row['machine_type']] = row['count']
        
        # Room 2 unlocks when player has built 2 cat lairs, 2 reactors, and 1 amplifier
        cat_lair_count = machine_counts.get('catLair', 0)
        reactor_count = machine_counts.get('reactor', 0)
        amplifier_count = machine_counts.get('amplifier', 0)
        
        if cat_lair_count >= 2 and reactor_count >= 2 and amplifier_count >= 1:
            room_unlocked = 2

        # Get pets (NEW)
        pets = []
        try:
            cur.execute("""
                SELECT id, x, y, room, type, parent_machine
                FROM pets
                WHERE user_id=?
            """, (user_id,))
            
            rows = cur.fetchall()
            for row in rows:
                pet = {
                    "id": row["id"],
                    "x": row["x"],
                    "y": row["y"],
                    "room": row["room"],
                    "type": row["type"],
                    "parentMachine": row["parent_machine"]
                }
                pets.append(pet)
                
        except Exception as e:
            print(f"Error fetching pets: {e}")
            traceback.print_exc()
        
        cur.close()
        conn.close()
        
        print(f"Returning game state with {len(machines)} machines, {room_unlocked} rooms unlocked, {len(pets)} pets")
        
        # Return with seen_room_unlock and eggs values
        return jsonify({
            "tcorvax": float(tcorvax),
            "catNips": float(catNips),
            "energy": float(energy),
            "eggs": float(eggs),
            "machines": machines,
            "roomsUnlocked": room_unlocked,
            "seenRoomUnlock": seen_room_unlock,
            "pets": pets  # Add pets to the response
        })
        
    except Exception as e:
        print(f"Error in get_game_state: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

def build_cost(machine_type, how_many_already, user_id=None):
    try:
        if machine_type == "catLair":
            if how_many_already == 0:
                return {"tcorvax": 10}
            elif how_many_already == 1:
                return {"tcorvax": 40}
            else:
                return None

        elif machine_type == "reactor":
            if how_many_already == 0:
                return {"tcorvax": 10, "catNips": 10}
            elif how_many_already == 1:
                return {"tcorvax": 40, "catNips": 40}
            elif how_many_already == 2 and user_id is not None:
                # Check if user can build third reactor
                conn = get_db_connection()
                cur = conn.cursor()
                can_build = can_build_third_reactor(cur, user_id)
                cur.close()
                conn.close()
                
                if can_build:
                    return {"tcorvax": 640, "catNips": 640}
                else:
                    return None
            else:
                return None

        elif machine_type == "amplifier":
            if how_many_already == 0:
                return {"tcorvax": 10, "catNips": 10, "energy": 10}
            else:
                return None
                
        elif machine_type == "incubator":
            if how_many_already == 0:
                return {"tcorvax": 320, "catNips": 320, "energy": 320}
            else:
                return None
        
        # Updated FomoHit machine costs
        elif machine_type == "fomoHit":
            if how_many_already == 0:
                return {"tcorvax": 640, "catNips": 640, "energy": 640}  # Updated cost
            else:
                return None

        return None
    except Exception as e:
        print(f"Error in build_cost: {e}")
        traceback.print_exc()
        return None

def is_second_machine(cur, user_id, machine_type, machine_id):
    try:
        cur.execute("""
            SELECT id FROM user_machines
            WHERE user_id=? AND machine_type=?
            ORDER BY id
        """, (user_id, machine_type))
        machine_ids = [row["id"] for row in cur.fetchall()]
        if machine_id not in machine_ids:
            return False
        index = machine_ids.index(machine_id)
        return (index == 1)
    except Exception as e:
        print(f"Error in is_second_machine: {e}")
        traceback.print_exc()
        return False

def are_first_machine_lvl3(cur, user_id, mtype):
    try:
        cur.execute("""
            SELECT level FROM user_machines
            WHERE user_id=? AND machine_type=?
            ORDER BY id
            LIMIT 1
        """, (user_id, mtype))
        r = cur.fetchone()
        if r and r["level"] >= 3:
            return True
        return False
    except Exception as e:
        print(f"Error in are_first_machine_lvl3: {e}")
        traceback.print_exc()
        return False

def are_two_machines_lvl3(cur, user_id, mtype):
    try:
        cur.execute("""
            SELECT level FROM user_machines
            WHERE user_id=? AND machine_type=?
            ORDER BY id
        """, (user_id, mtype))
        rows = cur.fetchall()
        if len(rows) < 2:
            return False
        if rows[0]["level"] >=3 and rows[1]["level"] >=3:
            return True
        return False
    except Exception as e:
        print(f"Error in are_two_machines_lvl3: {e}")
        traceback.print_exc()
        return False

def check_amplifier_gating(cur, user_id, next_level):
    try:
        if next_level == 4:
            if not are_first_machine_lvl3(cur, user_id, "catLair"):
                return False
            if not are_first_machine_lvl3(cur, user_id, "reactor"):
                return False
            return True
        elif next_level == 5:
            if not are_two_machines_lvl3(cur, user_id, "catLair"):
                return False
            if not are_two_machines_lvl3(cur, user_id, "reactor"):
                return False
            return True
        return True
    except Exception as e:
        print(f"Error in check_amplifier_gating: {e}")
        traceback.print_exc()
        return False

def can_build_incubator(cur, user_id):
    try:
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='catLair'
        """, (user_id,))
        total_cat_lairs = cur.fetchone()[0]
        if total_cat_lairs == 0:
            return False
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='catLair' AND level=3
        """, (user_id,))
        max_level_cat_lairs = cur.fetchone()[0]
        if max_level_cat_lairs < total_cat_lairs:
            return False

        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='reactor'
        """, (user_id,))
        total_reactors = cur.fetchone()[0]
        if total_reactors == 0:
            return False
        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='reactor' AND level=3
        """, (user_id,))
        max_level_reactors = cur.fetchone()[0]
        if max_level_reactors < total_reactors:
            return False

        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type='amplifier' AND level=5
        """, (user_id,))
        max_level_amplifier = cur.fetchone()[0]
        if max_level_amplifier == 0:
            return False

        return True
    except Exception as e:
        print(f"Error in can_build_incubator: {e}")
        traceback.print_exc()
        return False

def upgrade_cost(cur, user_id, machine_type, current_level, machine_id):
    try:
        next_level = current_level + 1
        if machine_type in ("catLair","reactor"):
            if next_level > 3:
                return None
        elif machine_type == "amplifier":
            if next_level > 5:
                return None
            if not check_amplifier_gating(cur, user_id, next_level):
                return None
        # Add support for incubator level 2
        elif machine_type == "incubator":
            if next_level > 2:  # Max level 2
                return None
        else:
            return None

        if machine_type == "amplifier":
            if not check_amplifier_gating(cur, user_id, next_level):
                return None

        if machine_type == "catLair":
            base_for_level1 = {"tcorvax": 10}
        elif machine_type == "reactor":
            base_for_level1 = {"tcorvax": 10, "catNips": 10}
        elif machine_type == "amplifier":
            base_for_level1 = {"tcorvax": 10, "catNips": 10, "energy": 10}
        elif machine_type == "incubator":
            # Set base cost for incubator upgrade - note that this is double the original build cost of 320
            # Ensuring frontend and backend match on this value (640)
            base_for_level1 = {"tcorvax": 640, "catNips": 640, "energy": 640}
            # Return cost directly for incubator without additional multipliers
            return base_for_level1
        else:
            return None

        second = is_second_machine(cur, user_id, machine_type, machine_id)
        mult = 2 ** (next_level - 1)
        cost_out = {}
        for res, val in base_for_level1.items():
            c = val * mult
            if second and (machine_type in ["catLair","reactor"]):
                c *= 4
            cost_out[res] = c

        return cost_out
    except Exception as e:
        print(f"Error in upgrade_cost: {e}")
        traceback.print_exc()
        return None

@app.route("/api/dismissRoomUnlock", methods=["POST"])
def dismiss_room_unlock():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Update the seen_room_unlock flag
        cur.execute("""
            UPDATE users
            SET seen_room_unlock=1
            WHERE user_id=?
        """, (user_id,))
        
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"status": "ok"})
    except Exception as e:
        print(f"Error in dismiss_room_unlock: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/buildMachine", methods=["POST"])
def build_machine():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        data = request.json or {}
        machine_type = data.get("machineType")
        x_coord = data.get("x", 0)
        y_coord = data.get("y", 0)
        room = data.get("room", 1)  # Default to room 1 if not specified
        
        print(f"=== BUILD MACHINE REQUEST ===")
        print(f"Machine type: {machine_type}")
        print(f"Coordinates: x={x_coord}, y={y_coord}")
        print(f"Room: {room}")

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        update_amplifiers_status(user_id, conn, cur)

        cur.execute("""
            SELECT COUNT(*) FROM user_machines
            WHERE user_id=? AND machine_type=?
        """, (user_id, machine_type))
        how_many = cur.fetchone()[0]
        print(f"Existing machines of type {machine_type}: {how_many}")

        cost_dict = build_cost(machine_type, how_many, user_id)
        if cost_dict is None:
            print(f"Cannot build more machines of type {machine_type}")
            cur.close()
            conn.close()
            return jsonify({"error": "Cannot build more of this machine type."}), 400

        # Add special prerequisite checks with detailed logging
        if machine_type == "incubator":
            can_build = can_build_incubator(cur, user_id)
            print(f"Can build incubator check: {can_build}")
            if not can_build:
                cur.close()
                conn.close()
                return jsonify({"error": "All machines must be at max level to build Incubator."}), 400
        
        # Add check for fomoHit prerequisites with simplified requirements
        elif machine_type == "fomoHit":
            print("Checking FOMO HIT prerequisites...")
            
            # Check if user has at least one of each required machine type
            required_types = ['catLair', 'reactor', 'amplifier', 'incubator']
            for req_type in required_types:
                cur.execute("""
                    SELECT COUNT(*) FROM user_machines
                    WHERE user_id=? AND machine_type=?
                """, (user_id, req_type))
                count = cur.fetchone()[0]
                print(f"  - Has {req_type}: {count > 0}")
                if count == 0:
                    cur.close()
                    conn.close()
                    return jsonify({"error": f"Must build {req_type} first."}), 400
                    
            print("All FOMO HIT prerequisites satisfied")
            
        # Add check for third reactor
        elif machine_type == "reactor" and how_many == 2:
            if not can_build_third_reactor(cur, user_id):
                cur.close()
                conn.close()
                return jsonify({"error": "You need to build both Incubator and FOMO HIT before building a third Reactor."}), 400

        # Check resource costs
        cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        tcorvax_val = float(row["corvax_count"])
        catNips_val = float(get_or_create_resource(cur, user_id, 'catNips'))
        energy_val  = float(get_or_create_resource(cur, user_id, 'energy'))
        
        print(f"Resources - TCorvax: {tcorvax_val}, CatNips: {catNips_val}, Energy: {energy_val}")
        print(f"Cost - {cost_dict}")

        if (tcorvax_val < cost_dict.get("tcorvax",0) or
            catNips_val < cost_dict.get("catNips",0) or
            energy_val < cost_dict.get("energy",0)):
            print("Not enough resources")
            cur.close()
            conn.close()
            return jsonify({"error": "Not enough resources"}), 400

        machine_size = 128
        max_x = 800 - machine_size
        max_y = 600 - machine_size
        if x_coord < 0 or x_coord > max_x or y_coord < 0 or y_coord > max_y:
            cur.close()
            conn.close()
            return jsonify({"error": "Cannot build outside map boundaries."}), 400

        # Check for collision with other machines IN THE SAME ROOM
        cur.execute("SELECT x, y, room FROM user_machines WHERE user_id=?", (user_id,))
        all_m = cur.fetchall()
        for m in all_m:
            # Only check collision if in the same room
            if m["room"] == room:
                dx = abs(m["x"] - x_coord)
                dy = abs(m["y"] - y_coord)
                if dx < machine_size and dy < machine_size:
                    cur.close()
                    conn.close()
                    return jsonify({"error": "Cannot build here!"}), 400

        tcorvax_val -= cost_dict.get("tcorvax",0)
        catNips_val -= cost_dict.get("catNips",0)
        energy_val  -= cost_dict.get("energy",0)

        cur.execute("""
            UPDATE users SET corvax_count=?
            WHERE user_id=?
        """, (tcorvax_val, user_id))
        set_resource_amount(cur, user_id, 'catNips', catNips_val)
        set_resource_amount(cur, user_id, 'energy', energy_val)

        is_offline = 1 if machine_type == "incubator" else 0
        
        # Check if both provisional_mint and room columns exist
        has_provisional_mint = True
        has_room_column = True
        try:
            cur.execute("PRAGMA table_info(user_machines)")
            columns = [column[1] for column in cursor.fetchall()]
            has_provisional_mint = 'provisional_mint' in columns
            has_room_column = 'room' in columns
        except:
            has_provisional_mint = False
            has_room_column = False
            
        # Insert with appropriate columns
        if has_provisional_mint and has_room_column:
            cur.execute("""
                INSERT INTO user_machines
                (user_id, machine_type, x, y, level, last_activated, is_offline, next_cost_time, provisional_mint, room)
                VALUES (?, ?, ?, ?, 1, 0, ?, 0, 0, ?)
            """, (user_id, machine_type, x_coord, y_coord, is_offline, room))
        elif has_provisional_mint:
            cur.execute("""
                INSERT INTO user_machines
                (user_id, machine_type, x, y, level, last_activated, is_offline, next_cost_time, provisional_mint)
                VALUES (?, ?, ?, ?, 1, 0, ?, 0, 0)
            """, (user_id, machine_type, x_coord, y_coord, is_offline))
        else:
            cur.execute("""
                INSERT INTO user_machines
                (user_id, machine_type, x, y, level, last_activated, is_offline, next_cost_time)
                VALUES (?, ?, ?, ?, 1, 0, ?, 0)
            """, (user_id, machine_type, x_coord, y_coord, is_offline))

        conn.commit()
        
        # Check if room 2 is newly unlocked
        room_unlocked = 1
        
        # Count machines by type
        cur.execute("""
            SELECT machine_type, COUNT(*) as count
            FROM user_machines
            WHERE user_id=?
            GROUP BY machine_type
        """, (user_id,))
        
        machine_counts = {}
        for row in cur.fetchall():
            machine_counts[row['machine_type']] = row['count']
        
        # Room 2 unlocks when player has built 2 cat lairs, 2 reactors, and 1 amplifier
        cat_lair_count = machine_counts.get('catLair', 0)
        reactor_count = machine_counts.get('reactor', 0)
        amplifier_count = machine_counts.get('amplifier', 0)
        
        if cat_lair_count >= 2 and reactor_count >= 2 and amplifier_count >= 1:
            room_unlocked = 2
            
        print(f"Machine built successfully, rooms unlocked: {room_unlocked}")
        cur.close()
        conn.close()

        return jsonify({
            "status": "ok",
            "machineType": machine_type,
            "newResources": {
                "tcorvax": tcorvax_val,
                "catNips": catNips_val,
                "energy": energy_val
            },
            "roomsUnlocked": room_unlocked
        })
    except Exception as e:
        print(f"Error in build_machine: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/moveMachine", methods=["POST"])
def move_machine():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        data = request.json or {}
        machine_id = data.get("machineId")
        new_x = data.get("x", 0)
        new_y = data.get("y", 0)
        new_room = data.get("room", 1)  # Default to room 1 if not specified
        
        if not machine_id:
            return jsonify({"error": "Missing machineId"}), 400

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Verify the machine exists and belongs to the user
        cur.execute("""
            SELECT id, machine_type, room FROM user_machines
            WHERE user_id=? AND id=?
        """, (user_id, machine_id))
        
        machine = cur.fetchone()
        if not machine:
            cur.close()
            conn.close()
            return jsonify({"error": "Machine not found"}), 404
        
        # Check if user has enough TCorvax (50)
        movement_cost = 50
        
        cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
            
        tcorvax_val = float(row["corvax_count"])
        
        if tcorvax_val < movement_cost:
            cur.close()
            conn.close()
            return jsonify({"error": "Not enough TCorvax (50 required)"}), 400

        # Validate the new position
        machine_size = 128
        max_x = 800 - machine_size
        max_y = 600 - machine_size
        
        if new_x < 0 or new_x > max_x or new_y < 0 or new_y > max_y:
            cur.close()
            conn.close()
            return jsonify({"error": "Cannot move outside map boundaries."}), 400

        # Check for collision with other machines IN THE SAME ROOM
        cur.execute("SELECT id, x, y, room FROM user_machines WHERE user_id=? AND id != ?", 
                  (user_id, machine_id))
        
        other_machines = cur.fetchall()
        for m in other_machines:
            # Only check collision if in the same room
            if m["room"] == new_room:
                dx = abs(m["x"] - new_x)
                dy = abs(m["y"] - new_y)
                if dx < machine_size and dy < machine_size:
                    cur.close()
                    conn.close()
                    return jsonify({"error": "Cannot move here due to collision with another machine!"}), 400

        # Deduct TCorvax cost
        tcorvax_val -= movement_cost
        cur.execute("""
            UPDATE users
            SET corvax_count=?
            WHERE user_id=?
        """, (tcorvax_val, user_id))

        # Update machine position and room
        cur.execute("""
            UPDATE user_machines
            SET x=?, y=?, room=?
            WHERE user_id=? AND id=?
        """, (new_x, new_y, new_room, user_id, machine_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "status": "ok",
            "machineId": machine_id,
            "newPosition": {
                "x": new_x,
                "y": new_y,
                "room": new_room
            },
            "newResources": {
                "tcorvax": tcorvax_val
            }
        })
    except Exception as e:
        print(f"Error in move_machine: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/upgradeMachine", methods=["POST"])
def upgrade_machine():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        data = request.json or {}
        machine_id = data.get("machineId")
        if not machine_id:
            return jsonify({"error": "Missing machineId"}), 400

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        update_amplifiers_status(user_id, conn, cur)

        cur.execute("""
            SELECT id, machine_type, level
            FROM user_machines
            WHERE user_id=? AND id=?
        """, (user_id, machine_id))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Machine not found"}), 404

        machine_type = row["machine_type"]
        current_level = row["level"]

        cost_dict = upgrade_cost(cur, user_id, machine_type, current_level, machine_id)
        if cost_dict is None:
            cur.close()
            conn.close()
            return jsonify({"error": "Cannot upgrade further or gating not met."}), 400

        cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
        urow = cur.fetchone()
        if not urow:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        tcorvax_val = float(urow["corvax_count"])
        catNips_val = float(get_or_create_resource(cur, user_id, 'catNips'))
        energy_val  = float(get_or_create_resource(cur, user_id, 'energy'))

        if (tcorvax_val < cost_dict.get("tcorvax",0) or
            catNips_val < cost_dict.get("catNips",0) or
            energy_val < cost_dict.get("energy",0)):
            cur.close()
            conn.close()
            return jsonify({"error": "Not enough resources"}), 400

        new_level = current_level + 1
        cur.execute("""
            UPDATE user_machines
            SET level=?
            WHERE user_id=? AND id=?
        """, (new_level, user_id, machine_id))

        tcorvax_val -= cost_dict.get("tcorvax",0)
        catNips_val -= cost_dict.get("catNips",0)
        energy_val  -= cost_dict.get("energy",0)

        cur.execute("""
            UPDATE users
            SET corvax_count=?
            WHERE user_id=?
        """, (tcorvax_val, user_id))
        set_resource_amount(cur, user_id, 'catNips', catNips_val)
        set_resource_amount(cur, user_id, 'energy', energy_val)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "status": "ok",
            "machineId": machine_id,
            "newLevel": new_level,
            "newResources": {
                "tcorvax": tcorvax_val,
                "catNips": catNips_val,
                "energy": energy_val
            }
        })
    except Exception as e:
        print(f"Error in upgrade_machine: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/checkMintStatus", methods=["POST"])
def check_mint_status():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
            
        data = request.json or {}
        intent_hash = data.get("intentHash")
        machine_id = data.get("machineId")
        
        if not intent_hash or not machine_id:
            return jsonify({"error": "Missing intentHash or machineId"}), 400
            
        # Get the transaction status
        status_data = get_transaction_status(intent_hash)
        
        # If the transaction is committed successfully, update the machine
        if status_data.get("status") == "CommittedSuccess":
            user_id = session['telegram_id']
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Check if provisional_mint column exists
            has_provisional_mint = True
            try:
                cur.execute("PRAGMA table_info(user_machines)")
                columns = [column[1] for column in cur.fetchall()]
                has_provisional_mint = 'provisional_mint' in columns
            except:
                has_provisional_mint = False
                
            if has_provisional_mint:
                try:
                    # Update the machine to show successful mint
                    cur.execute("""
                        UPDATE user_machines
                        SET provisional_mint=0
                        WHERE user_id=? AND id=?
                    """, (user_id, machine_id))
                    conn.commit()
                except Exception as e:
                    print(f"Error updating provisional_mint: {e}")
            
            cur.close()
            conn.close()
            
        return jsonify({
            "status": "ok",
            "transactionStatus": status_data
        })
    except Exception as e:
        print(f"Error in check_mint_status: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/activateMachine", methods=["POST"])
def activate_machine():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        # Log the incoming request for debugging
        print(f"=== ACTIVATE MACHINE REQUEST ===")
        try:
            data = request.get_json(silent=True) or {}
            print(f"Request data: {json.dumps(data, indent=2)}")
        except Exception as e:
            print(f"Error parsing request JSON: {e}")
            data = request.form or {}
            print(f"Form data: {data}")
            
        machine_id = data.get("machineId")
        if machine_id is None:
            return jsonify({"error": "Missing machineId"}), 400

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        update_amplifiers_status(user_id, conn, cur)

        # Check if the provisional_mint column exists
        has_provisional_mint = True
        try:
            cur.execute("PRAGMA table_info(user_machines)")
            columns = [column[1] for column in cur.fetchall()]
            has_provisional_mint = 'provisional_mint' in columns
        except:
            has_provisional_mint = False
            
        # Build the query based on column existence
        if has_provisional_mint:
            query = """
                SELECT machine_type, level, last_activated, is_offline, provisional_mint, room
                FROM user_machines
                WHERE user_id=? AND id=?
            """
        else:
            query = """
                SELECT machine_type, level, last_activated, is_offline, room
                FROM user_machines
                WHERE user_id=? AND id=?
            """
            
        cur.execute(query, (user_id, machine_id))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "Machine not found"}), 404

        # Convert row to dictionary to avoid sqlite3.Row.get() issue
        machine_data = dict(row)
        
        machine_type = machine_data["machine_type"]
        machine_level = machine_data["level"]
        last_activated = machine_data["last_activated"] or 0
        is_offline = machine_data["is_offline"]
        provisional_mint = machine_data.get("provisional_mint", 0) if has_provisional_mint else 0
        room = machine_data.get("room", 1)  # Default to room 1 if not present

        COOL_MS = 3600*1000
        now_ms = int(time.time()*1000)
        elapsed = now_ms - last_activated
        if elapsed < COOL_MS:
            remain = COOL_MS - elapsed
            cur.close()
            conn.close()
            return jsonify({"error":"Cooldown not finished","remainingMs":remain}), 400

        cur.execute("SELECT corvax_count FROM users WHERE user_id=?", (user_id,))
        urow = cur.fetchone()
        if not urow:
            cur.close()
            conn.close()
            return jsonify({"error":"User not found"}), 404

        tcorvax_val = float(urow["corvax_count"])
        catNips_val = float(get_or_create_resource(cur, user_id, 'catNips'))
        energy_val = float(get_or_create_resource(cur, user_id, 'energy'))
        eggs_val = float(get_or_create_resource(cur, user_id, 'eggs'))

        if machine_type == "amplifier":
            status = "Online" if is_offline==0 else "Offline"
            cur.close()
            conn.close()
            return jsonify({"status":"ok","message":status})

        if machine_type == "incubator":
            if last_activated == 0:
                print("First incubator activation - setting online and checking sCVX rewards")
                
                # Get account address from request
                account_address = data.get("accountAddress")
                print(f"Got account address from request: {account_address}")
                
                # Ensure we have an account address
                if not account_address:
                    print("No account address provided for sCVX lookup")
                    staked_cvx = 0
                else:
                    print(f"Fetching sCVX for account: {account_address}")
                    # Use the server-side fetch function
                    staked_cvx = fetch_scvx_balance(account_address)
                    
                print(f"Final sCVX value: {staked_cvx}")
                
                # Calculate rewards based on level
                machine_level = machine_level or 1
                
                # Base reward (level 1): 1 token per 100 sCVX, max 10
                base_reward = min(10, int(staked_cvx // 100))
                
                # Bonus reward (level 2): additional 1 token per 1000 sCVX, no max
                bonus_reward = 0
                if machine_level >= 2:
                    bonus_reward = int(staked_cvx // 1000)
                
                total_reward = base_reward + bonus_reward
                
                # Award eggs (1 egg per 500 sCVX)
                eggs_reward = int(staked_cvx // 500)
                
                # Update resources
                tcorvax_val += total_reward
                eggs_val += eggs_reward
                
                print(f"sCVX rewards calculated: Base {base_reward}, Bonus {bonus_reward}, Eggs {eggs_reward}")

                # Update user's resources
                cur.execute("""
                    UPDATE users
                    SET corvax_count=?
                    WHERE user_id=?
                """, (tcorvax_val, user_id))
                
                # Update eggs resource
                set_resource_amount(cur, user_id, 'eggs', eggs_val)

                # Set incubator to online and update activation time
                cur.execute("""
                    UPDATE user_machines
                    SET is_offline=0, last_activated=?
                    WHERE user_id=? AND id=?
                """, (now_ms, user_id, machine_id))

                conn.commit()
                cur.close()
                conn.close()

                # Return detailed response with rewards
                return jsonify({
                    "status": "ok",
                    "machineId": machine_id,
                    "machineType": machine_type,
                    "newLastActivated": now_ms,
                    "stakedCVX": staked_cvx,
                    "baseReward": base_reward,
                    "bonusReward": bonus_reward,
                    "eggsReward": eggs_reward,
                    "updatedResources": {
                        "tcorvax": tcorvax_val,
                        "catNips": catNips_val,
                        "energy": energy_val,
                        "eggs": eggs_val
                    }
                })
            else:
                # Get account address from request
                account_address = data.get("accountAddress")
                print(f"Got account address from request: {account_address}")
                
                # Ensure we have an account address
                if not account_address:
                    print("No account address provided for sCVX lookup")
                    staked_cvx = 0
                else:
                    print(f"Fetching sCVX for account: {account_address}")
                    # Use the server-side fetch function
                    staked_cvx = fetch_scvx_balance(account_address)
                    
                print(f"Final sCVX value: {staked_cvx}")
                
                # Calculate rewards based on level
                machine_level = machine_level or 1
                
                # Base reward (level 1): 1 token per 100 sCVX, max 10
                base_reward = min(10, int(staked_cvx // 100))
                
                # Bonus reward (level 2): additional 1 token per 1000 sCVX, no max
                bonus_reward = 0
                if machine_level >= 2:
                    bonus_reward = int(staked_cvx // 1000)
                
                total_reward = base_reward + bonus_reward
                
                # Award eggs (1 egg per 500 sCVX)
                eggs_reward = int(staked_cvx // 500)
                
                # Update resources
                tcorvax_val += total_reward
                eggs_val += eggs_reward
                
                print(f"sCVX rewards calculated: Base {base_reward}, Bonus {bonus_reward}, Eggs {eggs_reward}")

                cur.execute("""
                    UPDATE users
                    SET corvax_count=?
                    WHERE user_id=?
                """, (tcorvax_val, user_id))
                
                # Update eggs resource
                set_resource_amount(cur, user_id, 'eggs', eggs_val)

                cur.execute("""
                    UPDATE user_machines
                    SET last_activated=?
                    WHERE user_id=? AND id=?
                """, (now_ms, user_id, machine_id))

                conn.commit()
                cur.close()
                conn.close()

                return jsonify({
                    "status": "ok",
                    "machineId": machine_id,
                    "machineType": machine_type,
                    "newLastActivated": now_ms,
                    "stakedCVX": staked_cvx,
                    "baseReward": base_reward,
                    "bonusReward": bonus_reward,
                    "eggsReward": eggs_reward,
                    "updatedResources": {
                        "tcorvax": tcorvax_val,
                        "catNips": catNips_val,
                        "energy": energy_val,
                        "eggs": eggs_val
                    }
                })
        
        elif machine_type == "fomoHit":
            print(f"Handling FOMO HIT activation for machine ID: {machine_id}")
            
            # First activation - mint NFT
            if last_activated == 0:
                # Get account address from request
                account_address = data.get("accountAddress")
                print(f"Got account address for NFT mint: {account_address}")
                
                # Ensure we have an account address
                if not account_address:
                    print("No account address provided for NFT mint")
                    cur.close()
                    conn.close()
                    return jsonify({"error": "No wallet address provided"}), 400
                    
                # Create the mint manifest
                mint_manifest = create_nft_mint_manifest(account_address)
                print(f"Created mint manifest")
                
                # Set provisional mint status if the column exists
                if has_provisional_mint:
                    try:
                        cur.execute("""
                            UPDATE user_machines
                            SET provisional_mint=1
                            WHERE user_id=? AND id=?
                        """, (user_id, machine_id))
                    except sqlite3.OperationalError:
                        print("Could not update provisional_mint (column missing)")
                
                # Store current time as activation time
                cur.execute("""
                    UPDATE user_machines
                    SET last_activated=?
                    WHERE user_id=? AND id=?
                """, (now_ms, user_id, machine_id))
                
                conn.commit()
                
                # Return the mint manifest for the frontend to process
                cur.close()
                conn.close()
                return jsonify({
                    "status": "ok",
                    "requiresMint": True,
                    "machineId": machine_id,
                    "machineType": machine_type,
                    "manifest": mint_manifest,
                    "newLastActivated": now_ms
                })
            else:
                # Subsequent activations - produce TCorvax
                reward = 5  # Produces 5 TCorvax on subsequent activations
                tcorvax_val += reward
                
                # Update resources
                cur.execute("""
                    UPDATE users
                    SET corvax_count=?
                    WHERE user_id=?
                """, (tcorvax_val, user_id))
                
                # Update activation time
                cur.execute("""
                    UPDATE user_machines
                    SET last_activated=?
                    WHERE user_id=? AND id=?
                """, (now_ms, user_id, machine_id))
                
                conn.commit()
                cur.close()
                conn.close()
                
                return jsonify({
                    "status": "ok",
                    "machineId": machine_id,
                    "machineType": machine_type,
                    "newLastActivated": now_ms,
                    "reward": reward,
                    "updatedResources": {
                        "tcorvax": tcorvax_val,
                        "catNips": catNips_val,
                        "energy": energy_val,
                        "eggs": eggs_val
                    }
                })

        if machine_type == "catLair":
            gained = 5 + (machine_level - 1)
            catNips_val += gained
        elif machine_type == "reactor":
            if catNips_val < 3:
                cur.close()
                conn.close()
                return jsonify({"error":"Not enough Cat Nips to run the Reactor!"}), 400
            catNips_val -= 3
            if machine_level == 1:
                base_t = 1.0
            elif machine_level == 2:
                base_t = 1.5
            elif machine_level == 3:
                base_t = 2.0
            else:
                base_t = 1.0

            cur.execute("""
                SELECT level, is_offline
                FROM user_machines
                WHERE user_id=? AND machine_type='amplifier'
            """,(user_id,))
            amp = cur.fetchone()
            if amp and amp["is_offline"] == 0:
                amp_level = amp["level"]
                base_t += 0.5 * amp_level

            base_e = 2
            tcorvax_val += base_t
            energy_val  += base_e

        cur.execute("""
            UPDATE user_machines
            SET last_activated=?
            WHERE user_id=? AND id=?
        """,(now_ms,user_id,machine_id))

        cur.execute("""
            UPDATE users
            SET corvax_count=?
            WHERE user_id=?
        """,(tcorvax_val,user_id))
        set_resource_amount(cur, user_id,'catNips',catNips_val)
        set_resource_amount(cur, user_id,'energy', energy_val)

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "status":"ok",
            "machineId":machine_id,
            "machineType":machine_type,
            "newLastActivated":now_ms,
            "updatedResources":{
                "tcorvax": tcorvax_val,
                "catNips": catNips_val,
                "energy": energy_val,
                "eggs": eggs_val
            }
        })
    except Exception as e:
        print(f"Error in activate_machine: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/getPets", methods=["GET"])
def get_pets():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT id, x, y, room, type, parent_machine
            FROM pets
            WHERE user_id=?
        """, (user_id,))
        
        rows = cur.fetchall()
        pets = []
        
        for row in rows:
            pet = {
                "id": row["id"],
                "x": row["x"],
                "y": row["y"],
                "room": row["room"],
                "type": row["type"],
                "parentMachine": row["parent_machine"]
            }
            pets.append(pet)

        cur.close()
        conn.close()

        return jsonify(pets)
    except Exception as e:
        print(f"Error in get_pets: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/buyPet", methods=["POST"])
def buy_pet():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        data = request.json or {}
        pet_type = data.get("petType", "cat")
        x_coord = data.get("x", 0)
        y_coord = data.get("y", 0)
        room = data.get("room", 1)
        parent_machine = data.get("parentMachine")
        
        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if user already has a pet of this type
        cur.execute("""
            SELECT COUNT(*) FROM pets
            WHERE user_id=? AND type=?
        """, (user_id, pet_type))
        
        pet_count = cur.fetchone()[0]
        
        # Currently only allow one pet per type
        if pet_count > 0:
            cur.close()
            conn.close()
            return jsonify({"error": "You already have this type of pet"}), 400

        # Check if user has enough catnips
        catNips_val = float(get_or_create_resource(cur, user_id, 'catNips'))
        
        if catNips_val < 1500:
            cur.close()
            conn.close()
            return jsonify({"error": "Not enough Cat Nips (1500 required)"}), 400

        # Deduct catnips
        catNips_val -= 1500
        set_resource_amount(cur, user_id, 'catNips', catNips_val)

        # Create the pet
        cur.execute("""
            INSERT INTO pets (user_id, x, y, room, type, parent_machine)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, x_coord, y_coord, room, pet_type, parent_machine))

        pet_id = cur.lastrowid
        conn.commit()

        cur.close()
        conn.close()

        return jsonify({
            "status": "ok",
            "petId": pet_id,
            "petType": pet_type,
            "position": {
                "x": x_coord,
                "y": y_coord,
                "room": room
            },
            "newResources": {
                "catNips": catNips_val
            }
        })
    except Exception as e:
        print(f"Error in buy_pet: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/movePet", methods=["POST"])
def move_pet():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        data = request.json or {}
        pet_id = data.get("petId")
        new_x = data.get("x", 0)
        new_y = data.get("y", 0)
        new_room = data.get("room", 1)
        
        if not pet_id:
            return jsonify({"error": "Missing petId"}), 400

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Verify the pet exists and belongs to the user
        cur.execute("""
            SELECT id FROM pets
            WHERE user_id=? AND id=?
        """, (user_id, pet_id))
        
        pet = cur.fetchone()
        if not pet:
            cur.close()
            conn.close()
            return jsonify({"error": "Pet not found"}), 404

        # Update pet position
        cur.execute("""
            UPDATE pets
            SET x=?, y=?, room=?
            WHERE user_id=? AND id=?
        """, (new_x, new_y, new_room, user_id, pet_id))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "status": "ok",
            "petId": pet_id,
            "newPosition": {
                "x": new_x,
                "y": new_y,
                "room": new_room
            }
        })
    except Exception as e:
        print(f"Error in move_pet: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/buyEnergy", methods=["POST"])
def buy_energy():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
        user_id = session['telegram_id']
        data = request.json or {}
        account_address = data.get("accountAddress")
        
        if not account_address:
            return jsonify({"error": "No account address provided"}), 400
        
        print(f"Generating energy purchase manifest for account: {account_address}")    
        # Create transaction manifest for buying energy
        manifest = create_buy_energy_manifest(account_address)
        
        if manifest is None:
            return jsonify({"error": "Failed to create transaction manifest"}), 500
        
        print(f"Returning manifest: {manifest}")    
        return jsonify({
            "status": "ok",
            "manifest": manifest,
            "energyAmount": 500,
            "cvxCost": 200.0,  # Update this value to 200
            "message": "Please ensure you have at least 200.0 CVX plus transaction fees in your wallet"
        })
    except Exception as e:
        print(f"Error in buy_energy: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/confirmEnergyPurchase", methods=["POST"])
def confirm_energy_purchase():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401

        user_id = session['telegram_id']
        data = request.json or {}
        intent_hash = data.get("intentHash")
        
        if not intent_hash:
            return jsonify({"error": "Missing transaction intent hash"}), 400
            
        # Get transaction status
        status_data = get_transaction_status(intent_hash)
        
        # If transaction is committed successfully, add energy
        if status_data.get("status") == "CommittedSuccess":
            conn = get_db_connection()
            cur = conn.cursor()
            
            # Get current energy
            energy_val = float(get_or_create_resource(cur, user_id, 'energy'))
            
            # Add 500 energy
            energy_val += 500
            
            # Update energy resource
            set_resource_amount(cur, user_id, 'energy', energy_val)
            
            conn.commit()
            cur.close()
            conn.close()
            
            return jsonify({
                "status": "ok", 
                "transactionStatus": status_data,
                "newEnergy": energy_val
            })
        
        # Return transaction status even if not successful
        return jsonify({
            "status": "pending",
            "transactionStatus": status_data
        })
    except Exception as e:
        print(f"Error in confirm_energy_purchase: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/syncLayout", methods=["POST"])
def sync_layout():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error":"Not logged in"}), 401

        data = request.json or {}
        machine_list = data.get("machines", [])

        user_id = session['telegram_id']
        conn = get_db_connection()
        cur = conn.cursor()

        # Check if room column exists
        has_room_column = True
        try:
            cur.execute("PRAGMA table_info(user_machines)")
            columns = [column[1] for column in cur.fetchall()]
            has_room_column = 'room' in columns
        except:
            has_room_column = False

        for m in machine_list:
            mid = m.get("id")
            mx = m.get("x", 0)
            my = m.get("y", 0)
            mroom = m.get("room", 1)  # Default to room 1
            
            if has_room_column:
                cur.execute("""
                    UPDATE user_machines
                    SET x=?, y=?, room=?
                    WHERE user_id=? AND id=?
                """, (mx, my, mroom, user_id, mid))
            else:
                cur.execute("""
                    UPDATE user_machines
                    SET x=?, y=?
                    WHERE user_id=? AND id=?
                """, (mx, my, user_id, mid))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"status":"ok","message":"Layout updated"})
    except Exception as e:
        print(f"Error in sync_layout: {e}")
        traceback.print_exc() 
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/getMintEggManifest", methods=["POST"])
def get_mint_egg_manifest():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
            
        user_id = session['telegram_id']
        data = request.json or {}
        account_address = data.get("accountAddress")
        payment_method = data.get("paymentMethod", "xrd")  # 'xrd' or 'eggs'
        
        if not account_address:
            return jsonify({"error": "No account address provided"}), 400
        
        print(f"=== MINT EGG REQUEST ===")
        print(f"User ID: {user_id}")
        print(f"Account Address: {account_address}")
        print(f"Payment Method: {payment_method}")
        
        # For production, use the actual XRD resource address
        XRD_RESOURCE = "resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd"
        BACKEND_BADGE = "resource_rdx1tkfpjtakrtv96e4l38djre4pxdwaa49sa7djhfwt3egqm42ztt0ddw"
        DAPP_DEFINITION_ADDRESS = "account_rdx12yszc3rh4yq3h9syvg5uv4ennzg8ujkmtaptc4r3a9npe6wgzwn7ar"
        COMPONENT_ADDRESS = "component_rdx1crz6pcapzglrv68tydmuq226ydtsu0x2vlx3793g4qe72450m3f86t"
        
        # Check if using eggs payment method
        if payment_method == "eggs":
            # Check if user has enough eggs
            conn = get_db_connection()
            cur = conn.cursor()
            
            eggs_val = float(get_or_create_resource(cur, user_id, 'eggs'))
            print(f"User's egg balance: {eggs_val}")
            
            if eggs_val < 150:
                cur.close()
                conn.close()
                return jsonify({"error": "Not enough eggs. 150 eggs required."}), 400
            
            # Store user_id and payment method in session for later validation
            # Don't deduct resources yet - only after transaction succeeds
            session['pending_egg_mint'] = {
                'user_id': user_id,
                'payment_method': 'eggs',
                'eggs_cost': 150,
                'timestamp': int(time.time())
            }
            
            # Create the backend mint manifest using the DApp Toolkit pattern
            # The key change is removing the explicit parameters to backend_mint_egg
            manifest = f"""
CALL_METHOD
    Address("{DAPP_DEFINITION_ADDRESS}")
    "create_proof_of_amount"
    Address("{BACKEND_BADGE}")
    Decimal("1");
CREATE_PROOF_FROM_AUTH_ZONE_OF_ALL
    Address("{BACKEND_BADGE}")
    Proof("backend_proof");
CALL_METHOD
    Address("{COMPONENT_ADDRESS}")
    "backend_mint_egg"
    Proof("backend_proof")
    None;
DROP_ALL_PROOFS;
CALL_METHOD
    Address("{account_address}")
    "try_deposit_batch_or_abort"
    Expression("ENTIRE_WORKTOP")
    None;
"""
            print("Generated backend mint manifest")
            cur.close()
            conn.close()
            
        else:  # XRD payment
            # Create the mint_egg manifest for XRD payment
            manifest = f"""
CALL_METHOD
    Address("{account_address}")
    "withdraw"
    Address("{XRD_RESOURCE}")
    Decimal("300");
TAKE_FROM_WORKTOP
    Address("{XRD_RESOURCE}")
    Decimal("300")
    Bucket("payment");
CALL_METHOD
    Address("{COMPONENT_ADDRESS}")
    "mint_egg"
    Bucket("payment");
CALL_METHOD
    Address("{account_address}")
    "try_deposit_batch_or_abort"
    Expression("ENTIRE_WORKTOP")
    None;
"""
            print("Generated XRD mint manifest")
            
            # Store transaction type in session
            session['pending_egg_mint'] = {
                'user_id': user_id,
                'payment_method': 'xrd',
                'timestamp': int(time.time())
            }
        
        return jsonify({
            "status": "ok",
            "manifest": manifest,
            "paymentMethod": payment_method
        })
        
    except Exception as e:
        print(f"Error in get_mint_egg_manifest: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Add these functions to app.py to retrieve NFT data

@app.route("/api/getUserNFTs", methods=["POST"])
def get_user_nfts():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
            
        data = request.json or {}
        account_address = data.get("accountAddress")
        
        if not account_address:
            return jsonify({"error": "No account address provided"}), 400
        
        print(f"=== GET USER NFTS REQUEST ===")
        print(f"Account Address: {account_address}")
        
        # NFT resource address for Evolving Creatures
        CREATURE_NFT_RESOURCE = "resource_rdx1n2rt6ygucac2me5jada3mluyf5f58ezhx06k6qlvasav0q0ece5svd"
        
        # Call the Radix Gateway API to get NFT vaults
        url = "https://mainnet.radixdlt.com/state/entity/page/non-fungible-vaults"
        payload = {
            "address": account_address,
            "resource_address": CREATURE_NFT_RESOURCE
        }
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CorvaxLab Game/1.0'
        }
        
        print(f"Calling Gateway API to fetch NFT vaults")
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Gateway API error: Status {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return jsonify({"error": f"Failed to fetch NFT vaults: HTTP {response.status_code}"}), 500
        
        vaults_data = response.json()
        
        # Extract non-fungible IDs from the vaults
        nft_ids = []
        for item in vaults_data.get('items', []):
            if 'vault_address' in item:
                # Now fetch the IDs for this vault
                vault_url = "https://mainnet.radixdlt.com/state/entity/page/non-fungible-vault/ids"
                vault_payload = {
                    "address": account_address,
                    "resource_address": CREATURE_NFT_RESOURCE,
                    "vault_address": item.get('vault_address')
                }
                
                vault_response = requests.post(vault_url, json=vault_payload, headers=headers, timeout=15)
                
                if vault_response.status_code == 200:
                    ids_data = vault_response.json()
                    nft_ids.extend(ids_data.get('items', []))
        
        print(f"Found {len(nft_ids)} NFT IDs")
        
        if not nft_ids:
            return jsonify({
                "status": "ok",
                "nfts": [],
                "total_count": 0
            })
        
        # Fetch NFT data for each ID
        url = "https://mainnet.radixdlt.com/state/non-fungible/data"
        payload = {
            "resource_address": CREATURE_NFT_RESOURCE,
            "non_fungible_ids": nft_ids
        }
        
        print(f"Calling Gateway API to fetch NFT data")
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Gateway API error: Status {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return jsonify({"error": f"Failed to fetch NFT data: HTTP {response.status_code}"}), 500
        
        nft_data = response.json()
        
        # Log the full API response to see the structure
        print("Full NFT data response structure:")
        print(json.dumps(nft_data, indent=2)[:1000] + "...")  # Limit output size
        
        # Process NFT data for frontend display
        processed_nfts = []
        for nft in nft_data.get('non_fungible_ids', []):
            nft_id = nft.get('non_fungible_id')
            # The data field contains the actual NFT metadata
            raw_data = nft.get('data', {})
            
            # Check if raw_data is a string (JSON) and parse it if needed
            if isinstance(raw_data, str):
                try:
                    parsed_data = json.loads(raw_data)
                    data = parsed_data
                except:
                    data = raw_data
            else:
                data = raw_data
            
            # Debug log the extracted data
            print(f"NFT ID: {nft_id}")
            print(f"Raw data type: {type(data)}")
            print(f"Raw data: {json.dumps(data, indent=2)[:500]}...")
            
            # Process the data according to NFT schema
            processed_nft = {
                "id": nft_id,
                "species_id": data.get('species_id'),
                "species_name": data.get('species_name'),
                "form": data.get('form'),
                "image_url": data.get('image_url'),
                "key_image_url": data.get('key_image_url'),
                "rarity": data.get('rarity'),
                "stats": data.get('stats', {}),
                "evolution_progress": data.get('evolution_progress', {}),
                "display_form": data.get('display_form', "Egg"),
                "display_stats": data.get('display_stats', ""),
                "combination_level": data.get('combination_level', 0)
            }
            
            processed_nfts.append(processed_nft)
        
        return jsonify({
            "status": "ok",
            "nfts": processed_nfts,
            "total_count": len(processed_nfts)
        })
        
    except Exception as e:
        print(f"Error in get_user_nfts: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/getNFTDetails", methods=["POST"])
def get_nft_details():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
            
        data = request.json or {}
        resource_address = data.get("resourceAddress")
        nft_id = data.get("nftId")
        
        if not resource_address or not nft_id:
            return jsonify({"error": "Missing resourceAddress or nftId"}), 400
        
        print(f"=== GET NFT DETAILS REQUEST ===")
        print(f"Resource Address: {resource_address}")
        print(f"NFT ID: {nft_id}")
        
        # Call the Radix Gateway API to get NFT data
        url = "https://mainnet.radixdlt.com/state/non-fungible/data"
        payload = {
            "resource_address": resource_address,
            "non_fungible_ids": [nft_id]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'CorvaxLab Game/1.0'
        }
        
        print(f"Calling Gateway API to fetch NFT details")
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        if response.status_code != 200:
            print(f"Gateway API error: Status {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return jsonify({"error": f"Failed to fetch NFT details: HTTP {response.status_code}"}), 500
        
        nft_data = response.json()
        
        # Log the entire response for debugging
        print("Full NFT details response:")
        print(json.dumps(nft_data, indent=2)[:1000] + "...")
        
        if not nft_data.get('non_fungible_ids'):
            return jsonify({"error": "NFT not found"}), 404
        
        # Get the first (and only) NFT from the response
        nft = nft_data.get('non_fungible_ids', [])[0]
        raw_data = nft.get('data', {})
        
        # Check if raw_data is a string (JSON) and parse it if needed
        if isinstance(raw_data, str):
            try:
                parsed_data = json.loads(raw_data)
                data = parsed_data
            except:
                data = raw_data
        else:
            data = raw_data
            
        print(f"Parsed NFT data type: {type(data)}")
        print(f"Parsed NFT data: {json.dumps(data, indent=2)[:500]}...")
        
        # Extract all fields from the NFT data
        nft_details = {
            "id": nft.get('non_fungible_id'),
            "species_id": data.get('species_id'),
            "species_name": data.get('species_name'),
            "form": data.get('form'),
            "key_image_url": data.get('key_image_url'),
            "image_url": data.get('image_url'),
            "rarity": data.get('rarity'),
            "stats": data.get('stats', {}),
            "evolution_progress": data.get('evolution_progress', {}),
            "final_form_upgrades": data.get('final_form_upgrades', 0),
            "version": data.get('version', 1),
            "combination_level": data.get('combination_level', 0),
            "bonus_stats": data.get('bonus_stats', {}),
            "display_form": data.get('display_form', "Egg"),
            "display_stats": data.get('display_stats', ""),
            "display_combination": data.get('display_combination', "")
        }
        
        return jsonify({
            "status": "ok",
            "nft_details": nft_details
        })
        
    except Exception as e:
        print(f"Error in get_nft_details: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/api/checkEggMintStatus", methods=["POST"])
def check_egg_mint_status():
    try:
        if 'telegram_id' not in session:
            return jsonify({"error": "Not logged in"}), 401
            
        user_id = session['telegram_id']
        data = request.json or {}
        intent_hash = data.get("intentHash")
        
        if not intent_hash:
            return jsonify({"error": "Missing intentHash"}), 400
            
        print(f"=== CHECKING EGG MINT STATUS ===")
        print(f"Intent Hash: {intent_hash}")
        
        # Get the transaction status
        status_data = get_transaction_status(intent_hash)
        print(f"Transaction status: {status_data}")
        
        # Check if transaction was successful and we have pending egg mint info
        if status_data.get("status") == "CommittedSuccess" and 'pending_egg_mint' in session:
            pending_mint = session.get('pending_egg_mint', {})
            payment_method = pending_mint.get('payment_method')
            
            # Only deduct eggs if payment method was 'eggs' and the transaction succeeded
            if payment_method == 'eggs':
                # Validate that the user_id matches
                if pending_mint.get('user_id') == user_id:
                    eggs_cost = pending_mint.get('eggs_cost', 150)
                    
                    # Now deduct the eggs resource
                    conn = get_db_connection()
                    cur = conn.cursor()
                    
                    eggs_val = float(get_or_create_resource(cur, user_id, 'eggs'))
                    
                    # Double check user still has enough eggs
                    if eggs_val >= eggs_cost:
                        # Deduct eggs from user's resources
                        eggs_val -= eggs_cost
                        set_resource_amount(cur, user_id, 'eggs', eggs_val)
                        conn.commit()
                        print(f"Deducted {eggs_cost} eggs from user {user_id}. New balance: {eggs_val}")
                    else:
                        print(f"Warning: User doesn't have enough eggs anymore. Current: {eggs_val}, Required: {eggs_cost}")
                    
                    cur.close()
                    conn.close()
            
            # Clear the pending mint info
            session.pop('pending_egg_mint', None)
        
        return jsonify({
            "status": "ok",
            "transactionStatus": status_data
        })
    except Exception as e:
        print(f"Error in check_egg_mint_status: {e}")
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
