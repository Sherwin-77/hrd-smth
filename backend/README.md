# HRD Backend

This includes everything needed to run hrd smth web

## Running

Before running, ensure you copied `.env.example` to `.env` and fill out the config.
By default, the database config follows docker compose env config. If you use docker compose, don't forget to change `docker-compose.yml` env once you change `.env` database config.

There are multiple way to run the server, you can either run it locally or use defined docker compose, or combination of both (run docker compose for db only and the rest run locally)

### Database

For database, you can either use ur own Postgres database or run from docker compose using `docker compose up` or `docker compose up db` for database only.

Make sure you fill out the correct configuration on `.env` field.

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
```

### Backend

Starting the server can either using docker compose through `docker compose up` or through several step below:

- If you wish to run production, make sure to do `npm install`, `npm run build`, and `npm run start:prod`
- If running for development, it's better to use `npm start:dev`

### Seeding

The endpoint doesn't provide any registration flow, it is recommended to use seeding feature, and start adding employee through that account.

Make sure you fill out the correct information, especially email and password on `.env` field.
```env
SEED_SUPERADMIN_EMAIL=
SEED_SUPERADMIN_PASSWORD=
SEED_SUPERADMIN_NAME=
SEED_SUPERADMIN_PHONE=
SEED_SUPERADMIN_ADDRESS=
SEED_SUPERADMIN_SEX=
SEED_SUPERADMIN_BIRTH_DATE=
SEED_SUPERADMIN_JOIN_AT=
```