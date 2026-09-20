# Intervue — Engineering Improvement & Production Roadmap

> **Purpose:** This document is the working engineering plan for taking Intervue from its current work-in-progress state to a polished, secure, testable, production-oriented project that is strong enough to defend in SDE/backend/AI engineering interviews.
>
> **Important:** The roadmap is based on the current implementation reviewed so far. Resume claims should only be made after the corresponding feature is actually implemented and, where relevant, measured.

---

## 1. Current Project Direction

Intervue is being positioned as a **placement-preparation platform** with two complementary sides:

### Individual preparation

* AI-driven text interview
* Conversational follow-up questions
* AI interview evaluation and feedback
* Coding practice
* Monaco-based code editor
* Code execution/judging
* AI code feedback
* Problem management/admin CMS
* Interview/history persistence

### Competitive preparation

* Create a room with friends
* Join using a room code
* Aptitude tests
* Coding tests
* Optional mixed tests
* Configurable test duration
* Real-time participants
* Real-time submissions/events
* Live leaderboard
* Final ranking

### Product positioning

> Intervue is a placement-preparation platform where candidates can practice AI-driven interviews and coding problems individually, or create real-time competitive assessment rooms with friends for aptitude and coding tests.

---

# 2. Current Technology Stack

## Frontend

* React
* React 19
* Vite
* TypeScript
* Monaco Editor

## Backend

* Bun
* Hono
* TypeScript

## Database

* PostgreSQL
* Prisma ORM

## Authentication

* Better Auth
* OAuth
* Sessions
* Role-based admin authorization

## AI

* Groq
* Conversational interview generation
* AI evaluation
* AI problem generation

## Code Execution

* Judge0 infrastructure
* Existing Piston integration is planned for removal/replacement

## Real-Time

* Planned: Socket.IO/WebSockets
* Existing Nexus project provides prior Socket.IO experience

## Infrastructure

* Docker
* PostgreSQL
* Redis
* Judge0

## Monorepo

```text
apps/
├── web/
└── server/

packages/
├── db/
└── shared/
```

---

# 3. Current Strengths

These are areas that are already useful foundations.

* Full-stack monorepo structure
* React + TypeScript frontend
* Bun + Hono backend
* PostgreSQL + Prisma relational data model
* Authentication foundation
* Backend admin authorization
* AI integration
* Persistent interview history
* Coding editor
* Code execution infrastructure
* Problem/testcase data model
* Submission persistence
* Admin problem management
* Docker-based development infrastructure
* Existing Redis infrastructure
* Existing database relationships and cascading relationships
* Streaming capabilities
* Clear separation between frontend/backend/database packages
* Project has enough breadth to demonstrate real engineering decisions

---

# 4. Major Current Weaknesses

These are the important weaknesses identified during the current review.

## 4.1 Coding Judge Is Not Yet a Complete Judge

### Current problem

The current execution flow is effectively close to:

```text
Source Code
    ↓
Code Execution Provider
    ↓
Run Code
    ↓
Use exit status/output
    ↓
Verdict
```

This is not enough for a proper competitive-programming judge.

### Risks

* Arbitrary output may potentially be considered successful
* Hidden test cases are not fully connected to judging
* Problem-specific time limits are not fully enforced
* Memory limits are not fully enforced
* Runtime/memory persistence is incomplete
* Testcase-by-testcase judging needs to be authoritative

### Required improvement

Build:

```text
Submission
    ↓
Load Problem
    ↓
Load ALL Test Cases
    ↓
Execute each testcase
    ↓
Compare expected vs actual output
    ↓
Determine verdict
    ↓
Persist result
```

Supported verdicts should include:

* PENDING
* ACCEPTED
* WRONG_ANSWER
* TLE
* MLE
* RUNTIME_ERROR
* COMPILATION_ERROR

The exact mapping for memory-limit behavior must be verified against the deployed Judge0 configuration rather than assumed.

---

# 5. Voice Interview — Planned Removal

The current voice functionality is unreliable.

The current product direction is to **remove Voice Interview rather than keep a broken feature for resume value**.

