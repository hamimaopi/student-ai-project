# Student AI Project

A role-reversal AI classroom simulator where students learn by teaching AI students.

Currently in **Phase 0 — Project Setup**.

## Tech Stack

- **Frontend:** React 19, Vite 6
- **Backend:** Java 17, Spring Boot 3.5.16, Spring AI 1.1.8, Maven
- **Database:** PostgreSQL 17, Spring Data JPA, Flyway
- **AI:** Ollama with Llama 3.1 8B (running locally)
- **Containerization:** Docker and Docker Compose

## Prerequisites

Make sure the following are installed:

- Java 17 and Maven
- Node.js and npm
- Docker Desktop
- Ollama

Download the AI model:

```bash
ollama pull llama3.1:8b
```

## Local Development

### 1. Initial Setup (First Time Only)

Clone the repository and navigate to the project root.

Make the development scripts executable:

```bash
chmod +x scripts/dev-start.sh scripts/dev-stop.sh
```

**Note:** If executable permissions are already committed to Git, you can skip the `chmod` command.

### 2. Start the Application

Make sure Docker Desktop is running.

From the project root:

```bash
./scripts/dev-start.sh
```

This automatically starts:

- PostgreSQL in Docker
- Ollama and Llama locally
- Spring Boot backend
- React frontend with Vite

### 3. Access the Application

| Service | URL |
|---|---|
| React Frontend | http://localhost:5173 |
| Spring Boot Backend | http://localhost:8080 |
| Backend Status | http://localhost:8080/api/system/status |

### 4. Stop the Application

```bash
./scripts/dev-stop.sh
```

This stops the development services without deleting PostgreSQL data or downloaded AI models.

## Project Structure

```text
student-ai-project/
├── frontend/              # React application
├── backend/               # Spring Boot application
├── scripts/
│   ├── dev-start.sh       # Start local development
│   ├── dev-stop.sh        # Stop local development
│   ├── start.sh           # Start Docker deployment
│   └── stop.sh            # Stop Docker deployment
├── compose.yaml
├── compose.dev.yaml
├── Dockerfile
└── .env.example
```

## Notes

- PostgreSQL data persists in a Docker volume.
- Ollama runs natively on macOS for GPU acceleration.
- React and Spring Boot run separately during development for faster hot reload and debugging.
- For containerized deployment, React is bundled into the Spring Boot JAR.
- Never commit `.env` or local credentials to Git.