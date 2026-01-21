# Police Case Management System (PCMS) - Project Understanding

## 📋 Overview

**PCMS** is a comprehensive web-based Police Case Management System built with **CodeIgniter 4** (PHP backend) and **JavaScript/jQuery** (frontend). It manages the complete lifecycle of criminal cases from initial reporting to court submission.

## 🏗️ Technology Stack

### Backend
- **Framework**: CodeIgniter 4 (PHP 8.1+)
- **Database**: MySQL/MariaDB
- **Authentication**: JWT (Firebase PHP-JWT)
- **Architecture**: MVC Pattern with RESTful API

### Frontend
- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Library**: jQuery 3.6.0
- **UI Components**: SweetAlert2, Chart.js
- **Icons**: Font Awesome 6.4.0

## 👥 User Roles & Permissions

### 1. **Super Admin**
- Full system access
- User management
- Police centers management
- System settings & audit logs

### 2. **Admin (Station Admin)**
- Case review & approval
- Investigator assignment
- Center management for their station
- Dashboard & statistics

### 3. **OB Officer (Occurrence Book Officer)**
- Create new cases (OB Entry)
- Add persons (accused, accuser, witness)
- Submit cases for approval
- Custody management

### 4. **Investigator**
- Manage assigned cases
- Evidence collection & management
- Investigation notes & reports
- Add parties to cases
- Send cases to court

### 5. **Court User**
- View cases sent to court
- Court assignment management
- Court-related documentation

## 🔄 Case Workflow

```
1. OB Entry (OB Officer)
   ↓
2. Submit for Approval
   ↓
3. Review & Approve (Admin)
   ↓
4. Assign to Investigator
   ↓
5. Investigation (Investigator)
   ↓
6. Evidence Collection
   ↓
7. Send to Court (Investigator)
   ↓
8. Court Processing (Court User)
   ↓
9. Case Closure
```

## 📊 Database Structure

### Core Tables

#### **persons**
- Stores all individuals (accused, accuser, witness, other)
- Fields: `person_type`, names, DOB, gender, national_id, phone, email
- **Photo support**: `photo_path` (already implemented)
- Fingerprint support: `fingerprint_hash`, `fingerprint_data`
- Risk tracking: `is_repeat_offender`, `risk_level`

#### **cases**
- Central case table
- Fields: case_number, OB_number, incident details, crime_type, category
- Status: draft → submitted → approved → investigating → closed
- Court status: not_sent → sent_to_court → court_review

#### **case_parties**
- Links persons to cases
- Roles: `accuser`, `accused`, `witness`, `informant`
- Tracks statements and witness affiliations

#### **custody_records**
- Tracks persons in custody
- Status: in_custody, released, transferred, escaped, hospitalized
- Health tracking, time limits, alerts

#### **evidence**
- Evidence management with file storage
- **File versioning** (edit history)
- Chain of custody logging
- Encryption support

#### **investigation_notes**
- Investigation notes with edit tracking
- Linked to cases and persons

### Supporting Tables
- **categories**: Case categorization
- **audit_logs**: System audit trail
- **notifications**: User notifications
- **court_assignments**: Court workflow
- **police_centers**: Police stations/centers
- **users**: System users with roles

## 🎯 Key Features Already Implemented

### ✅ Case Management
- Create, submit, approve, assign cases
- Case status tracking
- Priority levels (low, medium, high, critical)
- Sensitive case flagging

### ✅ Person Management
- **Photo upload for all person types** (accused, accuser, witness)
- Fingerprint search capability
- Repeat offender tracking
- Risk level assessment
- Criminal history

### ✅ Evidence Management
- File upload with encryption
- **File versioning** (replace file, keep history)
- Preview & download
- Chain of custody logging
- Edit history tracking

### ✅ Custody Management
- Custody records
- Daily logs
- Health tracking
- Time limit alerts
- Movement logging

### ✅ Investigation Features
- Investigation notes with edit history
- Evidence collection
- Timeline tracking
- Reports generation
- Court submission

### ✅ Court Workflow
- Send cases to court
- Court assignments
- Court status tracking

### ✅ Categories System
- Case categorization
- Category-based filtering
- Visual indicators (colors, icons)

### ✅ Security Features
- JWT authentication
- Role-based access control
- Audit logging
- Digital signatures support

## 📁 Project Structure