## Removal checklist

* Remove voice UI
* Remove voice interview flow
* Remove unused SpeechRecognition logic
* Remove unused Whisper integration
* Remove unused TTS integration
* Remove unused voice API routes
* Remove unused services
* Remove unused dependencies
* Remove unused environment variables
* Remove dead frontend code
* Update documentation
* Update README
* Update architecture diagram

## Reason

A smaller feature set that works reliably is better than a larger feature set that cannot be demonstrated reliably.

---

# 6. Competitive Room System

This is the next major product feature.

## MVP

A user should be able to:

1. Create a room
2. Configure the room
3. Receive a room code
4. Share the code
5. Friends join
6. Host sees participants
7. Host starts the test
8. Participants take aptitude/coding questions
9. Submissions are judged
10. Scores are calculated deterministically
11. Leaderboard updates in real time
12. Test ends
13. Final leaderboard is persisted

---

# 7. Room Configuration

Potential configuration:

* Room name
* Test type

  * Aptitude
  * Coding
  * Mixed
* Duration
* Number of aptitude questions
* Number of coding questions
* Difficulty
* Maximum participants
* Live leaderboard enabled/disabled
* Optional negative marking
* Join via room code

Do not implement every configuration option immediately.

Start with the smallest useful MVP.

---

# 8. Proposed Room Database Model

Adapt these models to the existing Prisma schema rather than blindly copying them.

## Room

Possible fields:

```text
id
code
hostId
type
status
startTime
endTime
createdAt
```

Status:

```text
WAITING
ACTIVE
FINISHED
```

## RoomParticipant

Possible fields:

```text
roomId
userId
joinedAt
score
status
```

Potential unique constraint:

```text
(roomId, userId)
```

## RoomQuestion

Possible fields:

```text
roomId
problemId
order
points
```

## RoomSubmission

Possible fields:

```text
roomId
userId
problemId
code
status
score
runtime
submittedAt
```

The exact schema will be designed after checking existing models to avoid duplication.

---

# 9. Real-Time Architecture

Use HTTP for normal CRUD operations:

```text
POST /rooms
POST /rooms/:code/join
GET  /rooms/:id
POST /rooms/:id/start
POST /rooms/:id/end
```

Use WebSockets/Socket.IO for live events.

Potential events:

```text
USER_JOINED
USER_LEFT
ROOM_UPDATED
TEST_STARTED
SUBMISSION_RECEIVED
SUBMISSION_ACCEPTED
LEADERBOARD_UPDATED
TEST_FINISHED
```

---

# 10. Server Must Own Room State

Never trust the frontend for:

* Score
* Rank
* Timer
* Room status
* Test status
* Submission result
* Host privileges
* Participant identity

The server should be authoritative.

Frontend should primarily:

```text
Receive state/events
        ↓
Render state
```

---

# 11. Reconnection Handling

Real-time systems must handle:

* Browser refresh
* Temporary network loss
* WebSocket disconnect
* WebSocket reconnect
* Duplicate event delivery
* Stale client state
* Participant leaving
* Host disconnecting
* Server restart

After reconnect:

```text
Reconnect
   ↓
Authenticate
   ↓
Fetch current room state
   ↓
Resynchronize client
   ↓
Resume live events
```

Do not assume the client can reconstruct state only from missed events.

---

# 12. Leaderboard Design

Leaderboard scoring must be deterministic.

## Aptitude

Example scoring model:

```text
Correct  → +4
Wrong    → -1
Skipped  →  0
```

This is an example only; final scoring rules will be decided during implementation.

## Coding

Potential inputs:

* Test cases passed
* Problem points
* Submission status
* Submission time
* Optional time-based tie breaker

The backend calculates the score.

## Critical rule

**LLMs must not determine competitive leaderboard scores.**

AI can provide feedback, but competitive ranking should use deterministic backend logic.

---

# 13. Redis Plan

Redis should be introduced because the system needs it, not simply because it looks good on a resume.

Potential uses:

## Room presence

```text
room:{roomId}:participants
```

## Pub/Sub

