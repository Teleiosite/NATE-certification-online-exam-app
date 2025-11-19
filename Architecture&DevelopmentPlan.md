# NSE ExamVibe Backend - Complete Architecture & Development Plan

## SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (React Frontend)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  LoginPage │ RegisterPage │ StudentDashboard │ InstructorDashboard │ Admin   │
│  TakeExam  │ ResultsPage  │ GradingPage      │ CreateExamPage      │ Panel   │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 │ HTTP/REST API
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY & LOAD BALANCING                            │
│                    (Nginx with Rate Limiting & CORS)                         │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│  Django REST API │  │ Health Checks    │
│  (Gunicorn)      │  │ Monitoring       │
│  Port: 8000      │  │                  │
└────────┬─────────┘  └──────────────────┘
         │
    ┌────┴─────┬──────────┬──────────┬──────────┐
    ▼          ▼          ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Auth   │ │ Exams  │ │ Subm.  │ │ Security │ │ Admin  │
│ Apps   │ │ App    │ │ App    │ │ App   │ │ App    │
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
              │
         ┌────▼────┐
         ▼         ▼
    ┌─────────────────────┐
    │  ORM Layer          │
    │  (Django Models)    │
    └─────────────────────┘
         │
    ┌────┴─────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌──────────────────────────┐    ┌──────────────────────┐
│   PostgreSQL Database    │    │  Redis Cache Layer   │
│  (Primary Data Store)    │    │  (Sessions, Queues)  │
│                          │    │                      │
│ - Users                  │    │ - Cached Questions   │
│ - Exams                  │    │ - Cached Specs       │
│ - Questions              │    │ - Session Data       │
│ - Submissions            │    │ - Task Queues        │
│ - Responses              │    └──────────────────────┘
│ - Proctoring Data        │
│ - Audit Logs             │
└──────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │                              │
    ▼                              ▼
┌──────────────────────┐   ┌──────────────────────┐
│  Celery Worker       │   │  Celery Beat         │
│  (Background Tasks)  │   │  (Task Scheduler)    │
│                      │   │                      │
│ - Auto-grading       │   │ - Check timeouts     │
│ - Collusion detect   │   │ - Cleanup sessions   │
│ - Email notifications│   │ - Run analytics      │
│ - Report generation  │   │ - Proctoring scan    │
└──────────────────────┘   └──────────────────────┘
         │
         └────────────┬────────────────┐
                      ▼                ▼
              ┌──────────────┐  ┌──────────────┐
              │ Email Service│  │ File Storage │
              │ (SendGrid)   │  │ (AWS S3)     │
              └──────────────┘  └──────────────┘
```

---

## DETAILED APPLICATION ARCHITECTURE

```
Django Project Structure:
nse_examvibe/
├── nse_examvibe/               # Main Django project config
│   ├── settings.py             # Django settings
│   ├── urls.py                 # Root URL config
│   ├── wsgi.py                 # WSGI for production
│   ├── asgi.py                 # ASGI for WebSockets (future)
│   └── celery.py               # Celery configuration
│
├── accounts/                   # User management app
│   ├── models.py               # CustomUser, EngineeringSpecialization
│   ├── serializers.py          # UserSerializer, RegistrationSerializer
│   ├── views.py                # Auth endpoints (login, register, profile)
│   ├── urls.py                 # Auth routes
│   ├── permissions.py          # Custom permissions (IsStudent, IsInstructor)
│   ├── middleware.py           # Auth middleware, audit logging
│   └── admin.py                # Admin interface
│
├── exams/                      # Exam management app
│   ├── models.py               # Exam, Question, QuestionOption, QuestionBank
│   ├── serializers.py          # ExamSerializer, QuestionSerializer
│   ├── views.py                # ExamViewSet, QuestionViewSet
│   ├── managers.py             # Custom QuerySet managers
│   ├── urls.py                 # Exam routes
│   └── admin.py                # Admin interface
│
├── submissions/                # Student submissions & responses
│   ├── models.py               # ExamAssignment, StudentResponse
│   ├── serializers.py          # SubmissionSerializer, ResponseSerializer
│   ├── views.py                # SubmissionViewSet, ResponseViewSet
│   ├── services.py             # ExamAssignmentService, AnswerValidationService
│   ├── urls.py                 # Submission routes
│   └── admin.py                # Admin interface
│
├── grading/                    # Grading & analytics
│   ├── services.py             # GradingService, AnalyticsService
│   ├── views.py                # GradingViewSet, AnalyticsView
│   ├── serializers.py          # GradingSerializer, AnalyticsSerializer
│   ├── urls.py                 # Grading routes
│   └── admin.py                # Admin interface
│
├── security/                   # Proctoring & security monitoring
│   ├── models.py               # SuspiciousActivity, ProctoringRecord
│   ├── monitoring.py           # Proctoring logic, activity detection
│   ├── views.py                # SecurityViewSet
│   ├── serializers.py          # SecuritySerializer
│   ├── urls.py                 # Security routes
│   └── tasks.py                # Celery security tasks
│
├── admin_panel/                # Admin dashboard
│   ├── views.py                # AdminViewSet, DashboardView
│   ├── serializers.py          # AdminSerializer
│   ├── urls.py                 # Admin routes
│   └── permissions.py          # Admin-only permissions
│
├── core/                       # Shared utilities
│   ├── signals.py              # Django signals (post_save, post_delete)
│   ├── tasks.py                # Celery background tasks
│   ├── middleware.py           # Custom middleware
│   ├── exceptions.py           # Custom exceptions
│   └── utils.py                # Helper functions
│
├── tests/                      # Test suite
│   ├── test_auth.py            # Auth tests
│   ├── test_exams.py           # Exam tests
│   ├── test_submissions.py     # Submission tests
│   ├── test_grading.py         # Grading tests
│   ├── test_security.py        # Security tests
│   └── test_api_integration.py # E2E tests
│
├── manage.py                   # Django management
├── requirements.txt            # Python dependencies
├── Dockerfile                  # Container image
├── docker-compose.yml          # Multi-container setup
├── nginx.conf                  # Web server config
└── .env.example                # Environment variables template
```

---

## DATA FLOW DIAGRAMS

### Student Exam Taking Flow

```
Student (Frontend)          Backend API              Database
    │                           │                        │
    ├─ Register ──────────────→ POST /register          │
    │                           ├─ Hash password         │
    │                           ├─ Create user ─────────→ users
    │                           └─ Return JWT tokens    │
    │                                                    │
    ├─ Login ──────────────────→ POST /login            │
    │                           ├─ Verify credentials    │
    │                           ├─ Generate tokens ──────│
    │                           └─ Return JWT            │
    │                                                    │
    ├─ View Exams ─────────────→ GET /exams?spec=ME    │
    │                           ├─ Filter by specialization
    │                           ├─ Query ──────────────→ exams
    │                           └─ Return list          │
    │                                                    │
    ├─ Start Exam ─────────────→ POST /start           │
    │                           ├─ Validate access      │
    │                           ├─ Generate seed ───────│
    │                           ├─ Create assignment ───→ exam_assignments
    │                           ├─ Randomize questions  │
    │                           └─ Return questions     │
    │                                                    │
    ├─ Submit Answer ──────────→ POST /submit-answer   │
    │                           ├─ Validate answer      │
    │                           ├─ Auto-grade ──────────│
    │  (Proctoring detects)     ├─ Log activity ─────→ suspicious_activities
    │  ├─ Tab switch            ├─ Save response ───────→ student_responses
    │  ├─ DevTools open         └─ Return auto_score   │
    │  ├─ Copy/Paste            (Frontend monitors all) │
    │  └─ Log to monitoring                             │
    │                                                    │
    ├─ Auto-Save ──────────────→ POST /auto-save       │
    │                           ├─ Batch update ────────→ student_responses
    │                           └─ Return success       │
    │                                                    │
    ├─ Submit Exam ────────────→ POST /submit          │
    │                           ├─ Calculate score      │
    │                           ├─ Update status ───────→ exam_assignments
    │  (Results calculated)     ├─ Trigger scoring     │
    │                           └─ Return results       │
    │                                                    │
    └─ View Results ───────────→ GET /results          │
                                ├─ Query responses ────→ student_responses
                                ├─ Format answers       │
                                └─ Return formatted     │