```
pcms/
├── app/
│   ├── Controllers/
│   │   ├── Admin/          # Admin controllers
│   │   ├── Court/          # Court controllers
│   │   ├── Investigation/  # Investigation controllers
│   │   ├── OB/             # OB Officer controllers
│   │   ├── Reports/        # Report generation
│   │   └── Station/        # Station admin controllers
│   ├── Models/             # Database models
│   ├── Config/
│   │   └── Routes.php      # API routes
│   ├── Filters/            # Auth & security filters
│   └── Views/              # Server-side views (minimal)
├── public/
│   ├── dashboard.html      # Main SPA
│   ├── index.html          # Login page
│   ├── assets/
│   │   ├── js/
│   │   │   ├── config.js   # Configuration
│   │   │   ├── api.js      # API wrapper
│   │   │   ├── auth.js     # Authentication
│   │   │   ├── app.js      # Main app logic
│   │   │   ├── modals.js   # Modal dialogs
│   │   │   └── [feature].js # Feature-specific JS
│   │   └── css/            # Stylesheets
│   └── uploads/
│       ├── persons/        # Person photos
│       └── evidence/       # Evidence files
└── writable/
    ├── uploads/            # Temp uploads
    └── logs/               # Application logs
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### OB Officer Routes (`/ob`)
- `POST /ob/cases` - Create new case
- `POST /ob/persons` - Create person with photo
- `POST /ob/cases/{id}/parties` - Add party to case
- `POST /ob/custody` - Create custody record

### Investigation Routes (`/investigation`)
- `GET /investigation/cases` - Get assigned cases
- `POST /investigation/cases/{id}/parties` - Add party to case
- `POST /investigation/cases/{id}/evidence` - Add evidence
- `POST /investigation/cases/{id}/notes` - Add notes
- `POST /investigation/cases/{id}/send-to-court` - Send to court

### Station Admin Routes (`/station`)
- `GET /station/cases/pending` - Get pending cases
- `POST /station/cases/{id}/approve` - Approve case
- `POST /station/cases/{id}/assign` - Assign investigators

### Admin Routes (`/admin`)
- `GET /admin/users` - Get all users
- `POST /admin/users` - Create user
- `GET /admin/centers` - Get police centers
- `GET /admin/audit-logs` - Get audit logs

## 🎨 Frontend Architecture

### Single Page Application (SPA)
- Main file: `public/dashboard.html`
- Dynamic content loading via AJAX
- Role-based navigation
- Modal-based forms

### Key JavaScript Files
- **config.js**: API endpoints, constants
- **api.js**: API wrapper functions
- **auth.js**: Authentication handling
- **app.js**: Main application logic, page routing
- **modals.js**: Modal dialogs
- **case-details-modal.js**: Case details & party management
- **evidence-edit.js**: Evidence management
- **categories.js**: Category management

## 🚨 Current Issue Identified

### Photo Upload in OB Entry
**Problem**: OB officers cannot see photo upload field when creating cases in OB Entry page.

**Root Cause**: The `loadOBEntryPage()` function doesn't exist in `app.js`.

**Current State**:
- ✅ Backend supports photo upload (`PersonController.php` lines 62-102)
- ✅ Database has `photo_path` field in `persons` table
- ✅ Investigation view has party modal with photo upload (`case-details-modal.js`)
- ❌ OB Entry page is missing from frontend

**Where Photo Upload Works**:
1. ✅ Investigation view: Adding parties to **existing cases**
2. ❌ OB Entry: Creating **new cases** with parties (page doesn't exist)

## 💡 Data Flow Example

### Creating a Case with Accuser Photo

**Step 1: OB Officer Creates Case**
```javascript
POST /ob/cases
{
  "crime_type": "Theft",
  "incident_date": "2026-01-03 10:00:00",
  "incident_location": "Market",
  "incident_description": "...",
  "crime_category": "property"
}
// Returns: { case_id: 1 }
```

**Step 2: OB Officer Adds Accuser with Photo**
```javascript
POST /ob/persons
Content-Type: multipart/form-data

FormData:
- person_type: "accuser"
- first_name: "John"
- last_name: "Doe"
- photo: [File]
- case_id: 1
```

**Backend Processing**:
1. `PersonController::create()` receives request
2. Validates photo (size, type)
3. Saves to `writable/uploads/persons/` and `public/uploads/persons/`
4. Stores path in `persons.photo_path`
5. Links person to case via `case_parties` table
6. Returns person record

## 📊 Case Statuses

### Main Status Flow
1. **draft** - Initial creation
2. **submitted** - Submitted for approval
3. **approved** - Approved by admin
4. **assigned** - Assigned to investigator
5. **investigating** - Under investigation
6. **closed** - Case closed

### Court Status
1. **not_sent** - Not sent to court
2. **sent_to_court** - Sent to court
3. **court_review** - Under court review
4. **court_assigned_back** - Returned from court
5. **court_closed** - Closed by court

## 🔐 Security Features

1. **JWT Authentication**: Token-based auth with expiry
2. **Role-Based Access Control**: Route-level permissions
3. **Audit Logging**: All actions logged
4. **File Encryption**: Evidence can be encrypted
5. **Digital Signatures**: Support for signing documents
6. **SQL Injection Protection**: Prepared statements
7. **XSS Protection**: Input sanitization

## 📝 Key Observations

### Strengths
1. Well-structured MVC architecture
2. Comprehensive database design
3. Role-based access control
4. Evidence chain of custody
5. Audit trail implementation
6. Photo upload already working in backend

### Areas for Enhancement
1. ❌ Missing OB Entry page in frontend
2. ⚠️ Frontend is not componentized (large monolithic JS files)
3. ⚠️ No real-time notifications (only polling)
4. ⚠️ Limited frontend validation
5. ⚠️ No offline capability

### What Works Well
1. ✅ Backend API is complete and functional
2. ✅ Photo upload for persons (backend ready)
3. ✅ Evidence management with versioning
4. ✅ Investigation workflow
5. ✅ Court submission process
6. ✅ Custody management

## 🎯 Next Steps Recommendation

To fix the photo upload issue in OB Entry, you need to:

1. **Create `loadOBEntryPage()` function** in `app.js`
2. **Add form** with case details fields
3. **Add party management** with photo upload (similar to investigation modal)
4. **Submit workflow**: Create case → Add parties with photos → Submit for approval

This will enable OB officers to:
- Create cases with full details
- Add accusers/accused with photos during case creation
- See photo preview before submission
- Submit complete cases for approval

---

**Project Status**: Mature, production-ready system with comprehensive features. Missing only the OB Entry frontend interface.

**Last Updated**: January 3, 2026
