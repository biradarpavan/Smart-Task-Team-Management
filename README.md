# Smart Team Task & Workflow Manager

A modern, high-performance team collaboration platform designed to bridge the gap between complex project management and intuitive user experience. Built with a focus on real-time synchronization, role-based isolation, and a "human-first" design aesthetic.

---

## Why I Built This?
In a world of cluttered productivity tools, I wanted to create something that feels **alive and breathable**. This project isn't just about moving cards on a board; it's about team flow. It’s designed to help small to medium-sized teams stay organized without the overhead of enterprise-grade complexity, while maintaining a premium, "AI-enhanced" look and feel.

## Key Features
- **Project-Level Isolation**: Dedicated workspaces for different projects, ensuring that team members stay focused on what matters most.
- **Dynamic Kanban Engine**: Smooth drag-and-drop workflow powered by @hello-pangea/dnd for real-time status updates.
- **Smart Role-Based Access (RBAC)**: Fine-grained permissions where Admins and Managers control the structure, while Members focus on execution.
- **Integrated Team Chat**: Real-time private and group messaging to keep discussions right next to the tasks.
- **Live Notifications**: A "Bell" notification system that alerts users of reminders, assignments, and updates instantly.
- **Modern Dark Mode**: A meticulously crafted dark theme that reduces eye strain and looks stunning in low-light environments.
- **Plus Jakarta Sans Typography**: Premium, humanistic typography for superior readability and a high-tech aesthetic.

## Tech Stack
- **Frontend**: React 18, Vite, TailwindCSS (Vanilla UI components), Lucide Icons.
- **Backend**: Node.js, Express, Socket.io (Real-time engine).
- **Database**: MongoDB (Mongoose ODM).
- **Security**: JWT Authentication, Bcrypt password hashing.
- **Deployment**: Vercel (Frontend & Serverless Functions).

## Quick Start

### Prerequisites
- Node.js installed
- MongoDB URI (Atlas or local)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/smart-task-manager.git
cd smart-task-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with MONGO_URI, JWT_SECRET, and PORT=5000
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Create a .env file with VITE_API_URL=http://localhost:5000
npm run dev
....

## Humanistic Design Principles
This project adheres to modern design standards:
- **Glassmorphism**: Subtle blurs and translucent layers.
- **Micro-interactions**: Smooth transitions and hover effects that feel responsive to touch.
- **Negative Space**: Strategic use of white space to prevent cognitive overload.

## License
Distributed under the MIT License.

---
*Created with Passion by [Your Name]*