```

### Instructor Grading Flow

```
Instructor (Frontend)       Backend API            Database
    │                           │                      │
    ├─ View Submissions ───────→ GET /exams/<id>/subs │
    │                           ├─ Verify ownership    │
    │                           ├─ Query ───────────→ exam_assignments
    │                           └─ Return list         │
    │                                                  │
    ├─ View Submission Detail──→ GET /submission/<id>│
    │                           ├─ Get all responses   │
    │                           ├─ Query ────────────→ student_responses
    │                           └─ Return full detail  │
    │                                                  │
    ├─ Grade Essay ────────────→ PUT /response/<id>/grade
    │                           ├─ Validate score      │
    │                           ├─ Update response ──→ student_responses
    │                           └─ Return updated      │
    │                                                  │
    ├─ Finalize Grades ───────→ POST /finalize       │
    │                           ├─ Calculate finals    │
    │                           ├─ Update status ──→ exam_assignments
    │                           ├─ Trigger Celery:    │
    │                           │  ├─ Collusion detect│
    │                           │  └─ Email notify    │
    │                           └─ Return summary      │
    │                                                  │
    └─ View Analytics ────────→ GET /exams/<id>/analytics
                                ├─ Aggregate scores    │
                                ├─ Calculate stats ──→ (from responses)
                                └─ Return analytics    │
```

### Proctoring & Security Flow

```
Exam Session                  Frontend                  Backend
    │                             │                        │
    ├─ Start Exam                 │                        │
    │  ├─ Enable Proctoring ──────→ useProctoring hook    │
    │  └─ Start Monitoring        │   │                    │
    │                             │   ├─ Detect actions   │
    │                             │   │  (right-click,    │
    │                             │   │   DevTools, etc)  │
    │                             │   │                    │
    │                             │   └─ Log Activity ────→ POST /log-activity
    │                             │                        ├─ Create record ──→ suspicious_activities
    │                             │                        └─ Calculate score  │
    │                             │                                            │
    │                             │   (Every 30 sec)                           │
    │                             │   Auto-save ──────────→ POST /auto-save   │
    │                             │                        ├─ Save responses   │
    │                             │                        └─ Update timestamp │
    │                             │                                            │
    │  User closes tab            │                                            │
    │  ├─ Detect blur ────────────→ Log 'tab_switch'                          │
    │  └─ Warning shown           └─ POST /log-activity ─→ Log activity      │
    │                                                                          │
    │  Submit Exam                │                                            │
    │  └─ Auto-submit on timeout ─→ POST /submit ────────→ Finalize & score  │
    │                             │                        │                  │
    │                             │   (Backend Celery)    │                  │
    │                             │                        ├─ Detect rapid answers
    │                             │                        ├─ Detect collusion
    │                             │                        ├─ Calculate behavior score
    │                             │                        └─ Flag for review
    │                             │                                            │
    │  Instructor reviews         │                                            │
    │  └─ GET /suspicious-activities                      Query ────────────→ │
    │                             │                        (Review findings)   │
    │                             └─────────────────────────────────────────────
