# Rental Management System (Odoo GCET Hackathon'26)

A comprehensive **Rental Management System** built for the **Odoo GCET Hackathon'26** (24-hour offline hackathon). This solution digitizes the rental lifecycle, enabling businesses to manage products, quotations, orders, inventory, invoicing, and returns efficiently.

## 🚀 Problem Statement Overview

The goal was to build a system that enables businesses to rent products online while managing the complete rental lifecycle. The platform supports **Customers, Vendors, and Admins** to handle browsing, ordering, reservations, payments, invoicing, pickups, returns, and reporting.

### Objectives Achieved
*   ✅ Implemented an end-to-end rental flow
*   ✅ Reservation logic to prevent overbooking
*   ✅ Flexible rental durations (Hourly, Daily, Weekly)
*   ✅ Invoice generation with partial/full payments
*   ✅ Business intelligence dashboards

---

## 🛠️ Tech Stack

This project was built using a modern full-stack approach:

### Core Frameworks
*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Language:** JavaScript (Node.js)
*   **Database:** [PostgreSQL](https://www.postgresql.org/)
*   **ORM:** [Prisma](https://www.prisma.io/) (Schema modeling, migrations, type safety)

### Frontend & UI
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **Icons:** [Lucide React](https://lucide.dev/)

### Backend & Services
*   **Authentication:** Custom JWT Auth (`jsonwebtoken`, `bcryptjs`)
*   **Payment Gateway:** [Razorpay](https://razorpay.com/)
*   **Image Storage:** [Cloudinary](https://cloudinary.com/)
*   **Email Services:** [Nodemailer](https://nodemailer.com/)
*   **PDF Generation:** `jsPDF` & `jspdf-autotable` (for Invoices & Reports)
*   **Data Visualization:** `Chart.js` & `react-chartjs-2`

---

## 🌟 Key Features

### 1. User Roles & Access Control
*   **Customer (End User):** Browse products, request quotations, confirm orders, make payments, track history.
*   **Vendor (Internal):** Manage inventory, process rental orders, track earnings, handle pickups/returns.
*   **Admin (Super User):** Complete system oversight, user management, global analytics (Settings, Reports).

### 2. End-to-End Rental Flow
1.  **Quotation:** Customers add items to cart, creating a preliminary price proposal.
2.  **Order Confirmation:** Quotation becomes a confirmed rental order upon validation.
3.  **Reservation:** Stock is automatically reserved, blocking dates to prevent double-booking.
4.  **Invoicing:** Automated invoice generation supporting security deposits and full payments.

### 3. Operational Workflows
*   **Product Management:** Configurable pricing, stock levels, and attributes (Brand, Color).
*   **Pickup & Return:** 
    *   Pickup moves stock to "With Customer".
    *   Return restores stock and calculates any late fees automatically.
*   **Notifications:** Automated alerts for returns and payments.

### 4. Financials & Reporting
*   **Payments:** Secure online payments via Razorpay integration.
*   **Invoicing:** Downloadable PDF invoices.
*   **Dashboards:**
    *   *Total Revenue*, *Most Rented Products*, *Vendor Performance*.
    *   Exportable reports (PDF/CSV) with date-range filters.

---

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd my-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory (refer to `.env.example` if available) and add:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
    
    # Auth
    JWT_SECRET="your-secure-jwt-secret"
    
    # Cloudinary (Image Uploads)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
    NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
    CLOUDINARY_API_SECRET="your-api-secret"

    # Razorpay (Payments)
    NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key-id"
    RAZORPAY_KEY_SECRET="your-razorpay-key-secret"

    # Nodemailer (Emails)
    EMAIL_USER="your-email@example.com"
    EMAIL_PASS="your-email-password"
    ```

4.  **Run Database Migrations:**
    ```bash
    npx prisma migrate dev --name init
    ```

5.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

6.  **Access the Application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Deliverables Checklist (Hackathon)

| Feature | Status |
| :--- | :---: |
| **Functional Rental Flow** (Quotation → Order → Invoice → Return) | ✅ |
| **Website + Backend Integration** | ✅ |
| **Role-Based Access (Admin/Vendor/Customer)** | ✅ |
| **Analytic Dashboards & Reports** | ✅ |
| **Clean UI / UX** | ✅ |
| **Prevent Overbooking Logic** | ✅ |

---

## 🧠 Learning Outcomes

By completing this challenge, we successfully:
*   Modeled a complex real-world **Rental Business** logic including time-based pricing.
*   Implemented **Role-Based Access Control (RBAC)** across a Next.js Full Stack app.
*   Mastered **Prisma Schema Design** for complex relationships (Orders, Invoices, Variants).
*   Integrated multiple 3rd party services for **Payments**, **Media**, and **Communications**.
