# Renda360 - Setup

## System Overview

<img width="2026" height="1075" alt="image" src="https://github.com/user-attachments/assets/8ba5ba93-b897-4f41-b336-dce2f18b1022" />

1. User uploads Nubank PDF
   ↓
2. PDF Extractor processes file
   ├─ Extracts transactions → PostgreSQL
   └─ Creates embeddings → FAISS vectors
   ↓
3. User asks: "Quanto gastei em restaurantes?"
   ↓
4. Julius AI receives question
   ├─ Normalizes: "quanto gastei em restaurantes"
   ├─ Checks cache: Miss
   ├─ Pattern matches: "quanto gastei" → total_spending_query  
   ├─ Filters by category: "restaurantes"
   └─ Executes: SELECT SUM(amount) WHERE description LIKE '%restaurant%'
   ↓
5. Returns: "Você gastou R$ 847.30 em restaurantes este mês"
   ├─ Caches response for 30 minutes
   └─ Updates cost statistics (pattern_matches++)

- React frontend
- Flask backend API
- PostgreSQL database
- Dockerized database infrastructure

## Development Setup

### Prerequisites

- Node.js v18+
- Python 3.11+
- Docker Desktop
- PostgreSQL client (optional)

### Quick Start

1. **Clone Repository**

```bash
git clone https://github.com/Vithor-vbs/Renda360.git
cd Renda360
```

2. **Environment Setup**
   Create `.env` file in project root:

```env
# PostgreSQL
POSTGRES_DB=renda360
POSTGRES_USER=renda_user
POSTGRES_PASSWORD=strongpassword123
DATABASE_URI=postgresql://renda_user:strongpassword123@localhost:5432/renda360

# Flask
JWT_SECRET_KEY=your-super-secret-key-change-this
CLIENT_ORIGIN=http://localhost:5173
FLASK_APP=flask_app.app

OPENAI_API_KEY=****
```

3. **Backend Dependencies**

```bash
# Create virtual environment (if not exists)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

4. **Database Setup & Flask start**

```bash
# Start PostgreSQL container
docker-compose up --build

# Run Flask app
flask run
```

5. run database migration

```bash
# Wait for database to be ready, then run migrations
flask db upgrade
```

6. **Frontend Dependencies and start**

```bash
cd ui/
npm install

# Start ui
npm run dev
```

## Database Schema

The application uses the following main tables:

- **user** - User accounts and authentication
- **card** - Credit/debit cards linked to users
- **pdf_extractable** - PDF statements uploaded by users
- **transaction** - Individual transactions from statements

### Database Migrations

This project uses Flask-Migrate for database versioning:

- **Migration files**: `flask_app/migrations/versions/`
- **Configuration**: Automatically configured in `flask_app/app.py`
- **Commands**: Standard Flask-Migrate commands work as expected

For new developers:

1. After cloning, run `flask db upgrade` to create tables
2. When you modify models, run `flask db migrate -m "description"`
3. Apply changes with `flask db upgrade`

### Running the Application

1. **Start Database**

```bash
docker-compose up -d
```

2. **Start Backend**

```bash
# Activate virtual environment
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run Flask server
flask run
# Server will run at http://localhost:5000
```

3. **Start Frontend**

```bash
cd ui/
npm run dev
# Frontend will run at http://localhost:5173
```

Access the application at `http://localhost:5173`

## Auth API Endpoints

| Endpoint   | Method | Description              |
| ---------- | ------ | ------------------------ |
| /register  | POST   | User registration        |
| /login     | POST   | User login               |
| /refresh   | POST   | Refresh access token     |
| /protected | GET    | Test authenticated route |

## Team Development Guidelines

### Working with Database Migrations

**⚠️ IMPORTANT: Always run migrations after pulling changes!**

#### After every `git pull`:

```bash
# Check for new migrations and apply them
flask db upgrade
```

#### When creating new migrations:

```bash
# 1. Pull latest changes first
git pull && flask db upgrade

# 2. Make your model changes in flask_app/models.py

# 3. Generate migration
flask db migrate -m "Descriptive message about changes"

# 4. Test the migration
flask db upgrade

# 5. Commit both model and migration files
git add flask_app/models.py flask_app/migrations/versions/[new-file].py
git commit -m "Your commit message"
git push
```

#### If you encounter migration conflicts:

```bash
# Check current state
flask db current
flask db history

# If multiple heads exist, merge them
flask db merge -m "Merge migration heads"
flask db upgrade
```

## Troubleshooting

**Database Connection Issues**

```bash
docker-compose logs db
```

**Enter Inside Postgres Container**

```
docker exec -it <container_id> bash
```

```
psql -U renda_user -d renda360
```

**Flask Migration Issues**

If you encounter migration problems:

```bash
# Check current migration state
flask db current

# Force database to latest migration state (only if tables exist)
flask db stamp head

# Create new migration (after model changes)
flask db migrate -m "description of changes"

# Apply migrations
flask db upgrade
```

**Database Reset** (if needed):

```bash
# Stop containers
docker-compose down

# Remove database volume (WARNING: destroys all data)
docker volume rm renda360_postgres_data

# Restart and migrate
docker-compose up -d
flask db upgrade
```

**JWT Errors**

- Verify `.env` JWT_SECRET_KEY
- Check token expiration times

# Unit Tests

This project includes unit tests for backend endpoints (Flask) and core logic. The tests help ensure your PDF upload, transaction processing, and other backend features work correctly.

## 🚀 Quick Start

### 1️⃣ Setup Test Environment

1. **Activate your Python virtual environment** (on root, check steps above):

2. **Install test dependencies:**:
   on /tests folder:

```bash
pip install -r requirements-test.txt
```

### 2️⃣ Running Tests

1. **Run all tests** (if not already):

```bash
python -m pytest tests/ -v
```

2. **Run specific test files** :

```bash
python -m pytest tests/test_auth.py -v
python -m pytest tests/test_statements.py -v
python -m pytest tests/test_user.py -v
```

📁 Project Test Structure
Renda360/
│
├── flask_app/
│ ├── routes/
│ ├── models.py
│ └── app.py
│
├── tests/
│ ├── **init**.py
│ ├── conftest.py # Test configuration & fixtures
│ ├── test_auth.py # Authentication endpoints
│ ├── test_statements.py # PDF upload & processing
│ └── test_user.py # User management endpoints
│
└── requirements-test.txt # Test dependencies