```

---

## API ENDPOINT STRUCTURE

```
BASE_URL: http://localhost:8000/api

AUTHENTICATION ENDPOINTS:
├── POST   /auth/register/              # Register new user
├── POST   /auth/login/                 # Login & get JWT tokens
├── POST   /auth/logout/                # Logout & invalidate token
├── POST   /auth/token/refresh/         # Refresh access token
├── GET    /auth/profile/               # Get current user profile
├── PUT    /auth/profile/               # Update user profile
├── GET    /auth/specializations/       # List all 17 specializations
└── GET    /auth/users/                 # List all users (ADMIN)

EXAM MANAGEMENT ENDPOINTS:
├── GET    /exams/                      # List exams (filtered by role)
├── POST   /exams/                      # Create exam (INSTRUCTOR)
├── GET    /exams/<id>/                 # Get exam details
├── PUT    /exams/<id>/                 # Update exam (INSTRUCTOR)
├── DELETE /exams/<id>/                 # Delete exam (INSTRUCTOR)
├── POST   /exams/<id>/publish/         # Publish exam (INSTRUCTOR)
├── POST   /exams/<id>/duplicate/       # Duplicate exam (INSTRUCTOR)
├── POST   /exams/<id>/questions/       # Add question (INSTRUCTOR)
├── PUT    /questions/<id>/             # Edit question (INSTRUCTOR)
├── DELETE /questions/<id>/             # Delete question (INSTRUCTOR)
├── POST   /exams/<id>/questions/reorder/ # Reorder questions (INSTRUCTOR)
├── GET    /exams/<id>/submissions/     # Get submissions (INSTRUCTOR)
├── GET    /exams/<id>/analytics/       # Get analytics (INSTRUCTOR)
└── GET    /exams/<id>/collusion-check/ # Collusion analysis (INSTRUCTOR)

STUDENT SUBMISSION ENDPOINTS:
├── POST   /exam-assignments/start/          # Start exam (STUDENT)
├── GET    /exam-assignments/<id>/           # Get assignment status (STUDENT)
├── GET    /exam-assignments/<id>/exam-data/ # Get questions (STUDENT)
├── POST   /exam-assignments/<id>/submit-answer/ # Submit answer (STUDENT)
├── POST   /exam-assignments/<id>/auto-save/    # Auto-save responses (STUDENT)
├── POST   /exam-assignments/<id>/submit/       # Submit exam (STUDENT)
├── GET    /exam-assignments/<id>/results/     # Get results (STUDENT)
└── POST   /exam-assignments/<id>/log-activity/ # Log proctoring (STUDENT)

GRADING ENDPOINTS:
├── GET    /exam-assignments/<id>/submission/ # Get full submission (INSTRUCTOR)
├── PUT    /student-responses/<id>/grade/     # Grade response (INSTRUCTOR)
├── POST   /exams/<id>/finalize-grades/       # Finalize all grades (INSTRUCTOR)
└── GET    /grading/submissions/              # List for grading (INSTRUCTOR)

SECURITY ENDPOINTS:
├── GET    /suspicious-activities/            # List activities (INSTRUCTOR)
├── GET    /suspicious-activities/<id>/       # Get activity details
├── POST   /suspicious-activities/<id>/mark-reviewed/ # Mark reviewed
└── POST   /suspicious-activities/<id>/invalidate/    # Invalidate submission

ADMIN ENDPOINTS:
├── GET    /admin/users/                      # List users (ADMIN)
├── POST   /admin/users/                      # Create user (ADMIN)
├── GET    /admin/users/<id>/                 # Get user details (ADMIN)
├── PUT    /admin/users/<id>/                 # Update user (ADMIN)
├── DELETE /admin/users/<id>/                 # Delete user (ADMIN)
├── GET    /admin/audit-logs/                 # View audit logs (ADMIN)
├── GET    /admin/stats/                      # Dashboard statistics (ADMIN)
└── GET    /admin/security-report/<exam_id>/  # Security report (ADMIN)

