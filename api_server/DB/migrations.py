import sys
sys.path.append('..')
import PipeLine
import sqlite3
from config import DB_POST
import os

def migration_mar28():
    with sqlite3.connect(os.path.join('..', DB_POST)) as connection:
        cursor = connection.cursor()
        cursor.execute("ALTER TABLE Posts ADD COLUMN md_content text;")
        cursor.execute("UPDATE Posts SET md_content = content;")
        cursor.close()
        connection.commit()
