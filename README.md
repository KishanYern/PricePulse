# PricePulse

*Your personal price tracking assistant.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

PricePulse is a full-stack web application that allows you to track product prices from your favorite online stores. Simply add a product URL, and PricePulse will monitor it for you, keeping a history of its price changes. This way, you can make sure you're always getting the best deal.

## 🚀 Key Features

- **User Authentication:** Secure registration and login system.
- **Product Tracking:** Track products from Amazon and eBay by simply providing the product URL.
- **Price History:** View a detailed history of price changes for each tracked product.
- **User-Friendly Interface:** A clean and intuitive interface for managing your tracked products.

## 🛠️ Tech Stack

### Backend

| Tool | Description |
|---|---|
| **FastAPI** | A modern, fast (high-performance), web framework for building APIs with Python. |
| **SQLAlchemy** | The Python SQL toolkit and Object Relational Mapper. |
| **PostgreSQL** | A powerful, open source object-relational database system. |
| **Selenium** | An umbrella project for a range of tools and libraries that enable and support the automation of web browsers. |
| **uvicorn** | A lightning-fast ASGI server implementation. |
| **APScheduler** | A Python library for in-process task scheduling. |

### Frontend

| Tool | Description |
|---|---|
| **React** | A JavaScript library for building user interfaces. |
| **Vite** | A build tool that aims to provide a faster and leaner development experience for modern web projects. |
| **TypeScript** | A typed superset of JavaScript that compiles to plain JavaScript. |
| **Tailwind CSS** | A utility-first CSS framework for rapidly building custom designs. |
| **daisyUI** | A Tailwind CSS component library. |
| **axios** | A promise-based HTTP client for the browser and Node.js. |
| **React Router** | A standard library for routing in React. |

## 🏁 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd PricePulse
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
    Create a `.env` file in the `backend` directory and add the following environment variables:
    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    SECRET_KEY="your-secret-key"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

3.  **Frontend Setup:**
    ```bash
    cd frontend
    npm install
    ```

## 🏃‍♀️ Usage

1.  **Run the backend server:**
    From the `backend` directory, run:
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will be running on `http://localhost:8000`.

2.  **Run the frontend development server:**
    From the `frontend` directory, run:
    ```bash
    npm run dev
    ```
    The frontend will be running on `http://localhost:5173`.

## 🕒 Scheduled Tasks

PricePulse includes a background task that automatically updates the prices of all tracked products every 6 hours. This ensures that the price data stays current without requiring manual intervention. The scheduler is automatically started when you run the backend server.

## 🗺️ Roadmap

- [ ] **Email Notifications:** Implement a system to send email alerts to users when a product's price drops below a certain threshold.
- [x] **Scheduled Scraping:** Add a scheduler to automatically check for price updates at regular intervals.
- [ ] **Docker Support:** Create a `Dockerfile` for easier deployment.
- [ ] **More Retailers:** Add support for more online retailers.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