HEALTH & MONITORING:
├── GET    /health/                           # Health check
├── GET    /api/docs/                         # API documentation (Swagger)
└── GET    /api/schema/                       # OpenAPI schema
```

---

## DATABASE SCHEMA WITH RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Users & Auth                                 │
├─────────────────────────────────────────────────────────────────────┤
│  CustomUser                                                           │
│  ├── id (UUID PK)                                                    │
│  ├── email (unique)                          ┌──────────────────────┤
│  ├── password_hash                           │ EngineeringSpecialization
│  ├── first_name                              │ ├── id (UUID PK)
│  ├── last_name                               │ ├── name (17 options)
│  ├── role (enum: student/instructor/admin)   │ ├── code
│  ├── specialization_id (FK) ─────────────────→ └── description
│  ├── is_active                               └──────────────────────┤
│  └── created_at, updated_at                  │
│                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      Exam Management                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Exam                                                                │
│  ├── id (UUID PK)                                                    │
│  ├── title                                                           │
│  ├── description                                                     │
│  ├── instructor_id (FK) ──────────→ CustomUser                      │
│  ├── specialization_id (FK) ──────→ EngineeringSpecialization       │
│  ├── duration_minutes                                                │
│  ├── retake_limit                                                    │
│  ├── randomize_questions, randomize_answers                         │
│  ├── enable_proctoring, enable_camera                               │
│  ├── browser_lockdown                                                │
│  └── created_at, updated_at                                          │
│         │                                                            │
│         └─→ has_many: Question                                       │
│            │                                                         │
│            └─→ Question                                              │
│               ├── id (UUID PK)                                       │
│               ├── exam_id (FK) ──────→ Exam                         │
│               ├── question_text                                      │
│               ├── question_type (enum: MC, MS, SA, Essay)           │
│               ├── points                                             │
│               ├── explanation                                        │
│               ├── order_index                                        │
│               └── created_at, updated_at                            │
│                  │                                                   │
│                  └─→ has_many: QuestionOption                       │
│                     │                                                │
│                     └─→ QuestionOption                              │
│                        ├── id (UUID PK)                             │
│                        ├── question_id (FK)                         │
│                        ├── option_text                              │
│                        ├── is_correct                               │
│                        ├── partial_credit_points                    │
│                        └── order_index                              │
│                                                                      │
│  QuestionBank                                                        │
│  ├── id (UUID PK)                                                    │
│  ├── instructor_id (FK) ──────────→ CustomUser                      │
│  ├── specialization_id (FK) ──────→ EngineeringSpecialization       │
│  ├── name                                                            │
│  ├── description                                                     │
│  └── difficulty_level (enum: easy/medium/hard)                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  Student Submissions                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ExamAssignment                                                      │
│  ├── id (UUID PK)                                                    │
│  ├── exam_id (FK) ────────────────→ Exam                            │
│  ├── student_id (FK) ─────────────→ CustomUser                      │
│  ├── status (not_started/in_progress/submitted/graded)             │
│  ├── score                                                           │
│  ├── started_at, submitted_at                                        │
│  ├── question_randomization_seed                                     │
│  ├── time_taken_seconds                                              │
│  ├── retake_count                                                    │
│  └── created_at, updated_at                                          │
│         │                                                            │
│         └─→ has_many: StudentResponse                               │
│            │                                                         │
│            └─→ StudentResponse                                       │
│               ├── id (UUID PK)                                       │
│               ├── exam_assignment_id (FK)                           │
│               ├── question_id (FK) ────────→ Question               │
│               ├── student_id (FK)                                    │
│               ├── answer_text (for essays)                          │
│               ├── answer_options (JSON array)                       │
│               ├── is_flagged                                         │
│               ├── auto_score                                         │
│               ├── manual_score                                       │
│               ├── instructor_feedback                               │
│               └── created_at, updated_at                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                   Proctoring & Security                              │
├─────────────────────────────────────────────────────────────────────┤
│  SuspiciousActivity                                                  │
│  ├── id (UUID PK)                                                    │
│  ├── exam_assignment_id (FK) ──────→ ExamAssignment                │
│  ├── student_id (FK) ──────────────→ CustomUser                    │
│  ├── activity_type (enum: tab_switch, devtools_open, copy_attempt) │
│  ├── severity (enum: low/medium/high/critical)                      │
│  ├── metadata (JSON: IP, mouse_pos, keystroke_speed, etc)           │
│  ├── instructor_reviewed                                             │
│  ├── action_taken                                                    │
│  └── timestamp                                                       │
│                                                                      │
│  AuditLog                                                            │
│  ├── id (UUID PK)                                                    │
│  ├── user_id (FK) ────────────────→ CustomUser                      │
│  ├── action (registered, logged_in, created_exam, graded_response)  │
│  ├── entity_type (user, exam, response, etc)                        │
│  ├── entity_id (UUID)                                                │
│  ├── old_values, new_values (JSON)                                   │
│  ├── ip_address                                                      │
│  ├── user_agent                                                      │
│  └── timestamp                                                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## REQUEST/RESPONSE EXAMPLES

### Student Taking Exam

**Start Exam:**
```json
POST /api/exam-assignments/start/
{
  "exam_id": "uuid-exam-123",
  "password": null
}

Response: 201 Created
{
  "exam_assignment_id": "uuid-assignment-456",
  "exam": {
    "id": "uuid-exam-123",
    "title": "Thermodynamics & Fluid Mechanics",
    "duration_minutes": 60,
    "specialization": "Mechanical Engineering",
    "questions": [
      {
        "id": "uuid-q1",
        "text": "What is the first law of thermodynamics?",
        "question_type": "essay",
        "points": 15,
        "order_index": 0,
        "options": []
      },
      {
        "id": "uuid-q2",
        "text": "Which of the following are types of fluid flow?",
        "question_type": "multiple_select",
        "points": 10,
        "order_index": 1,
        "options": [
          {
            "id": "opt-1",
            "option_text": "Laminar",
            "is_correct": true
          },
          {
            "id": "opt-2",
            "option_text": "Turbulent",
            "is_correct": true
          },
          {
            "id": "opt-3",
            "option_text": "Static",
            "is_correct": false
          }
        ]
      }
    ],
    "time_remaining": 3600
  }
}
```

**Submit Answer:**
```json
POST /api/exam-assignments/uuid-assignment-456/submit-answer/
{
  "question_id": "uuid-q2",
  "answer_options": ["opt-1", "opt-2"],
  "is_flagged": false
}

Response: 200 OK
{
  "response_id": "uuid-resp-789",
  "auto_score": 10,
  "question_id": "uuid-q2",
  "is_answered": true,
  "message": "Answer saved successfully"
}
```

**Submit Exam:**
```json
POST /api/exam-assignments/uuid-assignment-456/submit/
{}

Response: 200 OK
{
  "exam_assignment_id": "uuid-assignment-456",
  "status": "submitted",
  "score": 25,
  "total_points": 25,
  "submitted_at": "2024-11-13T10:30:00Z",
  "results": {
    "percentage": 100,
    "grade": "A",
    "passing": true,
    "time_taken_seconds": 1200
  }
}
```

### Instructor Grading

**Get Submissions:**
```json
GET /api/exams/uuid-exam-123/submissions/?page=1&limit=20

