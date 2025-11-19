# NSE ExamVibe Backend - Complete Vibe Coding Development Plan

## PROJECT OVERVIEW

**Frontend Status:** ✅ Complete & Fully Functional
- React 18 + TypeScript
- Three role-based dashboards (Student, Instructor, Admin)
- Full exam taking interface with proctoring
- Mock backend using localStorage

**Backend Task:** Build Django REST API to replace mock localStorage

**Current Frontend Features to Support:**
- User authentication (login/register with 3 roles)
- 17 engineering specializations
- Exam creation with 4 question types (Multiple Choice, Multiple Select, Short Answer, Essay)
- Student exam taking with timer & proctoring
- Grading interface for instructors
- Admin dashboard with user management
- Results & certificate generation
- Auto-save & session management

---

## PHASE 1: PROJECT SETUP & DATABASE (Days 1-3)

### PROMPT 1: Django Project Initialization
```
Create a complete Django 4.2 project setup for NSE ExamVibe backend.

Include:
1. Create Django project: django-admin startproject nse_examvibe .
2. Create Django apps:
   - accounts (user auth & management)
   - exams (exam management)
   - submissions (student submissions)
   - questions (question management)
   - security (proctoring & monitoring)

3. Create requirements.txt with:
   - Django==4.2
   - djangorestframework==3.14.0
   - djangorestframework-simplejwt==5.3.0
   - django-cors-headers==4.0.0
   - psycopg2-binary==2.9.6
   - python-decouple==3.8
   - pillow==9.5.0
   - Celery==5.3.0
   - redis==4.5.0

4. Create .env.example with all required variables

5. Setup manage.py structure

Provide complete commands and file setup.
```

### PROMPT 2: PostgreSQL Database Models (Part 1)
```
Create Django models for accounts app in src/accounts/models.py:

1. CustomUser model (extends AbstractUser):
   - id: UUID primary key
   - email: EmailField unique
   - first_name, last_name: CharField
   - role: CharField choices (student, instructor, admin)
   - specialization: ForeignKey to EngineeringSpecialization (nullable)
   - is_active: BooleanField
   - created_at, updated_at: DateTimeField
   - password: handled by Django's AbstractUser

2. EngineeringSpecialization model (MUST have exactly these 17):
   - Aeronautical Engineering
   - Agricultural Engineering
   - Artificial Intelligence and Robotics Engineering
   - Biomedical Engineering
   - Chemical Engineering
   - Civil Engineering
   - Computer Science Engineering
   - Electrical Engineering
   - Electronics and Communication Engineering
   - Mechanical Engineering
   - Metallurgical Engineering
   - Mining Engineering
   - Petroleum Engineering
   - Production Engineering
   - Robotics Engineering
   - Structural Engineering
   - Telecommunication Engineering

   Fields: id (UUID), name (CharField unique), code (CharField unique), description (TextField)

3. User manager:
   - create_user(email, password, **extra_fields)
   - create_superuser(email, password, **extra_fields)

Include:
- UUID as primary key throughout
- Proper Meta classes with verbose_names
- __str__ methods for all models
- Proper indexes for frequently queried columns

Provide complete models.py file ready to migrate.
```

### PROMPT 3: PostgreSQL Database Models (Part 2)
```
Create Django models for exams app in src/exams/models.py:

1. Exam model:
   - id: UUID primary key
   - title: CharField max_length=255
   - description: TextField blank=True
   - instructor: ForeignKey to CustomUser
   - specialization: ForeignKey to EngineeringSpecialization
   - total_points: IntegerField (calculated from questions)
   - duration_minutes: IntegerField
   - retake_limit: IntegerField default=1
   - randomize_questions: BooleanField default=False
   - randomize_answers: BooleanField default=False
   - allow_review_before_submit: BooleanField default=True
   - allow_review_after_submit: BooleanField default=True
   - show_answers_after_submit: BooleanField default=False
   - enable_proctoring: BooleanField default=False
   - enable_camera: BooleanField default=False
   - browser_lockdown: BooleanField default=False
   - created_at, updated_at: DateTimeField auto_now_add/auto_now
   - version: IntegerField default=1

2. Question model:
   - id: UUID primary key
   - exam: ForeignKey to Exam on_delete=CASCADE
   - question_text: TextField
   - question_type: CharField choices (multiple_choice, multiple_select, short_answer, essay)
   - points: DecimalField (max_digits=5, decimal_places=2)
   - explanation: TextField blank=True
   - image_url: URLField blank=True
   - order_index: IntegerField
   - is_required: BooleanField default=True
   - created_at, updated_at: DateTimeField

3. QuestionOption model:
   - id: UUID primary key
   - question: ForeignKey to Question on_delete=CASCADE
   - option_text: TextField
   - option_image_url: URLField blank=True
   - is_correct: BooleanField
   - partial_credit_points: DecimalField blank=True null=True
   - order_index: IntegerField
   - created_at: DateTimeField auto_now_add

4. QuestionBank model:
   - id: UUID primary key
   - instructor: ForeignKey to CustomUser
   - specialization: ForeignKey to EngineeringSpecialization
   - name: CharField unique=True
   - description: TextField blank=True
   - topic: CharField blank=True
   - difficulty_level: CharField choices (easy, medium, hard)
   - created_at, updated_at: DateTimeField

Include managers, proper ordering, indexes on exam_id, specialization_id.
Provide complete models.py file.
```

### PROMPT 4: PostgreSQL Database Models (Part 3)
```
Create Django models for submissions app in src/submissions/models.py:

1. ExamAssignment model:
   - id: UUID primary key
   - exam: ForeignKey to Exam
   - student: ForeignKey to CustomUser
   - assigned_at: DateTimeField auto_now_add
   - started_at: DateTimeField null=True blank=True
   - submitted_at: DateTimeField null=True blank=True
   - score: DecimalField null=True blank=True
   - status: CharField choices (not_started, in_progress, submitted, graded) default=not_started
   - question_randomization_seed: CharField blank=True
   - time_taken_seconds: IntegerField null=True
   - retake_count: IntegerField default=0
   - created_at, updated_at: DateTimeField

2. StudentResponse model:
   - id: UUID primary key
   - exam_assignment: ForeignKey to ExamAssignment on_delete=CASCADE
   - question: ForeignKey to Question
   - student: ForeignKey to CustomUser
   - answer_text: TextField null=True blank=True
   - answer_options: JSONField default=list (array of selected option IDs)
   - is_flagged: BooleanField default=False
   - is_answered: BooleanField default=False
   - auto_score: DecimalField null=True blank=True
   - manual_score: DecimalField null=True blank=True
   - instructor_feedback: TextField null=True blank=True
   - submitted_at: DateTimeField auto_now_add
   - created_at, updated_at: DateTimeField

3. SuspiciousActivity model:
   - id: UUID primary key
   - exam_assignment: ForeignKey to ExamAssignment
   - student: ForeignKey to CustomUser
   - activity_type: CharField choices (tab_switch, right_click, devtools_open, copy_attempt, paste_attempt, ip_change, rapid_answers, answer_modification, multiple_logins, possible_collusion)
   - severity: CharField choices (low, medium, high, critical)
   - timestamp: DateTimeField auto_now_add
   - metadata: JSONField default=dict
   - instructor_reviewed: BooleanField default=False
   - action_taken: CharField null=True blank=True
   - created_at: DateTimeField auto_now_add

4. AuditLog model:
   - id: UUID primary key
   - user: ForeignKey to CustomUser null=True
   - action: CharField
   - entity_type: CharField (exam, question, response, etc.)
   - entity_id: UUIDField
   - old_values: JSONField null=True blank=True
   - new_values: JSONField null=True blank=True
   - ip_address: GenericIPAddressField
   - user_agent: TextField
   - timestamp: DateTimeField auto_now_add

Include indexes on exam_assignment_id, student_id, activity_type for performance.
Provide complete models.py file ready to migrate.
```

### PROMPT 5: Settings & Configuration
```
Create nse_examvibe/settings.py with:

1. Installed apps (including new apps)

2. Database configuration:
   - PostgreSQL connection from DATABASE_URL env var
   - Connection pooling settings

3. JWT authentication:
   - SIMPLE_JWT with TOKEN_OBTAIN_SERIALIZER
   - ACCESS_TOKEN_LIFETIME = timedelta(hours=24)
   - REFRESH_TOKEN_LIFETIME = timedelta(days=7)

4. REST Framework settings:
   - DEFAULT_AUTHENTICATION_CLASSES with JWT
   - DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]
   - DEFAULT_PAGINATION_CLASS = PageNumberPagination
   - PAGE_SIZE = 20
   - DEFAULT_FILTER_BACKENDS = [SearchFilter, OrderingFilter]

5. CORS configuration:
   - CORS_ALLOWED_ORIGINS = [http://localhost:3000] for dev
   - CORS_ALLOW_CREDENTIALS = True

6. Custom constant:
   - ENGINEERING_SPECIALIZATIONS list with all 17

7. Security settings:
   - SECURE_SSL_REDIRECT = not DEBUG
   - SESSION_COOKIE_SECURE = not DEBUG
   - CSRF_COOKIE_SECURE = not DEBUG

Include proper error handling and environment variable loading.
Provide complete settings.py file.
```

