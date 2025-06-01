# Renda360 - Setup

## System Overview

![image](https://github.com/user-attachments/assets/86b9125f-74b1-4588-a88e-9d052dac1c36)

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

### Installation

1. **Frontend Dependencies**

```bash
cd ui/
npm install
```

2. **Backend Dependencies**

```bash
source pyenv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration

1. **Environment Variables**
   Create `.env` in project root:

```env
# Database
POSTGRES_DB=renda360
POSTGRES_USER=renda_user
POSTGRES_PASSWORD=strongpassword123

# Flask
JWT_SECRET_KEY=your-super-secret-key
CLIENT_ORIGIN=http://localhost:3000
```

2. **Database Setup**

```bash
docker-compose up --build
```

3. **Run Migrations**

```bash
flask db upgrade
```

### Running the Application

1. **Start Database**

```bash
docker-compose up -d db
```

2. **Start Backend**

```bashcd backend
source venv/bin/activate
flask run
```

3. **Start Frontend**

```bash
cd ui/
npm run dev
```

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

**Flask Migration Problems**

```bash
flask db stamp head
flask db migrate
flask db upgrade
```

**JWT Errors**

- Verify `.env` JWT_SECRET_KEY
- Check token expiration times
