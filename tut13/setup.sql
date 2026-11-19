CREATE TABLE IF NOT EXISTS PRODUCT (
    prod_id SERIAL PRIMARY KEY,
    prod_name VARCHAR(20) NOT NULL,
    prod_desc VARCHAR(50),
    prod_price NUMERIC
);

INSERT INTO PRODUCT (prod_id, prod_name, prod_desc, prod_price)
VALUES
    (101, 'Pen', 'Black Ink', 0.99),
    (102, 'Pencil', 'Yellow No. 2', 0.35),
    (103, 'Paper', 'College Rule', 1.10),
    (104, 'Eraser', 'Pink', 0.75),
    (105, 'Calculator', 'Scientific', 99.99),
    (106, 'Camera', 'Desktop 720p', 39.99),
    (107, 'Ruler', '12"', 4.75),
    (108, 'Stamps', 'Dozen', 6.60),
    (109, 'Notepad', '8.5 by 11', 2.95),
    (110, 'Charger', 'USB', 22.50)
ON CONFLICT (prod_id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('product', 'prod_id'),
    COALESCE(MAX(prod_id), 1),
    MAX(prod_id) IS NOT NULL
)
FROM PRODUCT;