For synchronizing WebSocket events across multiple backend instances.

## Rate limiting

Protect expensive APIs.

## Background jobs

Queue:

* AI evaluation
* Problem generation
* Code judging
* Other expensive work

## Temporary state

Possible short-lived room/timer information.

PostgreSQL remains the durable source of truth.

---

# 14. Future Scalable Architecture

Target architecture:

```text
                 Load Balancer
                       |
          ┌────────────┼────────────┐
          ↓            ↓            ↓
       Server A     Server B     Server C
          \            |            /
           \           |           /
                 Redis Pub/Sub
                       |
                 PostgreSQL
                       |
              External Services
              ├── Judge0
              └── LLM Provider
```

This architecture should only be claimed as a scalable design after the relevant components are actually implemented/tested.

---

# 15. Asynchronous Code Judging

The first implementation can be synchronous for correctness.

Later target:

```text
POST /submissions
        ↓
Create PENDING submission
        ↓
Queue job
        ↓
Redis/BullMQ
        ↓
Judge Worker
        ↓

Judge0
        ↓
PostgreSQL
        ↓
WebSocket/SSE
        ↓
Frontend
```

Benefits:

* API does not block
* Better concurrency
* Retries
* Failure recovery
* Easier scaling
* Better user experience

---

# 16. AI Interview Weaknesses

Current AI interview behavior is primarily based around:

```text
System Prompt
    +
Candidate Profile
    +
Conversation History
    +
Latest Answer
    ↓
LLM
    ↓
Next Response
```

This works as a prototype but should not yet be described as a sophisticated adaptive interview engine.

## Future improvement

Introduce an interview service/orchestrator responsible for:

* Interview state
* Question tracking
* Interview stage
* Follow-up decisions
* Difficulty progression
* Topic coverage
* Avoiding repeated questions
* Candidate context
* Conversation summarization
* Evaluation triggering

---

# 17. AI Output Validation

Never blindly trust LLM output.

Current risk:

```text
LLM
 ↓
JSON.parse()
 ↓
Database
```

Better:

```text
LLM
 ↓
Structured response
 ↓
Zod validation
 ↓
Business-rule validation
 ↓
Database
```

Validate:

* Required fields
* Score ranges
* String lengths
* Arrays
* Enum values
* Evaluation dimensions
* Missing fields
* Malformed responses

---

# 18. AI Failure Handling

Handle:

* Provider timeout
* Rate limiting
* Invalid response
* Malformed JSON
* Provider outage
* Token limits
* Context too large
* Network errors
* Retryable errors
* Non-retryable errors

Do not expose raw provider errors to users.

---

# 19. Background AI Evaluation

Current pattern is effectively:

```text
Interview completion
      ↓
evaluateInterview()
      ↓
Fire-and-forget
```

Problem:

If the server crashes, the evaluation can be lost.

Better:

```text
Interview complete
      ↓
Create evaluation job
      ↓
Redis queue
      ↓
Worker
      ↓
LLM
      ↓
Validate
      ↓
Save Evaluation
```

---

# 20. AI Problem Generation

Generated problems need validation.

Validate:

* Problem statement
* Constraints
* Examples
* Input format
* Output format
* Test cases
* Expected outputs
* Difficulty
* Duplicate problems

Ideally:

```text
Generate Problem
       ↓
Generate Solution
       ↓
Generate Test Cases
       ↓
Run Solution
       ↓
Verify Expected Outputs
       ↓
Publish
```

Do not blindly publish LLM-generated test cases.

---

# 21. Backend Architecture Improvements

Current routes contain too much responsibility in places.

Target:

```text
Route / Controller
        ↓
Validation
        ↓
Service
        ↓
Repository / DB
        ↓
External Service
```

Example:

```text
POST /submissions
        ↓
submissionSchema
        ↓
SubmissionService
        ↓
JudgeService
        ↓
Judge0
        ↓
SubmissionRepository
        ↓
PostgreSQL
```

Avoid overengineering.

---

# 22. Input Validation

Add validation to every important API.

Validate:

* JSON bodies
* Query parameters
* Route parameters
* IDs
* Enums
* Numeric ranges
* String lengths
* Array lengths
* Code size
* Room configuration
* File uploads

Recommended:

```text
Zod
```

Frontend validation is UX.

Backend validation is security/correctness.

---

# 23. Authentication & Authorization Audit

Verify:

* Authentication server-side
* Authorization server-side
* Resource ownership
* Admin permissions
* Room membership
* Host permissions
* Submission ownership
* Interview ownership
* Profile ownership

Examples:

```text
User A cannot access User B's interview.
User A cannot modify User B's submission.
User A cannot become room host by modifying frontend state.
Participant cannot start/end a room unless authorized.
```

---

# 24. Rate Limiting

Protect expensive endpoints.

Priority:

* Code execution
* AI generation
* AI evaluation
* Problem generation
* Login/auth endpoints
* Room creation
* Room joining
* Submission endpoint
* WebSocket connections

Redis is appropriate for distributed rate limiting.

---

# 25. Code Execution Security

This is a high-priority security area.

Candidate code is untrusted code.

Requirements:

* Isolated execution
* CPU limits
* Memory limits
* Wall-clock timeout
* Process/thread limits
* Network restrictions
* Filesystem restrictions
* No host filesystem access
* No secrets exposed
* No unnecessary privileges
* Output-size limits
* Temporary-file cleanup
* Process cleanup
* Concurrency limits
* Protection against infinite loops
* Protection against memory exhaustion
* Protection against huge output
* Container escape review

### Important existing concern

The current Judge0 Docker configuration uses privileged execution.

Before public deployment:

* Understand why it is required
* Review Judge0's security model
* Keep Judge0 isolated
* Do not expose Judge0 publicly
* Restrict network access
* Review container permissions
* Test the deployment threat model

---

# 26. Database Improvements

Review schema based on real query patterns.

## Indexes

Potential areas:

* User + createdAt
* User + problem
* User + problem + createdAt
* Interview + createdAt
* Chat + user
* Room + participant
* Room + question
* Room + submission
* Submission + user/problem

Do not add indexes blindly.

## Query optimization

Check:

* N+1 queries
* Large responses
* Missing pagination
* Unnecessary relations
* Unnecessary columns
* Repeated queries

## Transactions

Use transactions for critical multi-step operations:

* Creating room + participants/configuration
* Finalizing a test
* Updating leaderboard state
* Creating related submission records

---

# 27. Database Consistency

Handle race conditions such as:

```text
Two users join at exactly the same time.
Two submissions arrive at the same time.
Host starts while another user is joining.
Test expires while submission arrives.
Two requests attempt to update the same room.
```

Use:

* Transactions
* Unique constraints
* Atomic updates
* Appropriate locking/concurrency control
* Idempotency where required

---

# 28. Frontend Improvements

Clean up:

* Dead components
* Dead hooks
* Dead API functions
* Hardcoded localhost URLs
* Unused dependencies
* Duplicate state

Add:

* Loading states
* Error states
* Empty states
* Submission state
* Network error handling
* WebSocket reconnect handling
* Timer synchronization
* Disabled duplicate actions
* Responsive design
* Accessibility
* Keyboard navigation
* Proper form validation

Use environment configuration such as:

```text
VITE_API_URL
```

instead of hardcoded production-sensitive URLs.

---

# 29. WebSocket Client Quality

Handle:

* Connection
* Authentication
* Reconnection
* Cleanup
* Duplicate listeners
* Event ordering
* Stale state
* Resynchronization
* Memory leaks

Avoid:

```text
socket.on(...)
```

being registered repeatedly every render.

---

# 30. API Error Handling

Standardize errors.

Categories:

```text
400 Validation Error
401 Authentication Error
403 Authorization Error
404 Not Found
409 Conflict
429 Rate Limited
500 Internal Server Error
502 External Service Error
```

Never return:

* Stack traces
* DB connection details
* API keys
* Provider secrets
* Internal paths
* Sensitive query information

---

# 31. Security Headers / HTTP Security

Review:

* CORS
* HTTPS
* HSTS
* CSP
* X-Content-Type-Options
* Clickjacking protection
* Secure cookies
* HttpOnly cookies
* SameSite configuration
* Request size limits

Do not use unrestricted CORS in production unnecessarily.

---

# 32. Secrets Management

Ensure:

* `.env` never committed
* `.env.example` exists
* Secrets validated on startup
* Production secrets stored securely
* API keys rotated if exposed
* No secret in frontend code
* No secrets in logs
* No secrets in Git history

---

# 33. File Upload Security

For resumes/profile uploads:

* File-size limits
* Extension validation
* MIME validation
* Filename sanitization
* Secure storage
* Access authorization
* Malware scanning where appropriate
* Don't trust client MIME type
* Don't expose arbitrary filesystem paths

---

# 34. Data Privacy

Review storage and exposure of:

* Resume data
* Interview history
* Candidate profile
* Chat history
* AI evaluations
* Source code
* Submissions

Ensure:

* Users can only access their own private data
* Logs don't contain secrets
* Sensitive information is minimized
* Appropriate retention rules are considered

---

# 35. Performance

Measure before optimizing.

Important metrics:

* API latency
* DB latency
* LLM latency
* Judge latency
* WebSocket event latency
* Queue latency
* Concurrent submissions
* Concurrent users

Potential optimizations:

* Database indexes
* Pagination
* Redis caching
* Connection pooling
* Streaming
* Token optimization
* Query optimization
* Submission queues
* WebSocket event batching where appropriate

---

# 36. Observability

Add structured logging.

Track:

* Request ID
* API latency
* HTTP errors
* DB errors
* LLM failures
* Judge failures
* Queue failures
* WebSocket errors
* Redis errors

Later consider:

* Sentry
* OpenTelemetry
* Prometheus
* Grafana

Do not add monitoring tools just for resume keywords.

---

# 37. Testing Plan

## Unit tests

Test:

* Scoring
* Verdict mapping
* Validation
* Room state transitions
* Leaderboard calculations
* Utility functions

## Integration tests

Test:

* Authentication
* Authorization
* Database operations
* Submission pipeline
* Room lifecycle

## WebSocket tests

Test:

* Join
* Leave
* Start
* Submission events
* Leaderboard events
* Disconnect
* Reconnect

## AI tests

Mock the provider.

Test:

* Valid output
* Invalid JSON
* Timeout
* Provider failure
* Schema validation

---

# 38. Critical Edge Cases

Test:

* Duplicate room join
* Full room
* Invalid room code
* Joining after test starts
* Host disconnect
* Participant disconnect
* Reconnect
* Duplicate submission
* Simultaneous submissions
* Submission after test ends
* Test expires during submission
* Invalid source code
* Compilation error
* Runtime error
* Infinite loop
* Huge output
* Memory exhaustion
* Judge0 unavailable
* Redis unavailable
* Database unavailable
* LLM unavailable
* Malformed LLM output

---

# 39. Docker / Infrastructure

Review:

* Dockerfiles
* Multi-stage builds
* Production image size
* Non-root execution where possible
* Resource limits
* Network isolation
* Health checks
* Restart policies
* Service dependencies
* Production compose configuration
* Development vs production configuration

---

# 40. CI/CD

GitHub Actions should eventually run:

```text
Install
 ↓
Typecheck
 ↓
Lint
 ↓
Unit tests
 ↓
Integration tests
 ↓
Build
 ↓
Docker build
```

Deployment can be added after the application is stable.

---

# 41. Git Quality

Maintain:

* Meaningful commits
* Clean branches
* No `.env`
* No generated junk
* Clean migrations
* No abandoned experiments
* No commented-out dead code
* Clear commit messages

---

# 42. Code Quality

Target:

* TypeScript strict
* Minimal `any`
* ESLint clean
* Consistent naming
* Small functions
* Focused services
* No duplicated business logic
* No magic numbers
* No magic strings
* Shared types where appropriate
* Centralized validation
* Centralized errors
* Centralized external-provider clients

---

# 43. Documentation

README should eventually contain:

* Project overview
* Problem statement
* Features
* Architecture
* Tech stack
* Database architecture
* AI architecture
* Coding judge architecture
* Room architecture
* Redis architecture
* Authentication
* API overview
* WebSocket events
* Local setup
* Environment variables
* Docker setup
* Testing
* Deployment
* Known limitations

Additional documentation:

```text
PROJECT_OVERVIEW.md
ARCHITECTURE.md
DATABASE.md
API.md
WEBSOCKET.md
```

Only create documents that provide actual value.

---

# 44. Production Readiness Checklist

Before calling the project production-oriented:

* HTTPS
* Secure secrets
* Production PostgreSQL
* Redis
* Rate limiting
* Authentication audit
* Authorization audit
* Code-execution isolation
* Input validation
* Error handling
* Logging
* Monitoring
* Health endpoint
* Graceful shutdown
* DB backup strategy
* Migration strategy
* Resource limits
* Load testing
* Security testing

---

# 45. Load Testing

Eventually test:

```text
10 users
50 users
100 users
```

and multiple simultaneous rooms.

Measure:

* p50
* p95
* p99
* Throughput
* Error rate
* CPU
* Memory
* DB connections
* Redis performance

Do not put performance numbers on the resume until they are actually measured.

---

# 46. Engineering Interview Preparation

After implementation, be able to explain:

### Architecture

* Why monorepo?
* Why Hono?
* Why Bun?
* Why PostgreSQL?
* Why Prisma?
* Why Redis?
* Why Socket.IO?
* Why Judge0?
* Why Groq?

### Backend

* How does a request flow?
* How does authentication work?
* How does authorization work?
* How are errors handled?
* How do you validate requests?

### Database

* Why these tables?
* Why these relations?
* Why these indexes?
* How do transactions work?
* How do you prevent race conditions?
* How do you optimize queries?

### Coding Judge

* How do you execute arbitrary code safely?
* How do you compare output?
* How do hidden tests work?
* How do you determine verdicts?
* How do you enforce limits?
* How do you scale judging?

### Rooms

* How does a room work?
* Why WebSockets?
* How does reconnect work?
* Who owns the timer?
* Who calculates scores?
* How is the leaderboard consistent?
* What happens when two users submit simultaneously?

### Redis

* Why Redis?
* What data belongs in Redis?
* What belongs in PostgreSQL?
* How does Pub/Sub help?
* What happens if Redis fails?

### AI

* How does the interviewer work?
* How do you maintain context?
* How do you validate LLM output?
* What happens if the LLM fails?
* How do you prevent hallucinated evaluation data?

### Scaling

* What happens with multiple backend instances?
* How do WebSockets work behind a load balancer?
* How does Redis Pub/Sub synchronize instances?
* Where are the bottlenecks?

---

# 47. Resume Rules

Only claim what is true.

Avoid unsupported claims such as:

* "Highly scalable"
* "Production-ready"
* "Distributed system"
* "Secure code execution"
* "Advanced adaptive AI"
* "High-performance"
* "Real-time scalable architecture"

unless implementation and evidence support them.

Prefer measurable claims after testing:

```text
Reduced X from A ms to B ms
Supported N concurrent users in load testing
Processed N submissions
Achieved X% test coverage
Reduced query latency by X%
Handled N concurrent rooms
```

---

# 48. Recommended Implementation Order

## Phase 1 — Correctness

* [ ] Remove Voice
* [ ] Clean voice dependencies/routes
* [ ] Implement proper Judge0 service
* [ ] Load public + hidden test cases server-side
* [ ] Compare outputs
* [ ] Correct verdicts
* [ ] Persist submissions
* [ ] Persist runtime
* [ ] Persist memory where supported
* [ ] Add request validation
* [ ] Test AC
* [ ] Test WA
* [ ] Test CE
* [ ] Test RE
* [ ] Test TLE

## Phase 2 — Competitive Rooms