### PROMPT 6: Create Fixtures for 17 Engineering Specializations
```
Create data/specializations.json fixture file with all 17 engineering specializations:

Each specialization needs:
- model: "accounts.engineeringspecialization"
- id (UUID format)
- name (MUST match exactly the 17 listed in frontend)
- code (unique 2-3 letter code)
- description (meaningful description)

Include load command: python manage.py loaddata specializations

Provide complete JSON fixture file.
```

---

## PHASE 2: AUTHENTICATION & USER MANAGEMENT (Days 4-6)

### PROMPT 7: User Serializers
```
Create src/accounts/serializers.py with:

1. CustomUserSerializer:
   - fields: id, email, first_name, last_name, role, specialization, is_active, created_at
   - read_only_fields: id, created_at
   - specialization: nested with name and code
   - Method: get_specialization_display() for student users

2. UserRegistrationSerializer:
   - fields: email, password, first_name, last_name, role, specialization
   - password: write_only, min_length=8, validators for strength
   - specialization: required if role='student'
   - validate() method:
     * Check email doesn't exist
     * Validate password strength
     * Require specialization for students
   - create() method:
     * Hash password with make_password()
     * Create CustomUser

3. UserLoginSerializer:
   - fields: email, password
   - validate() method:
     * Authenticate user
     * Return user with JWT tokens
     * Return: {user, access, refresh}

4. TokenRefreshSerializer:
   - fields: refresh, access

5. UserUpdateSerializer:
   - fields: first_name, last_name, email, specialization
   - read_only_fields: email
   - validate_specialization: only allow change if student

6. SpecializationSerializer:
   - fields: id, name, code, description

Include:
- Field-level validation methods
- Error messages
- Proper type hints
- Docstrings

Provide complete serializers.py file.
```

### PROMPT 8: Authentication Views & ViewSets
```
Create src/accounts/views.py with:

1. UserRegisterView (CreateAPIView):
   - serializer_class = UserRegistrationSerializer
   - permission_classes = [AllowAny]
   - post():
     * Return 201 with user data and tokens
     * Log audit event 'user_registered'

2. UserLoginView (TokenObtainPairView):
   - serializer_class = CustomUserSerializer (override to return user)
   - permission_classes = [AllowAny]
   - Implement rate limiting: 5 attempts per 15 minutes
   - Lock account after 5 failures
   - Log audit: 'login_attempt'
   - Return: {user, access, refresh}

3. UserLogoutView (GenericAPIView):
   - permission_classes = [IsAuthenticated]
   - post():
     * Add token to blacklist (using rest_framework_simplejwt)
     * Clear session
     * Log audit: 'logout'
     * Return: {success: true}

4. UserProfileView (RetrieveUpdateAPIView):
   - serializer_class = CustomUserSerializer
   - permission_classes = [IsAuthenticated]
   - queryset = CustomUser.objects.all()
   - get_object(): return self.request.user
   - update():
     * Only allow certain fields to be updated
     * Log audit: 'user_updated'

5. SpecializationListView (ListAPIView):
   - serializer_class = SpecializationSerializer
   - queryset = EngineeringSpecialization.objects.all().order_by('name')
   - permission_classes = [AllowAny]
   - pagination_class = None (return all)

6. UserListView (ListAPIView) - ADMIN ONLY:
   - serializer_class = CustomUserSerializer
   - permission_classes = [IsAuthenticated, IsAdmin]
   - queryset = CustomUser.objects.all()
   - filterset_fields = ['role', 'is_active']
   - search_fields = ['email', 'first_name']

Include:
- Proper error handling
- Status codes
- Logging

Provide complete views.py file.
```

### PROMPT 9: Authentication URLs
```
Create src/accounts/urls.py with routes:

- path('register/', UserRegisterView.as_view(), name='register')
- path('login/', UserLoginView.as_view(), name='login')
- path('logout/', UserLogoutView.as_view(), name='logout')
- path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
- path('profile/', UserProfileView.as_view(), name='profile')
- path('specializations/', SpecializationListView.as_view(), name='specializations')
- path('users/', UserListView.as_view(), name='user_list') - ADMIN
- path('users/<uuid:pk>/', UserDetailView.as_view(), name='user_detail') - ADMIN

Create root urls.py that includes:
- path('api/auth/', include('accounts.urls'))
- path('api/exams/', include('exams.urls'))
- path('api/submissions/', include('submissions.urls'))

Provide complete urls.py files.
```

### PROMPT 10: Permissions & Middleware
```
Create src/accounts/permissions.py with custom permission classes:

1. IsStudent (BasePermission):
   - has_permission(): check user.role == 'student'

2. IsInstructor (BasePermission):
   - has_permission(): check user.role == 'instructor'

3. IsAdmin (BasePermission):
   - has_permission(): check user.role == 'admin'

4. IsResourceOwner (BasePermission):
   - has_object_permission():
     * For Exam: verify user is instructor and owns exam
     * For ExamAssignment: verify user is student and owns assignment

5. IsFromSameInstitution (BasePermission):
   - Compare user specialization with resource specialization

Create src/accounts/middleware.py:

1. AuditLoggingMiddleware:
   - Log all API requests
   - Track: method, path, user, status_code, timestamp, ip_address

Include proper error messages and docstrings.
Provide complete files.
```

---

## PHASE 3: EXAM MANAGEMENT (Days 7-9)

### PROMPT 11: Exam Serializers
```
Create src/exams/serializers.py with:

1. QuestionOptionSerializer:
   - fields: id, option_text, option_image_url, is_correct, partial_credit_points, order_index
   - Custom to_representation():
     * If user is student: exclude is_correct, partial_credit_points
     * If user is instructor: include all

2. QuestionSerializer:
   - fields: id, exam, question_text, question_type, points, explanation, image_url, order_index, options
   - options: nested QuestionOptionSerializer(many=True)
   - Custom to_representation():
     * Filter options based on user role (student vs instructor)

3. ExamListSerializer (lightweight):
   - fields: id, title, specialization, duration_minutes, retake_limit, question_count, created_at
   - read_only_fields: id, question_count, created_at
   - question_count: SerializerMethodField

4. ExamDetailSerializer:
   - fields: all exam fields + questions
   - questions: QuestionSerializer(many=True, read_only=True)
   - Custom to_representation():
     * If user is student: exclude internal settings
     * Return randomized questions if randomize_questions=True

5. ExamCreateUpdateSerializer:
   - fields: title, description, specialization, duration_minutes, retake_limit, settings
   - validate():
     * duration_minutes > 0
     * retake_limit >= 0
     * specialization exists

6. SpecializationSerializer:
   - fields: id, name, code, description

Include proper validation and nested serializers.
Provide complete serializers.py file.
```

### PROMPT 12: Exam ViewSets
```
Create src/exams/views.py with:

1. ExamViewSet (ModelViewSet):
   - queryset = Exam.objects.all()
   - permission_classes = [IsAuthenticated]
   - filterset_fields = ['specialization', 'instructor']
   - search_fields = ['title', 'description']
   - ordering_fields = ['created_at', '-created_at']

   - get_serializer_class():
     * Return ExamListSerializer for list()
     * Return ExamDetailSerializer for retrieve()
     * Return ExamCreateUpdateSerializer for create/update

   - list():
     * If student: return only exams matching their specialization
     * If instructor: return only their own exams
     * If admin: return all exams

   - retrieve():
     * If student: verify specialization matches
     * If instructor: verify they own exam
     * Return randomized questions if randomize=True

   - create():
     * Permission: IsInstructor
     * Set instructor = request.user
     * Set specialization
     * Log audit: 'exam_created'
     * Calculate total_points from questions

   - update():
     * Permission: IsResourceOwner
     * Prevent changes if exam has submissions
     * Increment version
     * Log audit: 'exam_updated'

   - destroy():
     * Permission: IsResourceOwner
     * Check no students have started
     * Log audit: 'exam_deleted'

2. QuestionViewSet (ModelViewSet):
   - queryset = Question.objects.all()
   - permission_classes = [IsAuthenticated, IsInstructor]
   - serializer_class = QuestionSerializer
   - filterset_fields = ['exam']

   - create():
     * Validate question data
     * Set order_index automatically
     * Create options

   - update():
     * Update question and options

   - destroy():
     * Delete question
     * Re-index remaining questions

   - @action(detail=False, methods=['post'])
     reorder_questions(request):
     * Body: {exam_id, reorder_data: [{question_id, new_index}]}
     * Update order_index for all

Include proper permissions and error handling.
Provide complete views.py file.
```

### PROMPT 13: Exam URLs & Routers
```
Create src/exams/urls.py:

1. Create SimpleRouter
2. Register ExamViewSet with basename='exam'
3. Register QuestionViewSet with basename='question'
4. Add custom routes:
   - POST /exams/<id>/publish/ -> publish_exam
   - POST /exams/<id>/duplicate/ -> duplicate_exam
   - GET /exams/<id>/analytics/ -> get_analytics

Include proper URL patterns and namespacing.
Provide complete urls.py file.
```

---

## PHASE 4: SUBMISSIONS & EXAM TAKING (Days 10-12)

