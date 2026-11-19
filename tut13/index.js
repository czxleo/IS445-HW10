require("dotenv").config();

const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const multer = require("multer");

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];

    if (character === '"' && insideQuotes && line[i + 1] === '"') {
      field += '"';
      i += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  fields.push(field);
  return fields;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\r\n]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM PRODUCT ORDER BY PROD_ID");
    res.render("index", { message: "success", model: result.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).render("index", {
      message: "Error - " + err.message,
      model: []
    });
  }
});

app.get("/input", (req, res) => {
  res.render("input");
});

app.post("/input", upload.single("filename"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("Error: Import file not uploaded");
  }

  const lines = req.file.buffer
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return res.status(400).send("Error: The uploaded file is empty");
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    for (let i = 0; i < lines.length; i += 1) {
      const product = parseCsvLine(lines[i]);
      if (product.length !== 4) {
        throw new Error("Line " + (i + 1) + " must contain four fields.");
      }

      const prodId = Number(product[0]);
      const prodPrice = Number(product[3]);
      if (!Number.isInteger(prodId) || !Number.isFinite(prodPrice)) {
        throw new Error("Line " + (i + 1) + " has an invalid product ID or price.");
      }

      const sql =
        "INSERT INTO PRODUCT (prod_id, prod_name, prod_desc, prod_price) " +
        "VALUES ($1, $2, $3, $4)";
      await client.query(sql, [prodId, product[1], product[2], prodPrice]);
    }

    await client.query("COMMIT");
    return res.send("Processing Complete - Inserted " + lines.length + " records");
  } catch (err) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackErr) {
        console.error(rollbackErr.message);
      }
    }
    console.error(err.message);
    return res.status(400).send("Error: " + err.message);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.get("/output", (req, res) => {
  res.render("output", { message: "" });
});

app.post("/output", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM PRODUCT ORDER BY PROD_ID");
    const rows = result.rows.map((product) =>
      [
        product.prod_id,
        product.prod_name,
        product.prod_desc,
        product.prod_price
      ]
        .map(csvEscape)
        .join(",")
    );

    res.type("text/csv");
    res.attachment("export.csv");
    return res.send(rows.join("\r\n") + (rows.length ? "\r\n" : ""));
  } catch (err) {
    console.error(err.message);
    return res.status(500).render("output", {
      message: "Error - " + err.message
    });
  }
});

app.use((req, res) => {
  res.status(404).send("Page not found");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started (http://localhost:" + port + "/) !");
});
