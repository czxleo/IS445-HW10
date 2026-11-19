# Tutorial 13: PostgreSQL I/O application

This app lists PRODUCT records, imports records from an uploaded CSV file, and downloads the table as export.csv.

## Set up the database

1. Create a Neon PostgreSQL database.
2. Open setup.sql in the Neon SQL Editor or run it with psql.
3. Replace the value in .env with your Neon connection string. Keep the variable name DATABASE_URL.
4. Install dependencies and start the app:

    npm install
    npm start

Open http://localhost:3000.

## Import example

Use sample_products.csv on the Input page. The file must contain four comma-separated fields per line: product ID, product name, description, and price.

The .env file is ignored by Git. Add your actual connection string to .env before creating the Canvas ZIP, and include that file in the ZIP. Do not commit the connection string to GitHub.
