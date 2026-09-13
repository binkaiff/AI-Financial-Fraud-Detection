AI-Based Financial Fraud Detection System

A full-stack financial fraud monitoring and receipt-risk analysis platform built with React, FastAPI, MySQL, Tesseract OCR, and Machine Learning.

The system supports two clearly separated analysis workflows:

E-Receipt Risk Screening — users upload receipt images or PDFs, the system extracts transaction details using OCR, allows the user to review/edit the extracted data, performs explainable rule-based risk analysis, detects duplicate references, saves the transaction to MySQL, and surfaces medium/high-risk activity as alerts.

Legacy ML Fraud Prediction — a Logistic Regression model trained on the public Credit Card Fraud Detection dataset using the anonymized V1–V28 features. This model is retained as a separate machine-learning implementation and is not used to infer receipt risk.

Features

Authentication & Access Control

User registration and login

JWT-based authentication

Protected frontend routes

Role-based admin access

Admin dashboard with platform analytics

E-Receipt Processing

Upload JPG, JPEG, PNG, WEBP, or PDF receipts

Maximum upload size validation

Receipt preview

Tesseract OCR for image receipts

PyMuPDF support for PDF receipts

Automatic extraction of:

Amount

Currency

Transaction date

Transaction time

Transaction/reference ID

Transaction type

Receipt status

Source account

Beneficiary account

Beneficiary bank

Beneficiary remarks

Merchant/payee when explicitly available

Editable extracted fields before confirmation

Raw OCR text inspection

Receipt Risk Screening

Explainable risk score from 0–100

Low, Medium, and High risk levels

Duplicate transaction-reference detection

Missing-data checks

Receipt-status validation

Amount-based risk rules

Counterparty-information checks

Human-readable risk reasons

Receipt risk screening is rule-based and is intentionally kept separate from the legacy V1–V28 machine-learning model. A heuristic risk score is not presented as an ML fraud probability.

Transaction Monitoring

Save confirmed transactions to MySQL

Delete individual transactions with confirmation

Reset all transaction and receipt data for the signed-in user without deleting the account

Admin-only user deletion with automatic cleanup of that user's transactions, receipt records, and uploaded receipt files

Transaction history

Filtering by transaction type, merchant, location, status, risk level, and amount

Fraud & Risk Alerts page

Medium/high-risk receipt transactions appear in alerts

Legacy ML fraud predictions can also appear in the monitoring workflow

Machine Learning

Logistic Regression baseline

Credit Card Fraud Detection dataset

Class-weight balancing for the highly imbalanced dataset

Train/test split before scaler fitting to avoid data leakage

Standardization of Time and Amount

Backend prediction service

Risk levels derived from model fraud probability

Legacy ML route retained separately for testing/reference

Responsive UI

Desktop, tablet, and mobile layouts

Professional responsive navigation

Mobile hamburger menu

Responsive forms and cards

Horizontally scrollable data tables

Responsive receipt upload and analysis workflow

Tech Stack

Frontend

React

Vite

React Router

Axios

CSS

Backend

FastAPI

SQLAlchemy

Pydantic

JWT Authentication

Python Multipart

MySQL

OCR & Document Processing

Tesseract OCR

pytesseract

Pillow

PyMuPDF

Machine Learning

scikit-learn

pandas

NumPy

joblib

Logistic Regression

Project Structure

AI-Financial Fraud Detection/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin.py
│   │   │   ├── auth.py
│   │   │   ├── fraud.py
│   │   │   ├── receipts.py
│   │   │   └── transactions.py
│   │   ├── core/
│   │   │   ├── admin.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── ml/
│   │   │   ├── logistic_regression_model.joblib
│   │   │   └── scaler.joblib
│   │   ├── models/
│   │   │   ├── receipt.py
│   │   │   ├── transaction.py
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   └── receipt.py
│   │   ├── services/
│   │   │   ├── fraud_detection.py
│   │   │   ├── receipt_ocr.py
│   │   │   ├── receipt_parser.py
│   │   │   └── receipt_risk.py
│   │   └── main.py
│   ├── uploads/
│   │   └── receipts/
│   ├── create_admin.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateTransaction.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FraudAlerts.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PredictTransaction.jsx
│   │   │   ├── ReceiptUpload.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Transactions.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── ml model/
│   ├── data/
│   │   ├── raw/
│   │   └── processed/
│   ├── models/
│   ├── inspect_dataset.py
│   ├── prepare_data.py
│   ├── train_model.py
│   └── predict_sample.py
│
├── .gitignore
└── README.md

System Workflow

Main E-Receipt Workflow

Login
  ↓
Upload Receipt
  ↓
OCR / PDF Text Extraction
  ↓
Structured Field Parsing
  ↓
Review & Edit Extracted Details
  ↓
Confirm & Analyse
  ↓
Duplicate / Rule-Based Risk Checks
  ↓
Low / Medium / High Risk Result
  ↓
Save Transaction + Receipt Data to MySQL
  ↓
Fraud & Risk Alerts

Legacy ML Workflow

Credit Card Dataset
  ↓
Train/Test Split
  ↓
Scale Time + Amount
  ↓
Logistic Regression
  ↓
Fraud Probability
  ↓
Low / Medium / High ML Risk

The receipt workflow does not fabricate or derive V1–V28 values from receipts.

Database

The application uses MySQL.

Main tables:

users
transactions
receipts

users

Stores account and role information.

