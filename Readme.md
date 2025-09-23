# Renda360 - Setup

## System Overview

![image](https://github.com/user-attachments/assets/86b9125f-74b1-4588-a88e-9d052dac1c36)

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

OPENAI_API_KEY= 💩
```

3. **Backend Dependencies**

```bash
# Create virtual environment (if not exists)
python3 -m venv pyenv
source pyenv/bin/activate  # Windows: pyenv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

4. **Frontend Dependencies**

```bash
cd ui/
npm install
cd ..
```

5. **Database Setup**

```bash
# Start PostgreSQL container
docker-compose up -d

# Wait for database to be ready, then run migrations
flask db upgrade
```

**Note:** Migrations are located in `flask_app/migrations/` and are automatically configured.

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
source pyenv/bin/activate  # Windows: pyenv\Scripts\activate

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
