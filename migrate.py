import pymysql
import os
from dotenv import load_dotenv

load_dotenv("e:\\source\\repos\\arl_kpi\\.env")
url = os.getenv("DATABASE_URL")

import urllib.parse
if url:
    url = url.replace("mysql+pymysql://", "")
    user_pass, host_db = url.split("@")
    user, password = user_pass.split(":")
    password = urllib.parse.unquote(password)
    host_port, db = host_db.split("/")
    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 3306

    print(f"Connecting to {host}:{port} db={db} user={user}")
    conn = pymysql.connect(host=host, user=user, password=password, database=db, port=port)
    try:
        with conn.cursor() as cur:
            cur.execute("ALTER TABLE user ADD COLUMN allowed_metrics JSON;")
        conn.commit()
        print("Migration successful: Added allowed_metrics column to user table.")
    except Exception as e:
        print("Migration info/error:", e)
    finally:
        conn.close()
else:
    print("No DATABASE_URL found")