* [ ] Design room schema
* [ ] Create room
* [ ] Join room
* [ ] Leave room
* [ ] Host controls
* [ ] Start test
* [ ] End test
* [ ] Room configuration
* [ ] Socket.IO
* [ ] Server-authoritative state
* [ ] Timer
* [ ] Submission events
* [ ] Deterministic scoring
* [ ] Live leaderboard
* [ ] Final leaderboard
* [ ] Reconnection handling
* [ ] Race-condition handling

## Phase 3 — Infrastructure

* [ ] Redis
* [ ] Rate limiting
* [ ] Background jobs
* [ ] Async judging
* [ ] Async AI evaluation
* [ ] Retry logic
* [ ] Idempotency
* [ ] Error handling
* [ ] Structured logging

## Phase 4 — Security

* [ ] Auth audit
* [ ] Authorization audit
* [ ] Input validation
* [ ] Code execution isolation
* [ ] CORS
* [ ] Security headers
* [ ] Secrets
* [ ] File uploads
* [ ] Privacy
* [ ] Resource limits

## Phase 5 — Quality

* [ ] Unit tests
* [ ] Integration tests
* [ ] WebSocket tests
* [ ] Judge tests
* [ ] AI mock tests
* [ ] Edge-case tests
* [ ] TypeScript cleanup
* [ ] ESLint cleanup
* [ ] Dead-code removal
* [ ] Refactoring

## Phase 6 — Production

* [ ] Docker hardening
* [ ] CI/CD
* [ ] Deployment
* [ ] Health checks
* [ ] Monitoring
* [ ] Backups
* [ ] Graceful shutdown
* [ ] Load testing
* [ ] Security testing

## Phase 7 — Resume & Interview

* [ ] Measure performance
* [ ] Document architecture decisions
* [ ] Update architecture diagrams
* [ ] Update README
* [ ] Write accurate resume bullets
* [ ] Prepare project explanation
* [ ] Prepare system-design questions
* [ ] Prepare database questions
* [ ] Prepare Redis/WebSocket questions
* [ ] Prepare security questions
* [ ] Prepare AI questions
* [ ] Mock interview

---

# 49. Immediate Next Task

Do **not** implement everything in this document at once.

The immediate task is:

```text
STEP 1

Create JudgeService
       ↓
Replace current Piston execution path
       ↓
Connect Judge0
       ↓
Load all test cases
       ↓
Execute test cases
       ↓
Compare expected output
       ↓
Calculate verdict
       ↓
Persist Submission
       ↓
Test edge cases
```

After that:

```text
STEP 2
Async judging + Redis
```

Then:

```text
STEP 3
Competitive Room + Socket.IO
```

Then:

```text
STEP 4
Security + validation + rate limiting
```

Then:

```text
STEP 5
Testing + performance + production polish
```

---

# 50. Core Engineering Principle

The project should deliberately separate **probabilistic AI** from **deterministic system behavior**.

```text
                 INTERVUE
                    |
          ┌─────────┴─────────┐
          ↓                   ↓
      AI Layer          Deterministic Layer
          |                   |
   Interview            Code Judge
   Question Gen         Test Cases
   Evaluation           Scoring
   Feedback             Leaderboard
                        Timer
                        Room State
                        Submissions
```

### AI can be probabilistic.

### Competitive correctness cannot be.

The LLM should never be the authority for:

* Code verdict
* Testcase result
* Competitive score
* Leaderboard rank
* Timer
* Room state
* Authorization

This separation is one of the most important architectural principles for the project.

---

# 51. Definition of Done

Intervue should be considered "project-ready" when:

* Core features work reliably
* Coding judge produces correct deterministic verdicts
* Hidden tests are protected
* Competitive rooms work with multiple users
* Leaderboard is server-authoritative
* WebSocket reconnect works
* Authentication/authorization is verified
* Inputs are validated
* Expensive APIs are rate-limited
* Arbitrary code execution is properly isolated
* AI failures are handled
* Background jobs are reliable
* Database queries are reviewed
* Tests cover critical paths
* Docker/infrastructure is hardened
* Logs and errors are observable
* Performance has been measured
* Documentation matches implementation
* Resume claims are backed by actual implementation/evidence

---


