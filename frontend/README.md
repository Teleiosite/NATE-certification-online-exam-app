# NATE CERTIFICATION EXAM PLATFORM

A secure and intuitive interface for students to take online exams, featuring real-time proctoring, a dynamic question navigator, and a focused, distraction-free environment.

## Tech Stack (Frontend)

- **Framework/Library:** React 18+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

---

## Current Status: Frontend Complete

The frontend portion of the NATE Certification Exam Platform is fully implemented and functional, currently operating with a mock backend that uses `localStorage` for data persistence.

### Key Features Achieved:

#### 1. User Authentication & Roles
-   **Login & Registration:** Secure forms for user sign-in and sign-up.
-   **Role-Based Access:** The application supports three distinct user roles with tailored experiences:
    -   **Student:** Can view and take assigned exams.
    -   **Instructor:** Can create, manage, and grade exams.
    -   **Admin:** Has an overview of all users and exams in the system.

#### 2. Dashboards
-   **Student Dashboard:** Lists available exams, shows completion status, and provides access to results and certificates.
-   **Instructor Dashboard:** A comprehensive interface for creating/editing exams, managing a question bank, viewing student submissions, and grading subjective questions.
-   **Admin Dashboard:** Provides high-level system statistics, user management (add/edit/delete), and exam oversight.

#### 3. Exam Experience
-   **Exam Builder:** Instructors can create detailed exams, set time limits, define question types, assign points, and import questions from a bank or CSV.
-   **Exam Taking Interface:** A distraction-free environment for students with a persistent timer, question navigator for easy access, and support for various question types (Multiple Choice, Multiple Select, Short Answer, Essay).
-   **Proctoring:** Includes client-side hooks to detect and warn against suspicious activities like tab switching, copy/paste, and attempts to open developer tools.

#### 4. Grading & Results
-   **Grading Interface:** A dedicated view for instructors to review student submissions, grade essays and short answers manually, and provide feedback.
-   **Results Page:** After submission, students see a detailed breakdown of their performance, including score, grade, and a question-by-question review (if enabled).
-   **Certificate Generation:** Students who pass an exam can view and print a professional Certificate of Completion.

---

## What Remains: Backend Implementation

The next major phase of this project is to build and integrate the Django backend to replace the current mock data system. This will involve:

1.  **API Development:**
    -   Build a RESTful API using Django REST Framework to handle all data operations for users, exams, questions, submissions, and grading.

2.  **Database Integration:**
    -   Design and implement a robust PostgreSQL database schema to persistently store all application data.

3.  **Authentication Service:**
    -   Replace the mock authentication with a secure, token-based (JWT) authentication system connected to the backend user database.

4.  **Server-Side Logic:**
    -   Implement the core business logic for:
        -   Exam assignment and submission processing.
        -   Server-side validation and auto-grading.
        -   Managing student and instructor roles and permissions.

5.  **Advanced Security & Proctoring:**
    -   Develop server-side mechanisms to log, store, and analyze suspicious activities flagged by the frontend.
    -   Implement more advanced security features like collusion detection and plagiarism checks for essay questions.

6.  **Real-time Features & Background Tasks:**
    -   Integrate Django Channels for real-time notifications (e.g., when grades are released).
    -   Use Celery and Redis for handling background tasks like generating reports or running intensive analytics.

7.  **Deployment:**
    -   Containerize the entire application (Frontend + Backend) using Docker for a scalable and consistent production deployment.

---

## QUICK REFERENCE: ENGINEERING SPECIALIZATIONS

1.  Aeronautical Engineering
2.  Agricultural Engineering
3.  Artificial Intelligence and Robotics Engineering
4.  Biomedical Engineering
5.  Chemical Engineering
6.  Civil Engineering
7.  Computer Science Engineering
8.  Electrical Engineering
9.  Electronics and Communication Engineering
10. Mechanical Engineering
11. Metallurgical Engineering
12. Mining Engineering
13. Petroleum Engineering
14. Production Engineering
15. Robotics Engineering
16. Structural Engineering
17. Telecommunication Engineering