Response: 200 OK
{
  "count": 5,
  "next": null,
  "results": [
    {
      "id": "uuid-assignment-456",
      "student": {
        "id": "uuid-student-1",
        "first_name": "Alex",
        "email": "student@exam.com"
      },
      "status": "submitted",
      "score": null,
      "submitted_at": "2024-11-13T10:30:00Z",
      "suspicious_activity_count": 2
    },
    {
      "id": "uuid-assignment-457",
      "student": {
        "id": "uuid-student-2",
        "first_name": "John",
        "email": "john@exam.com"
      },
      "status": "graded",
      "score": 22,
      "submitted_at": "2024-11-13T09:45:00Z",
      "suspicious_activity_count": 0
    }
  ]
}
```

**Grade Essay Response:**
```json
PUT /api/student-responses/uuid-resp-789/grade/
{
  "manual_score": 8,
  "instructor_feedback": "Good explanation but missing key concepts about entropy"
}

Response: 200 OK
{
  "id": "uuid-resp-789",
  "question": {
    "id": "uuid-q1",
    "text": "What is the first law of thermodynamics?",
    "points": 15
  },
  "student_answer": "Energy cannot be created or destroyed...",
  "auto_score": null,
  "manual_score": 8,
  "instructor_feedback": "Good explanation but missing key concepts about entropy",
  "is_answered": true
}
```

**Get Analytics:**
```json
GET /api/exams/uuid-exam-123/analytics/

Response: 200 OK
{
  "exam": {
    "id": "uuid-exam-123",
    "title": "Thermodynamics & Fluid Mechanics"
  },
  "statistics": {
    "total_submissions": 15,
    "average_score": 18.5,
    "highest_score": 25,
    "lowest_score": 12,
    "completion_rate": 0.85,
    "passing_rate": 0.73
  },
  "score_distribution": {
    "0-10%": 0,
    "10-20%": 3,
    "20-30%": 2,
    "30-40%": 1,
    "40-50%": 1,
    "50-60%": 2,
    "60-70%": 3,
    "70-80%": 1,
    "80-90%": 2,
    "90-100%": 0
  },
  "question_analysis": [
    {
      "question_id": "uuid-q1",
      "question_text": "What is the first law of thermodynamics?",
      "average_score": 12.3,
      "percentage_correct": 0.82,
      "discrimination_index": 0.75,
      "common_wrong_answers": [
        "Energy is always lost in systems",
        "Heat and temperature are the same"
      ]
    },
    {
      "question_id": "uuid-q2",
      "question_text": "Which of the following are types of fluid flow?",
      "average_score": 9.8,
      "percentage_correct": 0.87,
      "discrimination_index": 0.68
    }
  ],
  "flagged_submissions": [
    {
      "student": "Alex Johnson",
      "reason": "Suspected collusion with John Smith",
      "similarity_score": 0.92,
      "risk_level": "high"
    }
  ]
}
```

---

## MATCHING FRONTEND DATA STRUCTURES

### Frontend Types → Backend Response

**Frontend: Exam[]**
```typescript
// Frontend (App.tsx)
const mockExams: Exam[] = [
  {
    id: 'exam-1',
    title: 'Thermodynamics & Fluid Mechanics',
    durationMinutes: 60,
    retakeLimit: 1,
    instructorId: 'user-2',
    instructorName: 'Dr. Smith',
    department: EngineeringDepartment.Mechanical,
    questions: [...]
  }
]
```

**Backend Response: GET /api/exams/**
```json
{
  "count": 3,
  "results": [
    {
      "id": "uuid-exam-123",
      "title": "Thermodynamics & Fluid Mechanics",
      "duration_minutes": 60,
      "retake_limit": 1,
      "instructor": {
        "id": "uuid-user-2",
        "first_name": "Dr. Smith"
      },
      "specialization": "Mechanical Engineering",
      "question_count": 25,
      "created_at": "2024-11-01T00:00:00Z"
    }
  ]
}
```

**Frontend: StudentDashboard.tsx**
- Filters exams by `user.department`
- Expected endpoint: `GET /api/exams/?specialization=Mechanical%20Engineering`

**Frontend: TakeExam.tsx - responses**
```typescript
// Frontend stores responses as:
const [responses, setResponses] = useState<Responses>({
  'q1': 'It is for side effects.',
  'q2': ['q2o1', 'q2o3'],
  'q3': 'it batches updates'
});
```

**Backend: StudentResponse model**
```python
# Backend stores as:
StudentResponse(
  question_id='uuid-q1',
  answer_text='It is for side effects.',
  answer_options=[],
  auto_score=None  # Manual grading
)

StudentResponse(
  question_id='uuid-q2',
  answer_text=None,
  answer_options=['opt-1', 'opt-3'],  # JSON array
  auto_score=10  # Auto-graded
)
```

---

## AUTHENTICATION FLOW (Frontend → Backend)

```
Frontend Flow                          Backend Processing

1. User registers
   ├─ POST /api/auth/register/
   │  Body: {
   │    email: "alex@exam.com",
   │    password: "SecurePass123",
   │    first_name: "Alex",
   │    role: "student",
   │    specialization: "Mechanical Engineering"
   │  }
   │
   └─ Backend:
      ├─ Validate input (Joi/Yup equivalent)
      ├─ Hash password (bcrypt, salt=12)
      ├─ Create CustomUser record
      ├─ Create EngineeringSpecialization FK
      └─ Return: {user, access_token, refresh_token}

