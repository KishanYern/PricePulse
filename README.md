# 📦 Price Tracker API

Track product prices on Amazon and eBay, store price history, and get email alerts when prices drop!

---

## 🚀 Features

- ✅ Track product prices by URL (Amazon, eBay)
- 📉 Store and query price history in PostgreSQL
- ⏱  Automatic hourly scraping using a scheduler
- 🔔 Email alerts when prices drop below a user-defined threshold
- 🧠 FastAPI backend with auto-generated Swagger documentation
- 🐳 Docker-ready for easy deployment
- 💡 Built using only free tools and services

---

## 🧰 Tech Stack

| Layer       | Tool                         |
|-------------|------------------------------|
| Backend API | FastAPI                      |
| Scraping    | `requests`, `BeautifulSoup`  |
| Database    | PostgreSQL (via Railway)     |
| Scheduler   | `APScheduler`                |
| Email       | Gmail SMTP (App Password)    |
| Hosting     | Railway                      |
| Docs        | FastAPI Swagger UI           |

---

## 📁 Project Structure

price-tracker-api/
├── app/
│   ├── main.py              # FastAPI app
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── scraper.py           # Scraper logic
│   ├── scheduler.py         # Hourly job logic
│   ├── routes/products.py   # REST API routes
│   └── utils/email.py       # Email alert sender
├── tests/                   # Test cases
├── requirements.txt
├── Dockerfile
├── .env
└── README.md

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/price-tracker-api.git
cd price-tracker-api
````

### 2. Create `.env` file

```
EMAIL_ADDRESS=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

> 📌 Use a Gmail App Password: [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Initialize the database

```python
from app.database import Base, engine
Base.metadata.create_all(bind=engine)
```

### 5. Run the API

```bash
uvicorn app.main:app --reload
```

Visit: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🐳 Run with Docker

```bash
docker build -t price-tracker .
docker run -p 8000:8000 --env-file .env price-tracker
```

---

## 🔁 Run Scheduler (price checker)

```bash
python -m app.scheduler
```

---

## 🧪 Run Tests

```bash
pytest
```

---

## 📦 API Endpoints

| Method | Endpoint                 | Description              |
| ------ | ------------------------ | ------------------------ |
| POST   | `/products`              | Start tracking a product |
| GET    | `/products/{id}`         | Get product info         |
| GET    | `/products/{id}/history` | View price history       |
| POST   | `/alerts`                | Create a price alert     |