### PROMPT 14: Exam Assignment Serializers
```
Create src/submissions/serializers.py with:

1. StudentResponseSerializer:
   - fields: id, question, answer_text, answer_options, is_flagged, is_answered, auto_score, manual_score, instructor_feedback
   - read_only_fields: id, auto_score
   - Custom validate():
     * Validate answer against question type

2. ExamAssignmentListSerializer:
   - fields: id, exam, student, status, score, submitted_at
   - exam: nested with title, specialization
   - student: nested with first_name, email
   - read_only_fields: id

3. ExamAssignmentDetailSerializer:
   - fields: all fields + responses
   - responses: StudentResponseSerializer(many=True)

4. ExamAssignmentStartSerializer:
   - fields: password (optional)
   - Return: {exam_assignment, questions, time_remaining}

Include validation and nested serializers.
Provide complete serializers.py file.
```

### PROMPT 15: Exam Submission Services
```
Create src/submissions/services.py with service classes:

1. ExamAssignmentService:

   def start_exam(exam_id, student_id, password=None):
     - Verify exam is published
     - Verify exam is within time window
     - Verify specialization matches
     - If password required: verify
     - Generate randomization seed
     - Create ExamAssignment
     - Create empty StudentResponse for each question
     - Return: {exam_assignment, randomized_questions}

   def get_exam_data(exam_assignment_id, student_id):
     - Verify ownership
     - Get questions with randomized order (if enabled)
     - Exclude is_correct from options
     - Return time_remaining

   def submit_answer(exam_assignment_id, question_id, answer):
     - Verify exam_assignment in_progress
     - Verify time not exceeded
     - Validate answer
     - Auto-grade if objective
     - Update StudentResponse
     - Log suspicious activities if rapid answer
     - Return: {response, auto_score}

   def auto_save(exam_assignment_id, responses_dict):
     - Batch update StudentResponse records
     - Update exam_assignment last_activity
     - Return: success

   def submit_exam(exam_assignment_id):
     - Verify in_progress
     - Check time not exceeded
     - Update status = 'submitted'
     - Set submitted_at
     - Calculate total auto_score
     - Create audit log
     - Return: exam_assignment

2. AnswerValidationService:

   def validate_answer(question, answer):
     - Check question_type
     - For multiple_choice: verify option_id valid
     - For multiple_select: verify all option_ids valid
     - For essay/short_answer: non-empty string
     - Return: {valid, error_message}

   def auto_grade_answer(question, answer):
     - For multiple_choice: compare to is_correct
     - For multiple_select: all correct must be selected
     - For essay/short_answer: return 0 (manual grade)
     - Return: score

   def calculate_final_score(exam_assignment_id):
     - Sum auto_score + manual_score
     - Return: total_score

Include proper error handling and logging.
Provide complete services.py file.
```

### PROMPT 16: Exam Submission ViewSets
```
Create src/submissions/views.py with:

1. ExamAssignmentViewSet:
   - permission_classes = [IsAuthenticated]

   - @action(detail=False, methods=['post'])
     start_exam():
     * Body: {exam_id, password}
     * Call ExamAssignmentService.start_exam()
     * Return: {exam_assignment, questions, time_remaining}

   - @action(detail=True, methods=['get'])
     exam_data():
     * GET /exam-assignments/<id>/exam-data/
     * Return questions without correct answers

   - @action(detail=True, methods=['post'])
     submit_answer():
     * Body: {question_id, answer_text/answer_options, is_flagged}
     * Validate and grade
     * Log suspicious activity
     * Return: {response, auto_score}

   - @action(detail=True, methods=['post'])
     auto_save():
     * Body: {responses_dict}
     * Batch save
     * Return: success

   - @action(detail=True, methods=['post'])
     submit():
     * Finalize submission
     * Return: exam_assignment with score

2. StudentResponseViewSet:
   - permission_classes = [IsAuthenticated]
   - Only instructors can list all
   - Students can only see own responses after submission

Include proper permissions and error handling.
Provide complete views.py file.
```

---

## PHASE 5: GRADING & ANALYTICS (Days 13-14)

### PROMPT 17: Grading Services
```
Create src/grading/services.py with:

1. GradingService:

   def grade_essay_response(response_id, instructor_id, score, feedback):
     - Verify instructor owns exam
     - Validate score <= question.points
     - Update response: manual_score, feedback
     - Log audit
     - Return: updated_response

   def finalize_grades(exam_id, instructor_id):
     - Verify instructor owns exam
     - Get all submissions
     - Calculate final scores (auto + manual)
     - Update status = 'graded'
     - Check for collusion
     - Check for suspicious activities
     - Log audit
     - Return: list of graded assignments

   def get_exam_submissions(exam_id, instructor_id, status=None):
     - Verify instructor owns exam
     - Filter by status if provided
     - Include student info
     - Return paginated list

2. AnalyticsService:

   def get_exam_analytics(exam_id, instructor_id):
     - Get all submissions
     - Calculate:
       * average_score, high_score, low_score
       * score_distribution (bins: 0-10%, 10-20%, etc.)
       * total_submissions, completion_rate
     - For each question:
       * average_score
       * percentage_correct (difficulty)
       * discrimination_index
       * common_wrong_answers
     - Return: analytics_data

   def detect_collusion(exam_id):
     - Get all submissions
     - For each pair:
       * Calculate answer similarity
       * Compare completion times
       * If similarity > 85% AND time_diff < 300s: flag
     - Return: list of suspicious pairs

Include proper calculations and logging.
Provide complete services.py file.
```

### PROMPT 18: Grading ViewSets & URLs
```
Create src/grading/views.py with:

1. SubmissionListView (ListAPIView):
   - GET /exams/<exam_id>/submissions/
   - Permission: IsInstructor
   - Filter: status, student, date range
   - Return: paginated list with student, score, status

2. SubmissionDetailView (RetrieveAPIView):
   - GET /exam-assignments/<id>/submission/
   - Permission: IsInstructor
   - Return: full submission with all responses

3. GradeResponseView (UpdateAPIView):
   - PUT /student-responses/<id>/grade/
   - Body: {manual_score, instructor_feedback}
   - Permission: IsInstructor
   - Update response
   - Return: updated response

4. FinalizeGradesView (APIView):
   - POST /exams/<id>/finalize-grades/
   - Permission: IsInstructor
   - Calculate all scores
   - Update statuses
   - Run collusion detection
   - Return: success with stats

5. ExamAnalyticsView (RetrieveAPIView):
   - GET /exams/<id>/analytics/
   - Permission: IsInstructor
   - Return: comprehensive analytics

Create src/grading/urls.py with routes.
Include proper permissions and error handling.
Provide complete files.
```

---

## PHASE 6: PROCTORING & SECURITY (Days 15-16)

### PROMPT 19: Proctoring Monitoring Services
```
Create src/security/monitoring.py with:

1. log_suspicious_activity(exam_assignment_id, activity_type, severity, metadata):
   - Create SuspiciousActivity record
   - If severity='critical': send alert
   - Log to audit trail

2. detect_rapid_answers(exam_assignment_id):
   - Get all responses
   - Calculate time_to_answer
   - Flag if < 3 seconds
   - Create SuspiciousActivity

3. detect_ip_change(exam_assignment_id, new_ip):
   - Get initial IP
   - If different: flag and log

4. detect_answer_modification(exam_assignment_id, question_id, old_answer):
   - Check if changing correct to wrong
   - Log if suspicious

5. analyze_behavior_score(exam_assignment_id):
   - Get all activities
   - Calculate weighted score:
     * Tab switches: +20 per 10
     * DevTools: +30 per attempt
     * Copy/paste: +25 per 5
     * IP changes: +40
     * Rapid answers: +15
   - Return: {risk_level, score, reasons}

6. flag_for_manual_review(exam_assignment_id, reason):
   - Update exam_assignment: needs_manual_review
   - Create audit log

Include proper scoring and logging.
Provide complete monitoring.py file.
```

### PROMPT 20: Security ViewSets
```
Create src/security/views.py with:

1. SuspiciousActivityViewSet (ViewSet):
   - GET /suspicious-activities/ - admin/instructor
   - Filter: exam_id, severity, reviewed
   - List all activities

   - @action(detail=True, methods=['post'])
     mark_reviewed():
     * Mark activity as reviewed
     * Add action_taken (optional)

   - @action(detail=True, methods=['post'])
     invalidate_submission():
     * Mark exam_assignment score as invalid
     * Create audit log

Include proper permissions.
Provide complete views.py file.
```

---

## PHASE 7: ADMIN FEATURES (Day 17)

### PROMPT 21: Admin ViewSets
```
Create src/admin_panel/views.py with:

1. UserManagementView (ListCreateAPIView):
   - GET/POST /admin/users/
   - Permission: IsAdmin
   - List users with filtering
   - Create/update/delete users

2. AuditLogsView (ListAPIView):
   - GET /admin/audit-logs/
   - Permission: IsAdmin
   - Filter: user, action, entity_type, date range
   - Pagination

3. DashboardStatsView (APIView):
   - GET /admin/stats/
   - Return:
     * total_users, students, instructors
     * total_exams, total_submissions
     * average_score, completion_rate
     * flagged_activities_count
     3. DashboardStatsView (APIView):
   - GET /admin/stats/
   - Return:
     * total_users, students, instructors
     * total_exams, total_submissions
     * average_score, completion_rate
     * flagged_activities_count

4. SecurityReportView (APIView):
   - GET /admin/security-report/<exam_id>/
   - Permission: IsAdmin/IsInstructor
   - Return:
     * suspicious_activities
     * collusion_flags
     * behavioral_analysis

Include proper permissions and error handling.
Provide complete views.py file.
```