2. Frontend stores token
   └─ localStorage.setItem('nse_token', token)

3. All subsequent requests
   ├─ Include header: Authorization: Bearer {token}
   │
   └─ Backend JWT middleware:
      ├─ Decode JWT
      ├─ Verify signature
      ├─ Get user from database
      ├─ Attach user to request
      └─ Continue to view

4. Token expires (24 hours)
   ├─ Frontend detects 401 Unauthorized
   │
   └─ Refresh token:
      ├─ POST /api/auth/token/refresh/
      │  Body: {refresh_token}
      │
      └─ Backend:
         ├─ Verify refresh token valid
         ├─ Generate new access_token
         └─ Return {access_token}
```

---

## ROLE-BASED ACCESS CONTROL

```
                    ┌─────────────────────────────────┐
                    │      Endpoint Access Matrix      │
                    └─────────────────────────────────┘

Endpoint                    Student    Instructor    Admin
─────────────────────────────────────────────────────────
GET /auth/profile/            ✅          ✅          ✅
GET /auth/specializations/    ✅          ✅          ✅
GET /auth/users/              ❌          ❌          ✅

GET /exams/                   ✅*         ✅**        ✅
(* filtered by specialization, ** own exams only)
POST /exams/                  ❌          ✅          ✅
PUT /exams/<id>/              ❌          ✅***       ✅
DELETE /exams/<id>/           ❌          ✅***       ✅
(*** if instructor owns exam)

POST /exam-assignments/start/ ✅          ❌          ❌
GET /exam-assignments/<id>/   ✅****      ❌          ❌
(*** if student owns assignment)
POST /submit-answer/          ✅****      ❌          ❌
POST /submit/                 ✅****      ❌          ❌

GET /submissions/             ❌          ✅*****     ✅
PUT /student-responses/<id>/grade/ ❌    ✅*****     ✅
(*** if instructor owns exam)

GET /admin/users/             ❌          ❌          ✅
POST /admin/users/            ❌          ❌          ✅
GET /admin/audit-logs/        ❌          ❌          ✅
```

---

## PROCTORING INTEGRATION FLOW

```
Frontend (Browser)                 Backend (REST API)
     │
     ├─ useProctoring hook enabled
     │  ├─ Detect right-click ────────→ POST /log-activity
     │  ├─ Detect DevTools ──────────→ {activity_type: 'devtools_open'}
     │  ├─ Detect copy/paste ────────→ Backend logs to SuspiciousActivity
     │  ├─ Detect tab blur ──────────→ Creates audit trail
     │  ├─ Monitor mouse position ───→
     │  └─ Monitor keyboard speed ───→
     │
     ├─ Every 30 seconds
     │  └─ Auto-save responses ──────→ POST /auto-save
     │     └─ Update last_activity timestamp
     │
     ├─ Timer countdown
     │  └─ Server-side authority ────→ Backend auto-submits if time expires
     │     (Celery task: check_exam_timeouts)
     │
     └─ On exam submit
        └─ Trigger backend analysis ──→ Celery tasks:
           ├─ detect_rapid_answers()
           ├─ detect_collusion()
           ├─ calculate_behavior_score()
           └─ flag_suspicious_submissions()

SuspiciousActivity Recording:
┌─────────────────────────────────────────────┐
│ Activity      │ Severity │ Auto-Action       │
├─────────────────────────────────────────────┤
│ Tab blur x5   │ medium   │ Show warning      │
│ DevTools open │ high     │ Flag for review   │
│ Copy/Paste x3 │ high     │ Flag for review   │
│ IP change     │ critical │ Flag for review   │
│ Rapid answers │ medium   │ Log pattern       │
│ Collusion     │ critical │ Flag both, manual │
└─────────────────────────────────────────────┘
```

---

## CELERY TASK SCHEDULING

```
Periodic Tasks (via celery-beat):

┌─ Every 1 minute
│  └─ check_exam_timeouts()
│     ├─ Find in_progress assignments
│     ├─ Check duration exceeded
│     └─ Auto-submit if time up
│
├─ Every 5 minutes (after exam submission)
│  └─ run_collusion_detection(exam_id)
│     ├─ Compare all submissions
│     ├─ Calculate answer similarity
│     └─ Flag suspicious pairs
│
├─ Every hour
│  └─ generate_analytics_reports()
│     ├─ Calculate statistics
│     └─ Cache for fast retrieval
│
├─ Daily at 2 AM
│  └─ cleanup_old_sessions()
│     ├─ Delete expired sessions
│     └─ Archive old proctoring data
│
└─ On-demand tasks:
   ├─ send_grade_notification(exam_assignment_id)
   │  └─ Email student when grades released
   │
   ├─ generate_security_report(exam_id)
   │  └─ Compile all security data
   │
   └─ export_exam_data(exam_id)
      └─ Create downloadable CSV/PDF
```

---

## CACHING STRATEGY

```
Redis Cache Layers:

┌─ Question Cache (1 hour TTL)
│  └─ Key: exam:{exam_id}:questions
│     └─ Store: Serialized questions with options
│     └─ Hit: 80% of question requests
│
├─ Specialization Cache (24 hour TTL)
│  └─ Key: specializations:all
│     └─ Store: All 17 engineering specializations
│     └─ Never invalidates (static data)
│
├─ User Permission Cache (session TTL)
│  └─ Key: user:{user_id}:permissions
│     └─ Store: Student exams, instructor exams
│     └─ Invalidate: On exam assignment
│
├─ Session Cache (session TTL)
│  └─ Key: session:{exam_assignment_id}
│     └─ Store: In-progress responses, time_remaining
│     └─ Hit: Auto-save operations
│
├─ Analytics Cache (1 hour TTL)
│  └─ Key: analytics:{exam_id}
│     └─ Store: Aggregated statistics
│     └─ Regenerate: After grading finalized
│
└─ Rate Limit Cache (15 min TTL)
   └─ Key: ratelimit:{user_id}:{endpoint}
      └─ Store: Request count
      └─ Enforce: 5 login attempts per 15 min
