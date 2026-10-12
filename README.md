# hrd-smth

Web for hrd related stuff

## Running

Use provided `docker-compose.yml` for easy setup

### 1. Setup

>[!NOTE]
> Provided step by step uses [docker compose](https://docs.docker.com/compose/install) for running application


Clone Repository

```sh
git clone https://github.com/Sherwin-77/hrd-smth.git
cd hrd-smth
```

Inside `backend/` directory, copy `.env.example` to `.env`. Note that once created, the database will follow the provided `.env` config. Any modification after that will require altering database.

```sh
cd backend
cp .env.example .env
```

### 2. Running
Simply type `docker compose up`

### 3. (Optional) Seeding
Seeding initial superadmin is omitted from docker compose setup. If you wish to do so, run the following command
```sh
docker compose run --rm backend npm run seed
```
>[!NOTE]
> Make sure you already set the right credential for superadmin on `backend/.env` file
