# GeneScope 

A full-stack bioinformatics web application for uploading, storing, searching, and analyzing DNA/RNA sequences — with integrated NCBI BLAST support.

> **Live Demo:** [coming soon]

---

## Screenshots

<!-- Add a screenshot here once deployed -->

---

## Features

- **FASTA Upload** — drag and drop or browse to upload `.fasta`, `.fa`, or `.fna` files; sequences are parsed and stored instantly
- **Sequence Browser** — paginated, searchable list of all stored sequences with base pair length
- **NCBI BLAST Integration** — submit any nucleotide sequence to NCBI BLAST and poll for alignment results in real time
- **Statistics Dashboard** — charts showing upload history and sequence length distribution across your database

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI v7 |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas (Mongoose) |
| Charts | Recharts |
| External API | NCBI BLAST (blastn, nt database) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- A MongoDB Atlas account and cluster

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/genescope-web.git
cd genescope-web
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:
```
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3001
```

Start the server:
```bash
node index.js
```

### 3. Set up the frontend
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
genescope-web/
├── client/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── UploadPage.tsx
│   │   │   ├── SequencesPage.tsx
│   │   │   ├── BlastPage.tsx
│   │   │   └── StatsPage.tsx
│   │   ├── api.ts          # Centralized API service
│   │   └── App.tsx
│   └── vite.config.ts
└── server/                 # Node.js + Express backend
    ├── models/
    │   └── Sequence.js     # Mongoose schema
    └── index.js            # Express routes
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload and parse a FASTA file |
| GET | `/sequences` | Get paginated + searchable sequences |
| GET | `/sequences/:id` | Get a single sequence by ID |
| POST | `/blast` | Submit a sequence to NCBI BLAST |
| GET | `/blast/:rid` | Poll BLAST job status |
| GET | `/stats` | Get database statistics |

---

## License

MIT