---

## PHASE 8: REAL-TIME FEATURES & CELERY (Day 18)

### PROMPT 22: Celery Tasks Setup
```
Create src/nse_examvibe/celery.py:

1. Configure Celery:
   - CELERY_BROKER_URL from Redis
   - CELERY_RESULT_BACKEND from Redis
   - CELERY_ACCEPT_CONTENT = ['json']
   - CELERY_TASK_SERIALIZER = 'json'
   - CELERY_TIMEZONE = 'UTC'

2. Create src/core/tasks.py with Celery tasks:

   @shared_task
   def check_exam_timeouts():
     - Find all in_progress exam assignments
     - Check if duration exceeded
     - Auto-submit expired exams
     - Run periodically every minute

   @shared_task
   def run_collusion_detection(exam_id):
     - Call AnalyticsService.detect_collusion()
     - Create collusion flags
     - Send notifications to instructor
     - Run after exam finalized

   @shared_task
   def generate_analytics_report(exam_id):
     - Generate comprehensive analytics
     - Cache results for fast retrieval

   @shared_task
   def send_grade_notification(exam_assignment_id):
     - Email student when grades released
     - Include score and feedback

Include proper error handling and retries.
Provide complete celery.py and tasks.py files.
```

### PROMPT 23: Celery Beat Scheduling
```
Create src/nse_examvibe/celery_beat.py with periodic tasks:

Configure schedule:

CELERY_BEAT_SCHEDULE = {
    'check-exam-timeouts': {
        'task': 'core.tasks.check_exam_timeouts',
        'schedule': crontab(minute='*'),  # Every minute
    },
    'cleanup-old-sessions': {
        'task': 'core.tasks.cleanup_old_sessions',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}

Commands to start:
- celery -A nse_examvibe worker -l info
- celery -A nse_examvibe beat -l info

Provide complete celery_beat.py file.
```

---

## PHASE 9: DJANGO SIGNALS & HOOKS (Day 19)

### PROMPT 24: Django Signals
```
Create src/core/signals.py:

1. @receiver(post_save, sender=ExamAssignment)
   def on_exam_submitted(sender, instance, created, **kwargs):
     - If status changed to 'submitted':
       * Run auto-grading for objective questions
       * Create initial SuspiciousActivity analysis
       * Log audit: 'exam_submitted'
       * Schedule collusion detection task

2. @receiver(post_save, sender=ExamAssignment)
   def on_exam_graded(sender, instance, **kwargs):
     - If status changed to 'graded':
       * Send notification to student
       * Log audit: 'exam_graded'

3. @receiver(post_delete, sender=Exam)
   def on_exam_deleted(sender, instance, **kwargs):
     - Check no students affected
     - Log audit: 'exam_deleted'

4. @receiver(pre_save, sender=Exam)
   def on_exam_updated(sender, instance, **kwargs):
     - Track changes
     - Log audit: 'exam_updated'

Register signals in apps.py ready_method.

Include proper error handling and logging.
Provide complete signals.py file.
```

---

## PHASE 10: TESTING & VALIDATION (Days 20-21)

### PROMPT 25: Django Unit Tests
```
Create comprehensive test suite:

Create tests/test_auth.py:
- test_user_registration_success
- test_user_registration_duplicate_email
- test_user_login_valid_credentials
- test_user_login_invalid_password
- test_user_logout
- test_jwt_token_generation
- test_jwt_token_refresh
- test_password_strength_validation
- test_email_validation

Create tests/test_exams.py:
- test_create_exam_as_instructor
- test_create_exam_as_student_fails
- test_get_exams_by_specialization
- test_exam_question_randomization
- test_question_reordering
- test_exam_deletion_with_submissions

Create tests/test_submissions.py:
- test_start_exam_success
- test_start_exam_invalid_specialization
- test_submit_answer_multiple_choice
- test_submit_answer_essay
- test_auto_save_responses
- test_submit_exam_success
- test_calculate_final_score
- test_time_expired_auto_submit

Create tests/test_grading.py:
- test_grade_essay_response
- test_finalize_grades
- test_get_exam_analytics
- test_detect_collusion

Create tests/test_security.py:
- test_log_suspicious_activity
- test_rapid_answer_detection
- test_ip_change_detection
- test_behavior_score_calculation

Include:
- setUp/tearDown methods
- Mock external services
- Comprehensive assertions
- Error case testing

Run with: python manage.py test
Provide all test files.
```

### PROMPT 26: API Integration Tests
```
Create tests/test_api_integration.py with end-to-end flows:

1. Complete Student Flow:
   - Register as student
   - Login
   - Get available exams for specialization
   - Start exam
   - Submit multiple answers
   - Auto-save responses
   - Submit exam
   - View results

2. Complete Instructor Flow:
   - Register as instructor
   - Login
   - Create exam
   - Add questions
   - Publish exam
   - View submissions
   - Grade essay questions
   - Finalize grades
   - View analytics

3. Complete Admin Flow:
   - Register as admin
   - Login
   - Create users
   - Manage exams
   - View audit logs
   - View suspicious activities

Include:
- Database setup/teardown
- Mock external APIs
- Proper assertions
- Status code checks

Run with: python manage.py test tests.test_api_integration
Provide complete test file.
```

---

## PHASE 11: DEPLOYMENT & DOCKER (Days 22-23)

### PROMPT 27: Docker Configuration
```
Create Dockerfile for Django backend:

- Base image: python:3.11-slim
- Install system dependencies (postgresql-client, etc.)
- Copy requirements.txt
- Run pip install
- Copy source code
- Set environment variables
- Create user (non-root)
- Expose port 8000
- CMD: gunicorn nse_examvibe.wsgi:application

Create docker-compose.yml:

services:
  - db: PostgreSQL 14 image
    - POSTGRES_PASSWORD from env
    - POSTGRES_DB=nse_examvibe
    - volumes: postgres_data:/var/lib/postgresql/data
  
  - redis: Redis 7 image
    - Port 6379
    - volumes: redis_data:/data
  
  - backend: Django service
    - build from ./backend
    - depends_on: db, redis
    - environment: all .env vars
    - ports: 8000:8000
    - command: gunicorn
  
  - celery: Celery worker
    - build from ./backend
    - depends_on: db, redis
    - command: celery -A nse_examvibe worker
  
  - celery-beat: Celery beat scheduler
    - build from ./backend
    - depends_on: db, redis
    - command: celery -A nse_examvibe beat

volumes:
  - postgres_data
  - redis_data

networks:
  - nse-network

Include environment files and startup commands.
Provide complete docker-compose.yml and Dockerfile.
```

### PROMPT 28: Nginx Configuration & Deployment
```
Create nginx.conf for production:

Nginx configuration:
- Listen on 80/443
- Proxy requests to gunicorn (8000)
- Static files serving (not needed for API-only)
- SSL/TLS configuration
- CORS headers
- Gzip compression
- Rate limiting

upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;
    
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Add gzip, rate limiting, etc.
}

Create deployment guide with:
- Environment variable setup
- Database migration commands
- Static file collection (if needed)
- SSL certificate setup
- Health checks
- Monitoring setup

Provide complete nginx.conf and deployment guide.
```

### PROMPT 29: Production Settings
```
Update nse_examvibe/settings.py for production:

1. Security settings:
   - SECURE_SSL_REDIRECT = True
   - SESSION_COOKIE_SECURE = True
   - CSRF_COOKIE_SECURE = True
   - SECURE_BROWSER_XSS_FILTER = True
   - SECURE_CONTENT_SECURITY_POLICY
   - SECURE_HSTS_SECONDS = 31536000

2. Database:
   - Connection pooling: CONN_MAX_AGE = 600
   - Replica read routing (optional)

3. Logging:
   - File handlers for django.log, security.log, error.log
   - Error tracking integration (Sentry)
   - Structured logging

4. Caching:
   - Redis cache backend
   - Cache question banks
   - Cache specializations
   - Cache user permissions

5. Email:
   - SMTP configuration for notifications
   - Email templates setup

6. Static files:
   - AWS S3 setup (optional)
   - CDN configuration

Provide updated settings.py for production.
```

---

## PHASE 12: MONITORING & MAINTENANCE (Days 24-25)

### PROMPT 30: Monitoring & Error Tracking
```
Create monitoring setup:

1. Sentry Integration:
   - pip install sentry-sdk
   - Configure in settings.py
   - Track errors and performance

2. Structured Logging:
   - Configure Winston/Python logging
   - Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
   - File rotation

3. Health Checks:
   - GET /api/health/
   - Check database connection
   - Check Redis connection
   - Check file system
   - Return: {status, components}

4. Metrics to track:
   - API response times
   - Database query performance
   - Celery task performance
   - Error rates
   - Exam submission success rate
   - Proctoring activity trends

5. Alerts:
   - Error rate > 5%
   - Response time > 1s
   - Database connection failures
   - Redis connection failures
   - Disk space > 90%

Create monitoring.py with health check views and logging setup.
Provide complete monitoring configuration.
```

