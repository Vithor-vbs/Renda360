import os
from flask import Flask
from dotenv import load_dotenv
from .models import db, User

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
db.init_app(app)

with app.app_context():
    users = User.query.all()
    for user in users:
        try:
            from .vector_store import FinancialVectorStore
            store = FinancialVectorStore(user.id)
            count = store.update_user_data()
            print(
                f"Created vector store for user {user.id} with {count} documents")
        except Exception as e:
            print(f"Error for user {user.id}: {str(e)}")
