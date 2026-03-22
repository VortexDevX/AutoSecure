# AutoSecure - Project Context & Documentation

This document serves as the primary source of truth for the AutoSecure application. It outlines the technology stack, application architecture, database schemas, authentication flow, external integrations, and business logic calculations.

---

## 1. System Architecture & Tech Stack

AutoSecure is built as a decoupled Client-Server architecture, previously wrapped in Electron but now functioning as a standard modern Web App.

### Frontend
*   **Framework**: [Next.js](https://nextjs.org/) (App Router).
*   **Language**: TypeScript.
*   **Styling**: Tailwind CSS (v3). Components utilize headless primitives (`@headlessui/react`) and conditional joining (`clsx`, `tailwind-merge`).
*   **Data Fetching**: `axios` for standard REST API requests. SWR (`useSWR`) is strictly used across dashboards (`usePolicies`, `useAnalytics`, etc.) for stale-while-revalidate client-side caching and pagination. 
*   **Forms & Validation**: `react-hook-form` paired with `zod` schema definitions.
*   **State & Notifications**: Standard React hooks (`useState`, `useEffect`) and `react-hot-toast` for global push notifications.

### Backend
*   **Framework**: Express.js (Node.js).
*   **Language**: TypeScript.
*   **Database**: MongoDB via Mongoose ODM.
*   **Security**: `helmet`, `cors`, and bounded `express-rate-limit` restrictions on auth endpoints. 
*   **Architecture Pattern**: Classic MVC structure (`routes` -> `controllers` -> `services` -> `models`), featuring dedicated `asyncHandler` middleware to dry up try/catch blocks.

---

## 2. Authentication & Authorization

Authentication is multifaceted, employing traditional credentials alongside Multi-Factor Authentication (MFA) and granular permissions.

### Authentication Flow
1.  **Login**: User posts `email` and `password`. Validating bcrypt hashes yields a temporary JWT (or proceeds if no OTP setup is demanded).
2.  **MFA / TOTP**: Users are enforced to use Time-based One-Time Passwords (via Google Authenticator / Authy using `speakeasy`). A successful TOTP verification yields the final robust JWT.
3.  **Password Reset**: A native flow where users request a 6-digit OTP sent via email (valid for 15 minutes). Verifying it allows a password reset. These fallback attempts are logged and tracked inside the `User` document.
4.  **JWT Handling**: Sent back as a Bearer token in the Authorization header. On the frontend, `apiClient` automatically injects this into outgoing API headers and forces a logout (clearing localStorage) on `401 Unauthorized`.

### Roles & Permissions
*   **owner**: Maximum clearance. Can manage branches, global meta tags, update system-wide configurations, and delete policies/licenses.
*   **admin**: Elevated clearance similar to owner but restricted on systemic application configuration.
*   **agent**: Standard user restricted to fetching and creating context relative to their assigned permissions and branches. Cannot delete records natively.

---

## 3. Core Database Entities

### A. User (`models/User.ts`)
Stores personnel accessing the system.
*   **Key Fields**: `full_name`, `email`, `password_hash`, `role`, `totp_secret`, `totp_enabled`, `reset_password_otp`, `branch_id`.

### B. Policy (`models/Policy.ts`)
A massive entity tracking auto insurance details for a customer.
*   **Vehicle Data**: `registration_number`, `engine_no`, `chassis_no`, `mfg_date`, `fuel_type`, `model_name`.
*   **Customer Data**: `customer` (name), `mobile_no`, `email`, `pan_no`.
*   **Premium Logic**: `premium_amount`, `od_premium`, `net_premium`, `agent_commission`.
*   **Status**: `ins_status` (`policy_pending`, `policy_done`), `customer_payment_status` (`pending`, `done`).
*   **Dates**: `issue_date`, `start_date`, `end_date`, `saod_end_date` (which often overrides `end_date` for expiration alerts).
*   **Files**: Arrays mapping to nested `IDriveFile` objects pointing to R2 Storage keys.

### C. LicenseRecord (`models/LicenseRecord.ts`)
Tracks licensing services provided to customers.
*   **Core**: `lic_no`, `customer_name`, `mobile_no`, `aadhar_no`.
*   **Logistics**: `expiry_date` (critically indexed), `approved` (boolean check).
*   **Financials**: `fee`, `agent_fee`, `customer_payment`, `profit`.
*   **Process**: `faceless_type` (`faceless`, `non-faceless`, `reminder`).

### D. Meta / Configs
*   `Meta`: Dropdown configurations. Values dynamically populating the UI like (Vehicle Manufacturers, Payment types, Insurer Companies).
*   `AuditLog`: Tracks all `CREATE`/`UPDATE`/`DELETE` mutations across the system by Users for accountability.

---

## 4. Mathematical Calculations (Formulas)

To reduce human error, specific financial values are automatically parsed during MongoDB Pre-Save hooks or API Controllers.

### 1. Policy Profit Calculation
In `PolicySchema.pre('save', ...)` and `findOneAndUpdate`:
*   `extra_amount` = `company_amount` - `premium_amount`
*   `profit` = `agent_commission` - `extra_amount`

*(If `company_amount` is 20000, `premium_amount` is 18000, and `agent_commission` is 3000 -> `extra_amount` is 2000, and `profit` becomes 1000).*

### 2. License Profit Calculation
In `LicenseRecordSchema.pre('save', ...)`:
*   `profit` = `customer_payment` - `fee` - `agent_fee`

### 3. Dashboard Analytics (`analyticsController.ts`)
Aggregate pipelines compute real-time metrics summarizing the running month vs last month.
*   **Gross Total**: `$sum` of `premium_amount` for all policies.
*   **Net Total**: `$sum` of `net_premium` for all policies.
*   **Payment Pending**: Counts documents where `customer_payment_status: 'pending'`.

---

## 5. Third-Party Integrations

### A. Cloudflare R2 (S3-Compatible Object Storage)
AutoSecure utilizes Cloudflare R2 as its file storage engine (for cost efficiency over AWS S3).
*   **Libraries**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.
*   **Uploads**: `multer` intercepts incoming form files (`adh_file`, `pan_file`, `documents[]`). `FileStorageService` uploads buffers to the bucket using `PutObjectCommand`.
*   **Retrieval**: The DB only stores the `file_id` (R2 URI key). When users query a file, the API dynamically generates a short-lived **Pre-signed URL** using `getSignedUrl`. The frontend then streams or downloads this URL. This ensures secure, zero-footprint transfers.

### B. Email Delivery Service (Brevo / Nodemailer)
*   **Libraries**: `nodemailer`
*   **Setup**: Authenticated via SMTP credentials mapped in the `.env` file (e.g., Brevo/SendGrid).
*   **Triggers**:
    *   *Password Resets*: Dispatches a branded HTML email containing a 6-digit OTP code requested by stranded users.
    *   *Policy Documents*: Users can select a Policy on the UI and click "Email". The API uses the stored email addresses and physically attaches the signed URL downloads of Adhaar, PAN, and specific other policy documents directly into the resulting email.

---

## 6. Execution Efficiency & Optimizations

*   **Database**: Extensive use of Mongoose `.lean()` on massive aggregation queues (`getPolicies`, `getLicenses`). By bypassing Mongoose's Document hydration logic, JSON delivery is approximately 3-5x faster.
*   **Indexing**: Critical path queries are highly indexed—notably `{ createdAt: -1 }`, `{ saod_end_date: -1 }`, and compound `{ customer: 'text', registration_number: 'text' }` endpoints to fulfill paginated dashboard requests.
*   **Compression**: The Express server utilizes standard API compression middleware alongside proper Cache-Control boundaries to keep payload sizes minimal.