### PROMPT 31: Database Optimization & Backups
```
Create database optimization guide:

1. Indexes to add:
   CREATE INDEX ON exams(instructor_id);
   CREATE INDEX ON exams(specialization_id);
   CREATE INDEX ON exam_assignments(exam_id, student_id);
   CREATE INDEX ON student_responses(exam_assignment_id);
   CREATE INDEX ON suspicious_activities(exam_assignment_id);
   CREATE INDEX ON audit_logs(user_id, timestamp);

2. Query optimization:
   - Use select_related() for ForeignKeys
   - Use prefetch_related() for reverse relationships
   - Use only() to limit fields
   - Avoid N+1 queries

3. Backup strategy:
   - Daily automated backups using pg_dump
   - 30-day retention
   - Test restore procedures regularly
   - Upload to S3 or external storage

4. Database maintenance:
   - VACUUM and ANALYZE regularly
   - Monitor slow queries
   - Archive old audit logs

Create backup.sh and restore.sh scripts.
Provide complete optimization guide.
```

---

## PHASE 13: API DOCUMENTATION (Days 26-27)

### PROMPT 32: API Documentation with DRF
```
Create API documentation using Django REST Framework's built-in features:

1. Install drf-spectacular:
   pip install drf-spectacular

2. Configure in settings.py:
   INSTALLED_APPS += ['drf_spectacular']
   REST_FRAMEWORK = {
       'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
   }

3. Create urls.py entry:
   from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
   
   urlpatterns = [
       path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
       path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
   ]

4. Generate OpenAPI schema:
   python manage.py spectacular --file schema.yml

5. Add docstrings to all viewsets and APIViews

Create comprehensive API documentation:
- All endpoints with request/response examples
- Authentication requirements
- Error codes and messages
- Rate limits
- Pagination
- Filtering and search
- Sorting options

Provide complete documentation setup.
```

---

## QUICK START GUIDE FOR VIBE CODING

### Day 1-3: Database & Setup
1. **PROMPT 1** → Project initialization
2. **PROMPT 2** → User models
3. **PROMPT 3** → Exam models  
4. **PROMPT 4** → Submission models
5. **PROMPT 5** → Settings config
6. **PROMPT 6** → Load fixtures (17 specializations)

**Commands to run:**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py loaddata specializations
python manage.py createsuperuser
```

### Day 4-6: Authentication
7. **PROMPT 7** → User serializers
8. **PROMPT 8** → Auth views
9. **PROMPT 9** → Auth URLs
10. **PROMPT 10** → Permissions middleware

**Test with:**
```bash
POST /api/auth/register/ (create student, instructor, admin)
POST /api/auth/login/
GET /api/auth/profile/
GET /api/auth/specializations/
```

### Day 7-9: Exam Management
11. **PROMPT 11** → Exam serializers
12. **PROMPT 12** → Exam viewsets
13. **PROMPT 13** → Exam URLs

**Test with:**
```bash
POST /api/exams/ (create exam as instructor)
GET /api/exams/ (filter by specialization)
POST /api/exams/<id>/questions/ (add questions)
GET /api/exams/<id>/ (view exam details)
```

### Day 10-12: Submissions & Exam Taking
14. **PROMPT 14** → Submission serializers
15. **PROMPT 15** → Submission services
16. **PROMPT 16** → Submission viewsets

**Test with:**
```bash
POST /api/exam-assignments/start/ (start exam)
POST /api/exam-assignments/<id>/submit-answer/ (answer question)
POST /api/exam-assignments/<id>/auto-save/ (auto-save)
POST /api/exam-assignments/<id>/submit/ (submit exam)
```

### Day 13-14: Grading
17. **PROMPT 17** → Grading services
18. **PROMPT 18** → Grading viewsets

**Test with:**
```bash
GET /api/exams/<id>/submissions/ (instructor views submissions)
PUT /api/student-responses/<id>/grade/ (grade essay)
POST /api/exams/<id>/finalize-grades/ (finalize all grades)
GET /api/exams/<id>/analytics/ (get analytics)
```

### Day 15-16: Security
19. **PROMPT 19** → Proctoring services
20. **PROMPT 20** → Security viewsets

### Day 17: Admin
21. **PROMPT 21** → Admin viewsets

### Day 18-19: Real-Time & Signals
22. **PROMPT 22** → Celery tasks
23. **PROMPT 23** → Celery beat
24. **PROMPT 24** → Django signals

### Day 20-21: Testing
25. **PROMPT 25** → Unit tests
26. **PROMPT 26** → Integration tests

**Run tests:**
```bash
python manage.py test
python manage.py test tests.test_api_integration
```

### Day 22-23: Deployment
27. **PROMPT 27** → Docker setup
28. **PROMPT 28** → Nginx & deployment
29. **PROMPT 29** → Production settings

### Day 24-25: Monitoring
30. **PROMPT 30** → Monitoring
31. **PROMPT 31** → Database optimization

### Day 26-27: Documentation
32. **PROMPT 32** → API documentation

---

## KEY INTEGRATION POINTS

### Frontend ↔ Backend API Mapping

**Auth Endpoints:**
- `POST /api/auth/register/` ← RegisterPage
- `POST /api/auth/login/` ← LoginPage
- `GET /api/auth/profile/` ← useAuth hook
- `GET /api/auth/specializations/` ← Department select dropdown

**Exam Endpoints:**
- `GET /api/exams/` ← StudentDashboard (filter by specialization)
- `POST /api/exams/` ← InstructorDashboard create exam
- `POST /api/exams/<id>/questions/` ← CreateExamPage add question
- `PUT /api/exams/<id>/` ← CreateExamPage auto-save

**Submission Endpoints:**
- `POST /api/exam-assignments/start/` ← TakeExam start
- `POST /api/exam-assignments/<id>/submit-answer/` ← QuestionDisplay answer
- `POST /api/exam-assignments/<id>/auto-save/` ← Auto-save hook
- `POST /api/exam-assignments/<id>/submit/` ← TakeExam submit
- `GET /api/exam-assignments/<id>/results/` ← ResultsPage

**Grading Endpoints:**
- `GET /api/exams/<id>/submissions/` ← GradingPage list
- `PUT /api/student-responses/<id>/grade/` ← GradingPage grade
- `GET /api/exams/<id>/analytics/` ← Analytics dashboard

---

## IMPORTANT NOTES

1. **Match Frontend Exactly:**
   - Response format MUST match what frontend expects
   - Field names must be identical (camelCase in frontend ↔ snake_case in backend serializers)
   - User IDs, exam IDs must be UUIDs

2. **localStorage Data to Database:**
   - Frontend uses localStorage for mock data
   - Backend must provide exact same data structure
   - Migrate existing localStorage data on first API call

3. **17 Specializations MUST Exist:**
   - All 17 engineering fields must be in database
   - Fixture loads them on first migration
   - Student dashboard filters exams by specialization

4. **Role-Based Access Control:**
   - Students: Only see their specialization exams
   - Instructors: See/manage only their exams
   - Admins: See everything

5. **Auto-grading Logic:**
   - Multiple Choice: exact match to one option
   - Multiple Select: all correct selected, no incorrect
   - Essay/Short Answer: manual grading by instructor

6. **Proctoring from Frontend:**
   - Frontend logs suspicious activities
   - POST /api/exam-assignments/<id>/log-activity/
   - Backend stores and analyzes patterns

7. **Time Management:**
   - Server-side timer authority
   - Auto-submit when time expires
   - Client-side only for UX countdown

---

## ENVIRONMENT VARIABLES (.env)

```
DEBUG=False
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@postgres:5432/nse_examvibe
REDIS_URL=redis://redis:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

JWT_SECRET=your-jwt-secret-key
ACCESS_TOKEN_LIFETIME=24  # hours
REFRESH_TOKEN_LIFETIME=7  # days

EMAIL_BACKEND=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email
EMAIL_HOST_PASSWORD=your-password

SENTRY_DSN=your-sentry-dsn
```

---

## SUCCESS CHECKLIST

- [ ] All 17 specializations in database
- [ ] User registration/login working
- [ ] Students can only see exams for their specialization
- [ ] Instructors can create exams with questions
- [ ] Students can take exams with timer
- [ ] Proctoring flags logged correctly
- [ ] Answers auto-grade for objective questions
- [ ] Instructors can grade essays
- [ ] Analytics calculated correctly
- [ ] Admin can manage all users
- [ ] All tests passing
- [ ] Docker setup working
- [ ] Production deployment ready

---

**This comprehensive plan provides everything needed to build a production-ready backend that perfectly integrates with your existing frontend. Each prompt is self-contained and can be vibe-coded independently. Follow the phases sequentially for best results!** 🚀# NSE ExamVibe Backend - Complete Vibe Coding Development Plan

## PROJECT OVERVIEW

**Frontend Status:** ✅ Complete & Fully Functional
- React 18 + TypeScript
- Three role-based dashboards (Student, Instructor, Admin)
- Full exam taking interface with proctoring
- Mock backend using localStorage

**Backend Task:** Build Django REST API to replace mock localStorage

**Current Frontend Features to Support:**
- User authentication (login/register with 3 roles)
- 17 engineering specializations
- Exam creation with 4 question types (Multiple Choice, Multiple Select, Short Answer, Essay)
- Student exam taking with timer & proctoring
- Grading interface for instructors
- Admin dashboard with user management
- Results & certificate generation
- Auto-save & session management

---

## PHASE 1: PROJECT SETUP & DATABASE (Days 1-3)

### PROMPT 1: Django Project Initialization
```
Create a complete Django 4.2 project setup for NSE ExamVibe backend.