```

---

## ERROR HANDLING & STATUS CODES

```
Frontend Error Handling Chain:

Try-Catch
    │
    ├─ Network Error
    │  └─ Show toast: "Connection lost, retrying..."
    │  └─ Auto-retry every 5 seconds
    │
    ├─ API Response Error
    │  │
    │  ├─ 400 Bad Request
    │  │  └─ Validation error
    │  │  └─ Show: Field-level errors
    │  │  └─ Example: "Email already exists"
    │  │
    │  ├─ 401 Unauthorized
    │  │  └─ Token expired/invalid
    │  │  └─ Action: Try refresh token
    │  │  └─ If fails: Redirect to login
    │  │
    │  ├─ 403 Forbidden
    │  │  └─ User lacks permission
    │  │  └─ Show: "You don't have access to this resource"
    │  │  └─ Example: Student trying to grade
    │  │
    │  ├─ 404 Not Found
    │  │  └─ Resource deleted or invalid ID
    │  │  └─ Show: "Resource not found"
    │  │
    │  ├─ 409 Conflict
    │  │  └─ Resource state conflict
    │  │  └─ Show: "Exam already submitted"
    │  │
    │  ├─ 422 Unprocessable Entity
    │  │  └─ Semantic validation failed
    │  │  └─ Show: "Exam must have at least 1 question"
    │  │
    │  ├─ 429 Too Many Requests
    │  │  └─ Rate limited
    │  │  └─ Show: "Too many attempts. Try again in 15 min"
    │  │
    │  └─ 500 Server Error
    │     └─ Backend error
    │     └─ Show: "An error occurred. Please try again"
    │     └─ Log to error tracking (Sentry)
    │
    └─ Handle & Log
       └─ Display user-friendly message
       └─ Log error details for debugging
```

---

## CODE ORGANIZATION BY FRONTEND COMPONENT

### LoginPage.tsx
**Backend Endpoints Used:**
- `POST /api/auth/login/` - Authenticate user
- `GET /api/auth/specializations/` - Populate dropdown (optional)

**Expected Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "student@exam.com",
    "first_name": "Alex",
    "role": "student",
    "specialization": "Mechanical Engineering"
  },
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### StudentDashboard.tsx
**Backend Endpoints Used:**
- `GET /api/exams/?specialization=Mechanical%20Engineering` - List available exams
- `GET /api/exam-assignments/<id>/results/` - View past results

**Expected Data Flow:**
```
Get all exams → Filter by user.specialization → Display with status
```

### CreateExamPage.tsx
**Backend Endpoints Used:**
- `POST /api/exams/` - Create exam
- `POST /api/exams/<id>/questions/` - Add questions
- `PUT /api/questions/<id>/` - Edit question
- `DELETE /api/questions/<id>/` - Delete question
- `POST /api/exams/<id>/questions/reorder/` - Reorder questions
- `POST /api/exams/<id>/questions/bulk-import/` - Import CSV

**Expected Data Sync:**
```
Form state (React) → Auto-save every 3 seconds → Backend
```

### TakeExam.tsx
**Backend Endpoints Used:**
- `POST /api/exam-assignments/start/` - Start exam session
- `GET /api/exam-assignments/<id>/` - Get assignment status
- `POST /api/exam-assignments/<id>/submit-answer/` - Save answer
- `POST /api/exam-assignments/<id>/auto-save/` - Batch save
- `POST /api/exam-assignments/<id>/submit/` - Finalize submission
- `POST /api/exam-assignments/<id>/log-activity/` - Log proctoring

**Real-time Requirements:**
```
Auto-save every 30 seconds (debounced)
Timer updates every 1 second (client-side)
Proctoring logs on-demand (suspicious activities)
```

### GradingPage.tsx
**Backend Endpoints Used:**
- `GET /api/exams/<id>/submissions/` - List submissions
- `GET /api/exam-assignments/<id>/submission/` - Full submission details
- `PUT /api/student-responses/<id>/grade/` - Grade essay
- `POST /api/exams/<id>/finalize-grades/` - Finalize all grades
- `GET /api/exams/<id>/analytics/` - View analytics

**Expected Permissions:**
```
Only instructor of the exam can access
```

### AdminDashboard.tsx
**Backend Endpoints Used:**
- `GET /api/admin/users/` - List all users
- `POST /api/admin/users/` - Add user
- `PUT /api/admin/users/<id>/` - Edit user
- `DELETE /api/admin/users/<id>/` - Delete user
- `GET /api/admin/audit-logs/` - View audit logs
- `GET /api/admin/stats/` - Dashboard statistics

**Expected Permissions:**
```
Only admin role can access
```

---

## FRONTEND ↔ BACKEND SYNC POINTS

### State Synchronization

```javascript
// Frontend (React state) ←→ Backend (Database)

// 1. User Profile
localStorage.nse_token ←→ JWT in Authorization header
useAuth().user ←→ GET /api/auth/profile/

// 2. Available Exams
StudentDashboard.exams ←→ GET /api/exams/ (filtered)

// 3. Exam Session
TakeExam.responses ←→ StudentResponse records
TakeExam.currentQuestionIndex ←→ None (client-side only)

// 4. Timer
TakeExam.timeRemaining ←→ Server calculates: submission_time - now