transactions

Stores the main transaction record, including:

transaction type

amount

merchant

location

device type

status

ML fraud probability when applicable

risk level

creation date

receipts

Stores receipt-specific information, including:

receipt ID

linked transaction ID

original filename

currency

reference number

transaction date/time

receipt status

source account

beneficiary account

beneficiary bank

beneficiary remarks

raw OCR text

receipt risk score

receipt risk level

API Overview

Authentication

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

Transactions

POST /api/transactions
POST /api/transactions/predict
GET  /api/transactions
GET  /api/transactions/analytics
GET  /api/transactions/alerts
DELETE /api/transactions/reset
DELETE /api/transactions/{transaction_id}

Receipt Processing

POST /api/receipts/upload
POST /api/receipts/{receipt_id}/extract-text
POST /api/receipts/{receipt_id}/extract-details
POST /api/receipts/{receipt_id}/confirm

Machine Learning

POST /api/fraud/predict

Admin

GET /api/admin/users
GET /api/admin/analytics
DELETE /api/admin/users/{user_id}

Interactive backend documentation is available at:

http://127.0.0.1:8000/docs

Installation

Prerequisites

Install:

Python 3

Node.js and npm

MySQL

Tesseract OCR

On macOS with Homebrew:

brew install mysql
brew install tesseract

Backend Setup

From the project root:

cd backend

Create a virtual environment if one does not already exist:

python3 -m venv venv

Activate it:

source venv/bin/activate

Install dependencies:

python -m pip install -r requirements.txt

Create the environment configuration in:

backend/.env

Configure the database and security values required by the backend.

Start MySQL and create the project database:

CREATE DATABASE ai_fraud_detection;

Run the backend:

python -m uvicorn app.main:app --reload

Backend:

http://127.0.0.1:8000

Health check:

http://127.0.0.1:8000/health

Swagger API documentation:

http://127.0.0.1:8000/docs

Frontend Setup

Open another terminal:

cd frontend

Install packages:

npm install

Run the development server:

npm run dev

Frontend:

http://localhost:5173

Production build:

npm run build

Machine-Learning Setup

The legacy ML implementation uses the Credit Card Fraud Detection dataset containing:

Time
V1 ... V28
Amount
Class

Place the dataset in the ML data directory according to the project structure.

Then activate the ML environment and run the preparation/training scripts as needed.

Example:

cd "ml model"
source venv/bin/activate
python prepare_data.py
python train_model.py

The trained model and scaler used by the backend are stored in:

backend/app/ml/logistic_regression_model.joblib
backend/app/ml/scaler.joblib

Receipt Risk Interpretation

Receipt analysis returns a score from 0 to 100.

Current categories:

Low Risk     < 35
Medium Risk  35–69
High Risk    ≥ 70

Example risk indicators include:

Duplicate transaction reference

Missing transaction reference

Missing receipt status

Unsuccessful/non-approved receipt status

Missing counterparty information

Missing transaction date/time

High transaction amount

These rules provide explainable screening signals and should not be interpreted as proof that a transaction is fraudulent.

Security Notes

Passwords should be securely hashed before storage.

Protected endpoints require JWT authentication.

Admin endpoints require an admin role.

Uploaded receipts are stored per user.

Receipt IDs are generated by the backend.

Upload formats and file sizes are validated.

Secrets and .env files must never be committed to Git.

Uploaded receipts should not be committed to Git.

Git Ignore Recommendations

The repository should ignore:

.env
.venv/
venv/
__pycache__/
*.pyc

frontend/node_modules/
frontend/dist/

backend/uploads/

ml model/data/raw/
ml model/data/processed/

*.joblib
!backend/app/ml/logistic_regression_model.joblib
!backend/app/ml/scaler.joblib

Important Technical Note

The project deliberately separates the two analysis methods:

Receipt Risk Screening

Uses OCR-extracted, real receipt fields and explainable validation/risk rules.

ML Fraud Prediction

Uses the anonymized V1–V28, Time, and Amount features from the Credit Card Fraud Detection dataset.

Because V1–V28 are anonymized PCA-derived features, they cannot be honestly reconstructed from merchant names, beneficiary information, receipt text, location, or device details. The application therefore does not fabricate these values.

Future Improvements

Possible future upgrades include:

Train a dedicated fraud model on structured real-world receipt/transaction features

User-behaviour profiling

Historical merchant/beneficiary anomaly detection

Amount deviation from each user's normal spending behaviour

OCR confidence scoring

More bank-specific receipt parsers

Receipt tampering/image-forensics detection

Email/SMS fraud notifications

Exportable fraud reports

Cloud storage for receipt files

Docker deployment

Automated test suite

CI/CD pipeline

Portfolio Summary

AI-Based Financial Fraud Detection System — Developed a full-stack financial-risk monitoring application using React, FastAPI, MySQL, OCR, and machine learning. Implemented secure JWT authentication, responsive dashboards, e-receipt image/PDF processing with Tesseract OCR, automatic transaction-field extraction, editable receipt verification, duplicate-reference detection, explainable receipt-risk scoring, fraud/risk alerts, admin analytics, and a separate Logistic Regression fraud-prediction pipeline trained on anonymized credit-card transaction features.

Disclaimer

This project is intended for educational and portfolio purposes.

Receipt risk scores and machine-learning predictions are decision-support signals only. They should not be treated as definitive evidence of fraud or used as the sole basis for financial decisions.