Include:
1. Create Django project: django-admin startproject nse_examvibe .
2. Create Django apps:
   - accounts (user auth & management)
   - exams (exam management)
   - submissions (student submissions)
   - questions (question management)
   - security (proctoring & monitoring)

3. Create requirements.txt with:
   - Django==4.2
   - djangorestframework==3.14.0
   - djangorestframework-simplejwt==5.3.0
   - django-cors-headers==4.0.0
   - psycopg2-binary==2.9.6
   - python-decouple==3.8
   - pillow==9.5.0
   - Celery==5.3.0
   - redis==4.5.0

4. Create .env.example with all required variables

5. Setup manage.py structure

Provide complete commands and file setup.
```

### PROMPT 2: PostgreSQL Database Models (Part 1)
```
Create Django models for accounts app in src/accounts/models.py:

1. CustomUser model (extends AbstractUser):
   - id: UUID primary key
   - email: EmailField unique
   - first_name, last_name: CharField
   - role: CharField choices (student, instructor, admin)
   - specialization: ForeignKey to EngineeringSpecialization (nullable)
   - is_active: BooleanField
   - created_at, updated_at: DateTimeField
   - password: handled by Django's AbstractUser

2. EngineeringSpecialization model (MUST have exactly these 17):
   - Aeronautical Engineering
   - Agricultural Engineering
   - Artificial Intelligence and Robotics Engineering
   - Biomedical Engineering
   - Chemical Engineering
   - Civil Engineering
   - Computer Science Engineering
   - Electrical Engineering
   - Electronics and Communication Engineering
   - Mechanical Engineering
   - Metallurgical Engineering
   - Mining Engineering
   - Petroleum Engineering
   - Production Engineering
   - Robotics Engineering
   - Structural Engineering
   - Telecommunication Engineering

   Fields: id (UUID), name (CharField unique), code (CharField unique), description (TextField)

3. User manager:
   - create_user(email, password, **extra_fields)
   - create_superuser(email, password, **extra_fields)

Include:
- UUID as primary key throughout
- Proper Meta classes with verbose_names
- __str__ methods for all models
- Proper indexes for frequently queried columns

Provide complete models.py file ready to migrate.
```

### PROMPT 3: PostgreSQL Database Models (Part 2)
```
Create Django models for exams app in src/exams/models.py:

1. Exam model:
   - id: UUID primary key
   - title: CharField max_length=255
   - description: TextField blank=True
   - instructor: ForeignKey to CustomUser
   - specialization: ForeignKey to EngineeringSpecialization
   - total_points: IntegerField (calculated from questions)
   - duration_minutes: IntegerField
   - retake_limit: IntegerField default=1
   - randomize_questions: BooleanField default=False
   - randomize_answers: BooleanField default=False
   - allow_review_before_submit: BooleanField default=True
   - allow_review_after_submit: BooleanField default=True
   - show_answers_after_submit: BooleanField default=False
   - enable_proctoring: BooleanField default=False
   - enable_camera: BooleanField default=False
   - browser_lockdown: BooleanField default=False
   - created_at, updated_at: DateTimeField auto_now_add/auto_now
   - version: IntegerField default=1

2. Question model:
   - id: UUID primary key
   - exam: ForeignKey to Exam on_delete=CASCADE
   - question_text: TextField
   - question_type: CharField choices (multiple_choice, multiple_select, short_answer, essay)
   - points: DecimalField (max_digits=5, decimal_places=2)
   - explanation: TextField blank=True
   - image_url: URLField blank=True
   - order_index: IntegerField
   - is_required: BooleanField default=True
   - created_at, updated_at: DateTimeField

3. QuestionOption model:
   - id: UUID primary key
   - question: ForeignKey to Question on_delete=CASCADE
   - option_text: TextField
   - option_image_url: URLField blank=True
   - is_correct: BooleanField
   - partial_credit_points: DecimalField blank=True null=True
   - order_index: IntegerField
   - created_at: DateTimeField auto_now_add

4. QuestionBank model:
   - id: UUID primary key
   - instructor: ForeignKey to CustomUser
   - specialization: ForeignKey to EngineeringSpecialization
   - name: CharField unique=True
   - description: TextField blank=True
   - topic: CharField blank=True
   - difficulty_level: CharField choices (easy, medium, hard)
   - created_at, updated_at: DateTimeField

Include managers, proper ordering, indexes on exam_id, specialization_id.
Provide complete models.py file.
```

### PROMPT 4: PostgreSQL Database Models (Part 3)
```
Create Django models for submissions app in src/submissions/models.py:

1. ExamAssignment model:
   - id: UUID primary key
   - exam: ForeignKey to Exam
   - student: ForeignKey to CustomUser
   - assigned_at: DateTimeField auto_now_add
   - started_at: DateTimeField null=True blank=True
   - submitted_at: DateTimeField null=True blank=True
   - score: DecimalField null=True blank=True
   - status: CharField choices (not_started, in_progress, submitted, graded) default=not_started
   - question_randomization_seed: CharField blank=True
   - time_taken_seconds: IntegerField null=True
   - retake_count: IntegerField default=0
   - created_at, updated_at: DateTimeField

2. StudentResponse model:
   - id: UUID primary key
   - exam_assignment: ForeignKey to ExamAssignment on_delete=CASCADE
   - question: ForeignKey to Question
   - student: ForeignKey to CustomUser
   - answer_text: TextField null=True blank=True
   - answer_options: JSONField default=list (array of selected option IDs)
   - is_flagged: BooleanField default=False
   - is_answered: BooleanField default=False
   - auto_score: DecimalField null=True blank=True
   - manual_score: DecimalField null=True blank=True
   - instructor_feedback: TextField null=True blank=True
   - submitted_at: DateTimeField auto_now_add
   - created_at, updated_at: DateTimeField

3. SuspiciousActivity model:
   - id: UUID primary key
   - exam_assignment: ForeignKey to ExamAssignment
   - student: ForeignKey to CustomUser
   - activity_type: CharField choices (tab_switch, right_click, devtools_open, copy_attempt, paste_attempt, ip_change, rapid_answers, answer_modification, multiple_logins, possible_collusion)
   - severity: CharField choices (low, medium, high, critical)
   - timestamp: DateTimeField auto_now_add
   - metadata: JSONField default=dict
   - instructor_reviewed: BooleanField default=False
   - action_taken: CharField null=True blank=True
   - created_at: DateTimeField auto_now_add

4. AuditLog model:
   - id: UUID primary key
   - user: ForeignKey to CustomUser null=True
   - action: CharField
   - entity_type: CharField (exam, question, response, etc.)
   - entity_id: UUIDField
   - old_values: JSONField null=True blank=True
   - new_values: JSONField null=True blank=True
   - ip_address: GenericIPAddressField
   - user_agent: TextField
   - timestamp: DateTimeField auto_now_add

Include indexes on exam_assignment_id, student_id, activity_type for performance.
Provide complete models.py file ready to migrate.
```

### PROMPT 5: Settings & Configuration
```
Create nse_examvibe/settings.py with:

1. Installed apps (including new apps)

2. Database configuration:
   - PostgreSQL connection from DATABASE_URL env var
   - Connection pooling settings

3. JWT authentication:
   - SIMPLE_JWT with TOKEN_OBTAIN_SERIALIZER
   - ACCESS_TOKEN_LIFETIME = timedelta(hours=24)
   - REFRESH_TOKEN_LIFETIME = timedelta(days=7)

4. REST Framework settings:
   - DEFAULT_AUTHENTICATION_CLASSES with JWT
   - DEFAULT_PERMISSION_CLASSES = [IsAuthenticated]
   - DEFAULT_PAGINATION_CLASS = PageNumberPagination
   - PAGE_SIZE = 20
   - DEFAULT_FILTER_BACKENDS = [SearchFilter, OrderingFilter]