// 5. Grading Data
GradingPage.manualScores ←→ StudentResponse.manual_score

// 6. Admin Users
AdminDashboard.allUsers ←→ GET /api/admin/users/
```

### localStorage → Database Migration

```javascript
// On first login with old localStorage data:
1. Frontend checks localStorage for 'submission_{user_id}_{exam_id}'
2. If exists and incomplete:
   - POST /api/exam-assignments/resume/
   - Backend creates new assignment from local data
   - Syncs responses to database

// On logout:
- Clear localStorage sensitive data
- Keep only non-sensitive tokens for auto-login
```

---

## QUESTION TYPE HANDLING BY BACKEND

```python
# models/questions.py

class QuestionType(models.TextChoices):
    MULTIPLE_CHOICE = 'multiple_choice'
    MULTIPLE_SELECT = 'multiple_select'
    SHORT_ANSWER = 'short_answer'
    ESSAY = 'essay'

# services/grading.py

def auto_grade_answer(question, student_answer):
    if question.question_type == QuestionType.MULTIPLE_CHOICE:
        # Student answer: string (single option ID)
        correct = question.options.get(is_correct=True)
        return student_answer == correct.id ? points : 0
    
    elif question.question_type == QuestionType.MULTIPLE_SELECT:
        # Student answer: list of option IDs
        correct_ids = set(q.id for q in question.options.filter(is_correct=True))
        student_ids = set(student_answer)
        # ALL correct must be selected, NO incorrect
        return points if correct_ids == student_ids else 0
    
    elif question.question_type == QuestionType.SHORT_ANSWER:
        # Requires manual grading
        return None  # Instructor reviews
    
    elif question.question_type == QuestionType.ESSAY:
        # Requires manual grading
        return None  # Instructor reviews
```

---

## FINAL ARCHITECTURE SUMMARY

```
┌───────────────────────────────────────────────────────────────┐
│                  COMPLETE NSE EXAMVIBE SYSTEM                 │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          CLIENT LAYER (React TypeScript)                │  │
│  │  - 3 Dashboards (Student, Instructor, Admin)            │  │
│  │  - Real-time proctoring monitoring                      │  │
│  │  - Auto-save with localStorage fallback                 │  │
│  │  - 17 Engineering department filtering                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                           ↓ HTTP/REST API                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │       BACKEND LAYER (Django REST Framework)             │  │
│  │  ┌─ Accounts (Auth, Users, Roles)                      │  │
│  │  ├─ Exams (CRUD, Questions, Publishing)                │  │
│  │  ├─ Submissions (Responses, Auto-grading)              │  │
│  │  ├─ Grading (Manual scoring, Analytics)                │  │
│  │  ├─ Security (Proctoring, Activity logging)            │  │
│  │  └─ Admin (User mgmt, Audit logs, Reports)             │  │
│  └─────────────────────────────────────────────────────────┘  │
│              ↓              ↓              ↓                    │
│  ┌────────────────┐ ┌──────────────┐ ┌──────────────┐         │
│  │  PostgreSQL DB │ │ Redis Cache  │ │ Celery Tasks │         │
│  │  (Primary Data)│ │  (Sessions)  │ │(Background)  │         │
│  └────────────────┘ └──────────────┘ └──────────────┘         │
│                                                                 │
│  Security Features:                                            │
│  ✅ JWT Authentication + Role-Based Access                    │
│  ✅ Real-time Proctoring (Tab monitor, DevTools block)        │
│  ✅ Suspicious Activity Flagging                              │
│  ✅ Collusion Detection (Answer similarity analysis)           │
│  ✅ Auto-grading (Objective questions)                        │
│  ✅ Manual Grading Interface (Essays/Short answers)           │
│  ✅ Comprehensive Audit Logging                               │
│  ✅ Rate Limiting & IP Restrictions                           │
│                                                                 │
│  Deployment:                                                   │
│  ✅ Docker (Frontend + Backend + DB + Redis + Celery)        │
│  ✅ Nginx (Reverse proxy, SSL/TLS, CORS)                     │
│  ✅ Production-ready settings & monitoring                    │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

---

## QUICK START: 27-DAY DEVELOPMENT ROADMAP

**Phase 1: Database Setup (Days 1-3)**
- Initialize Django project
- Create models (Users, Exams, Questions, Submissions)
- Load 17 specializations fixture
- Run migrations

**Phase 2: Authentication (Days 4-6)**
- Implement JWT login/register
- Create user profile endpoints
- Add role-based permissions

**Phase 3: Exam Management (Days 7-9)**
- Create exam CRUD operations
- Implement question management
- Add question randomization

**Phase 4: Student Submissions (Days 10-12)**
- Implement exam start/submission flow
- Create answer validation & auto-grading
- Add auto-save functionality

**Phase 5: Grading System (Days 13-14)**
- Create grading interface endpoints
- Implement manual scoring
- Add analytics calculation

**Phase 6-7: Security & Admin (Days 15-17)**
- Implement proctoring logging
- Create admin endpoints
- Add audit logging

**Phase 8-9: Real-time & Background (Days 18-19)**
- Setup Celery tasks
- Implement collusion detection
- Add email notifications

**Phase 10-11: Testing & Optimization (Days 20-21)**
- Write comprehensive unit tests
- Add API integration tests
- Optimize database queries

**Phase 12-13: Deployment & Docs (Days 22-27)**
- Docker containerization
- Nginx configuration
- API documentation
- Production deployment

---

**Total Development Time: ~27 days with Vibe Coding approach**
**Production Ready: Yes - with security, monitoring, and scaling**
**Fully Integrated with Frontend: Yes - exact API/data structure match**