5. CORS configuration:
   - CORS_ALLOWED_ORIGINS = [http://localhost:3000] for dev
   - CORS_ALLOW_CREDENTIALS = True

6. Custom constant:
   - ENGINEERING_SPECIALIZATIONS list with all 17

7. Security settings:
   - SECURE_SSL_REDIRECT = not DEBUG
   - SESSION_COOKIE_SECURE = not DEBUG
   - CSRF_COOKIE_SECURE = not DEBUG

Include proper error handling and environment variable loading.
Provide complete settings.py file.
```

### PROMPT 6: Create Fixtures for 17 Engineering Specializations
```
Create data/specializations.json fixture file with all 17 engineering specializations:

Each specialization needs:
- model: "accounts.engineeringspecialization"
- id (UUID format)
- name (MUST match exactly the 17 listed in frontend)
- code (unique 2-3 letter code)
- description (meaningful description)

Include load command: python manage.py loaddata specializations

Provide complete JSON fixture file.
```

---

## PHASE 2: AUTHENTICATION & USER MANAGEMENT (Days 4-6)

### PROMPT 7: User Serializers
```
Create src/accounts/serializers.py with:

1. CustomUserSerializer:
   - fields: id, email, first_name, last_name, role, specialization, is_active, created_at
   - read_only_fields: id, created_at
   - specialization: nested with name and code
   - Method: get_specialization_display() for student users

2. UserRegistrationSerializer:
   - fields: email, password, first_name, last_name, role, specialization
   - password: write_only, min_length=8, validators for strength
   - specialization: required if role='student'
   - validate() method:
     * Check email doesn't exist
     * Validate password strength
     * Require specialization for students
   - create() method:
     * Hash password with make_password()
     * Create CustomUser

3. UserLoginSerializer:
   - fields: email, password
   - validate() method:
     * Authenticate user
     * Return user with JWT tokens
     * Return: {user, access, refresh}

4. TokenRefreshSerializer:
   - fields: refresh, access

5. UserUpdateSerializer:
   - fields: first_name, last_name, email, specialization
   - read_only_fields: email
   - validate_specialization: only allow change if student

6. SpecializationSerializer:
   - fields: id, name, code, description

Include:
- Field-level validation methods
- Error messages
- Proper type hints
- Docstrings

Provide complete serializers.py file.
```

### PROMPT 8: Authentication Views & ViewSets
```
Create src/accounts/views.py with:

1. UserRegisterView (CreateAPIView):
   - serializer_class = UserRegistrationSerializer
   - permission_classes = [AllowAny]
   - post():
     * Return 201 with user data and tokens
     * Log audit event 'user_registered'

2. UserLoginView (TokenObtainPairView):
   - serializer_class = CustomUserSerializer (override to return user)
   - permission_classes = [AllowAny]
   - Implement rate limiting: 5 attempts per 15 minutes
   - Lock account after 5 failures
   - Log audit: 'login_attempt'
   - Return: {user, access, refresh}

3. UserLogoutView (GenericAPIView):
   - permission_classes = [IsAuthenticated]
   - post():
     * Add token to blacklist (using rest_framework_simplejwt)
     * Clear session
     * Log audit: 'logout'
     * Return: {success: true}

4. UserProfileView (RetrieveUpdateAPIView):
   - serializer_class = CustomUserSerializer
   - permission_classes = [IsAuthenticated]
   - queryset = CustomUser.objects.all()
   - get_object(): return self.request.user
   - update():
     * Only allow certain fields to be updated
     * Log audit: 'user_updated'

5. SpecializationListView (ListAPIView):
   - serializer_class = SpecializationSerializer
   - queryset = EngineeringSpecialization.objects.all().order_by('name')
   - permission_classes = [AllowAny]
   - pagination_class = None (return all)

6. UserListView (ListAPIView) - ADMIN ONLY:
   - serializer_class = CustomUserSerializer
   - permission_classes = [IsAuthenticated, IsAdmin]
   - queryset = CustomUser.objects.all()
   - filterset_fields = ['role', 'is_active']
   - search_fields = ['email', 'first_name']

Include:
- Proper error handling
- Status codes
- Logging

Provide complete views.py file.
```

### PROMPT 9: Authentication URLs
```
Create src/accounts/urls.py with routes:

- path('register/', UserRegisterView.as_view(), name='register')
- path('login/', UserLoginView.as_view(), name='login')
- path('logout/', UserLogoutView.as_view(), name='logout')
- path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
- path('profile/', UserProfileView.as_view(), name='profile')
- path('specializations/', SpecializationListView.as_view(), name='specializations')
- path('users/', UserListView.as_view(), name='user_list') - ADMIN
- path('users/<uuid:pk>/', UserDetailView.as_view(), name='user_detail') - ADMIN

Create root urls.py that includes:
- path('api/auth/', include('accounts.urls'))
- path('api/exams/', include('exams.urls'))
- path('api/submissions/', include('submissions.urls'))

Provide complete urls.py files.
```

### PROMPT 10: Permissions & Middleware
```
Create src/accounts/permissions.py with custom permission classes:

1. IsStudent (BasePermission):
   - has_permission(): check user.role == 'student'

2. IsInstructor (BasePermission):
   - has_permission(): check user.role == 'instructor'

3. IsAdmin (BasePermission):
   - has_permission(): check user.role == 'admin'

4. IsResourceOwner (BasePermission):
   - has_object_permission():
     * For Exam: verify user is instructor and owns exam
     * For ExamAssignment: verify user is student and owns assignment

5. IsFromSameInstitution (BasePermission):
   - Compare user specialization with resource specialization

Create src/accounts/middleware.py:

1. AuditLoggingMiddleware:
   - Log all API requests
   - Track: method, path, user, status_code, timestamp, ip_address

Include proper error messages and docstrings.
Provide complete files.
```

---

## PHASE 3: EXAM MANAGEMENT (Days 7-9)

### PROMPT 11: Exam Serializers
```
Create src/exams/serializers.py with:

1. QuestionOptionSerializer:
   - fields: id, option_text, option_image_url, is_correct, partial_credit_points, order_index
   - Custom to_representation():
     * If user is student: exclude is_correct, partial_credit_points
     * If user is instructor: include all

2. QuestionSerializer:
   - fields: id, exam, question_text, question_type, points, explanation, image_url, order_index, options
   - options: nested QuestionOptionSerializer(many=True)
   - Custom to_representation():
     * Filter options based on user role (student vs instructor)

3. ExamListSerializer (lightweight):
   - fields: id, title, specialization, duration_minutes, retake_limit, question_count, created_at
   - read_only_fields: id, question_count, created_at
   - question_count: SerializerMethodField

4. ExamDetailSerializer:
   - fields: all exam fields + questions
   - questions: QuestionSerializer(many=True, read_only=True)
   - Custom to_representation():
     * If user is student: exclude internal settings
     * Return randomized questions if randomize_questions=True

5. ExamCreateUpdateSerializer:
   - fields: title, description, specialization, duration_minutes, retake_limit, settings
   - validate():
     * duration_minutes > 0
     * retake_limit >= 0
     * specialization exists

6. SpecializationSerializer:
   - fields: id, name, code, description

Include proper validation and nested serializers.
Provide complete serializers.py file.
```

### PROMPT 12: Exam ViewSets
```
Create src/exams/views.py with:

1. ExamViewSet (ModelViewSet):
   - queryset = Exam.objects.all()
   - permission_classes = [IsAuthenticated]
   - filterset_fields = ['specialization', 'instructor']
   - search_fields = ['title', 'description']
   - ordering_fields = ['created_at', '-created_at']

   - get_serializer_class():
     * Return ExamListSerializer for list()
     * Return ExamDetailSerializer for retrieve()
     * Return ExamCreateUpdateSerializer for create/update

   - list():
     * If student: return only exams matching their specialization
     * If instructor: return only their own exams
     * If admin: return all exams

   - retrieve():
     * If student: verify specialization matches
     * If instructor: verify they own exam
     * Return randomized questions if randomize=True

   - create():
     * Permission: IsInstructor
     * Set instructor = request.user
     * Set specialization
     * Log audit: 'exam_created'
     * Calculate total_points from questions

   - update():
     * Permission: IsResourceOwner
     * Prevent changes if exam has submissions
     * Increment version
     * Log audit: 'exam_updated'

   - destroy():
     * Permission: IsResourceOwner
     * Check no students have started
     * Log audit: 'exam_deleted'

2. QuestionViewSet (ModelViewSet):
   - queryset = Question.objects.all()
   - permission_classes = [IsAuthenticated, IsInstructor]
   - serializer_class = QuestionSerializer
   - filterset_fields = ['exam']

   - create():
     * Validate question data
     * Set order_index automatically
     * Create options

   - update():
     * Update question and options

   - destroy():
     * Delete question
     * Re-index remaining questions

   - @action(detail=False, methods=['post'])
     reorder_questions(request):
     * Body: {exam_id, reorder_data: [{question_id, new_index}]}
     * Update order_index for all

Include proper permissions and error handling.
Provide complete views.py file.
```

### PROMPT 13: Exam URLs & Routers
```
Create src/exams/urls.py:

1. Create SimpleRouter
2. Register ExamViewSet with basename='exam'
3. Register QuestionViewSet with basename='question'
4. Add custom routes:
   - POST /exams/<id>/publish/ -> publish_exam
   - POST /exams/<id>/duplicate/ -> duplicate_exam
   - GET /exams/<id>/analytics/ -> get_analytics

Include proper URL patterns and namespacing.
Provide complete urls.py file.
```

---

## PHASE 4: SUBMISSIONS & EXAM TAKING (Days 10-12)

### PROMPT 14: Exam Assignment Serializers
```
Create src/submissions/serializers.py with:

1. StudentResponseSerializer:
   - fields: id, question, answer_text, answer_options, is_flagged, is_answered, auto_score, manual_score, instructor_feedback
   - read_only_fields: id, auto_score
   - Custom validate():
     * Validate answer against question type

2. ExamAssignmentListSerializer:
   - fields: id, exam, student, status, score, submitted_at
   - exam: nested with title, specialization
   - student: nested with first_name, email
   - read_only_fields: id

3. ExamAssignmentDetailSerializer:
   - fields: all fields + responses
   - responses: StudentResponseSerializer(many=True)

4. ExamAssignmentStartSerializer:
   - fields: password (optional)
   - Return: {exam_assignment, questions, time_remaining}

Include validation and nested serializers.
Provide complete serializers.py file.
```

### PROMPT 15: Exam Submission Services
```
Create src/submissions/services.py with service classes:

1. ExamAssignmentService:

   def start_exam(exam_id, student_id, password=None):
     - Verify exam is published
     - Verify exam is within time window
     - Verify specialization matches
     - If password required: verify
     - Generate randomization seed
     - Create ExamAssignment
     - Create empty StudentResponse for each question
     - Return: {exam_assignment, randomized_questions}

   def get_exam_data(exam_assignment_id, student_id):
     - Verify ownership
     - Get questions with randomized order (if enabled)
     - Exclude is_correct from options
     - Return time_remaining

   def submit_answer(exam_assignment_id, question_id, answer):
     - Verify exam_assignment in_progress
     - Verify time not exceeded
     - Validate answer
     - Auto-grade if objective
     - Update StudentResponse
     - Log suspicious activities if rapid answer
     - Return: {response, auto_score}

   def auto_save(exam_assignment_id, responses_dict):
     - Batch update StudentResponse records
     - Update exam_assignment last_activity
     - Return: success

   def submit_exam(exam_assignment_id):
     - Verify in_progress
     - Check time not exceeded
     - Update status = 'submitted'
     - Set submitted_at
     - Calculate total auto_score
     - Create audit log
     - Return: exam_assignment

2. AnswerValidationService:

   def validate_answer(question, answer):
     - Check question_type
     - For multiple_choice: verify option_id valid
     - For multiple_select: verify all option_ids valid
     - For essay/short_answer: non-empty string
     - Return: {valid, error_message}

   def auto_grade_answer(question, answer):
     - For multiple_choice: compare to is_correct
     - For multiple_select: all correct must be selected
     - For essay/short_answer: return 0 (manual grade)
     - Return: score

   def calculate_final_score(exam_assignment_id):
     - Sum auto_score + manual_score
     - Return: total_score

Include proper error handling and logging.
Provide complete services.py file.
```

### PROMPT 16: Exam Submission ViewSets
```
Create src/submissions/views.py with:

1. ExamAssignmentViewSet:
   - permission_classes = [IsAuthenticated]

   - @action(detail=False, methods=['post'])
     start_exam():
     * Body: {exam_id, password}
     * Call ExamAssignmentService.start_exam()
     * Return: {exam_assignment, questions, time_remaining}

   - @action(detail=True, methods=['get'])
     exam_data():
     * GET /exam-assignments/<id>/exam-data/
     * Return questions without correct answers

   - @action(detail=True, methods=['post'])
     submit_answer():
     * Body: {question_id, answer_text/answer_options, is_flagged}
     * Validate and grade
     * Log suspicious activity
     * Return: {response, auto_score}

   - @action(detail=True, methods=['post'])
     auto_save():
     * Body: {responses_dict}
     * Batch save
     * Return: success

   - @action(detail=True, methods=['post'])
     submit():
     * Finalize submission
     * Return: exam_assignment with score

2. StudentResponseViewSet:
   - permission_classes = [IsAuthenticated]
   - Only instructors can list all
   - Students can only see own responses after submission

Include proper permissions and error handling.
Provide complete views.py file.
```

---

## PHASE 5: GRADING & ANALYTICS (Days 13-14)

### PROMPT 17: Grading Services
```
Create src/grading/services.py with:

1. GradingService:

   def grade_essay_response(response_id, instructor_id, score, feedback):
     - Verify instructor owns exam
     - Validate score <= question.points
     - Update response: manual_score, feedback
     - Log audit
     - Return: updated_response

   def finalize_grades(exam_id, instructor_id):
     - Verify instructor owns exam
     - Get all submissions
     - Calculate final scores (auto + manual)
     - Update status = 'graded'
     - Check for collusion
     - Check for suspicious activities
     - Log audit
     - Return: list of graded assignments

   def get_exam_submissions(exam_id, instructor_id, status=None):
     - Verify instructor owns exam
     - Filter by status if provided
     - Include student info
     - Return paginated list

2. AnalyticsService:

   def get_exam_analytics(exam_id, instructor_id):
     - Get all submissions
     - Calculate:
       * average_score, high_score, low_score
       * score_distribution (bins: 0-10%, 10-20%, etc.)
       * total_submissions, completion_rate
     - For each question:
       * average_score
       * percentage_correct (difficulty)
       * discrimination_index
       * common_wrong_answers
     - Return: analytics_data

   def detect_collusion(exam_id):
     - Get all submissions
     - For each pair:
       * Calculate answer similarity
       * Compare completion times
       * If similarity > 85% AND time_diff < 300s: flag
     - Return: list of suspicious pairs

Include proper calculations and logging.
Provide complete services.py file.
```

### PROMPT 18: Grading ViewSets & URLs
```
Create src/grading/views.py with:

1. SubmissionListView (ListAPIView):
   - GET /exams/<exam_id>/submissions/
   - Permission: IsInstructor
   - Filter: status, student, date range
   - Return: paginated list with student, score, status

2. SubmissionDetailView (RetrieveAPIView):
   - GET /exam-assignments/<id>/submission/
   - Permission: IsInstructor
   - Return: full submission with all responses

3. GradeResponseView (UpdateAPIView):
   - PUT /student-responses/<id>/grade/
   - Body: {manual_score, instructor_feedback}
   - Permission: IsInstructor
   - Update response
   - Return: updated response

4. FinalizeGradesView (APIView):
   - POST /exams/<id>/finalize-grades/
   - Permission: IsInstructor
   - Calculate all scores
   - Update statuses
   - Run collusion detection
   - Return: success with stats

5. ExamAnalyticsView (RetrieveAPIView):
   - GET /exams/<id>/analytics/
   - Permission: IsInstructor
   - Return: comprehensive analytics

Create src/grading/urls.py with routes.
Include proper permissions and error handling.
Provide complete files.
```

---

## PHASE 6: PROCTORING & SECURITY (Days 15-16)

### PROMPT 19: Proctoring Monitoring Services
```
Create src/security/monitoring.py with:

1. log_suspicious_activity(exam_assignment_id, activity_type, severity, metadata):
   - Create SuspiciousActivity record
   - If severity='critical': send alert
   - Log to audit trail

2. detect_rapid_answers(exam_assignment_id):
   - Get all responses
   - Calculate time_to_answer
   - Flag if < 3 seconds
   - Create SuspiciousActivity

3. detect_ip_change(exam_assignment_id, new_ip):
   - Get initial IP
   - If different: flag and log

4. detect_answer_modification(exam_assignment_id, question_id, old_answer):
   - Check if changing correct to wrong
   - Log if suspicious

5. analyze_behavior_score(exam_assignment_id):
   - Get all activities
   - Calculate weighted score:
     * Tab switches: +20 per 10
     * DevTools: +30 per attempt
     * Copy/paste: +25 per 5
     * IP changes: +40
     * Rapid answers: +15
   - Return: {risk_level, score, reasons}

6. flag_for_manual_review(exam_assignment_id, reason):
   - Update exam_assignment: needs_manual_review
   - Create audit log

Include proper scoring and logging.
Provide complete monitoring.py file.
```

### PROMPT 20: Security ViewSets
```
Create src/security/views.py with:

1. SuspiciousActivityViewSet (ViewSet):
   - GET /suspicious-activities/ - admin/instructor
   - Filter: exam_id, severity, reviewed
   - List all activities

   - @action(detail=True, methods=['post'])
     mark_reviewed():
     * Mark activity as reviewed
     * Add action_taken (optional)

   - @action(detail=True, methods=['post'])
     invalidate_submission():
     * Mark exam_assignment score as invalid
     * Create audit log

Include proper permissions.
Provide complete views.py file.
```

---

## PHASE 7: ADMIN FEATURES (Day 17)

### PROMPT 21: Admin ViewSets
```
Create src/admin_panel/views.py with:

1. UserManagementView (ListCreateAPIView):
   - GET/POST /admin/users/
   - Permission: IsAdmin
   - List users with filtering
   - Create/update/delete users

2. AuditLogsView (ListAPIView):
   - GET /admin/audit-logs/
   - Permission: IsAdmin
   - Filter: user, action, entity_type, date range
   - Pagination

3. DashboardStatsView (APIView):
   - GET /admin/stats/
   - Return:
     * total_users, students, instructors
     * total_exams, total_submissions
     * average_score, completion_rate
     * flagged_activities_count