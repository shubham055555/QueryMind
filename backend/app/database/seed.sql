INSERT INTO customers (name, email, signup_date, city)
SELECT
    'Customer ' || i,
    'customer' || i || '@example.com',
    CURRENT_DATE - ((i * 7) % 900),
    (ARRAY['Delhi','Gurgaon','Mumbai','Bangalore','Pune','Hyderabad','Chennai','Noida'])[1 + ((i - 1) % 8)]
FROM generate_series(1, 100) AS s(i);

INSERT INTO products (name, category, price)
SELECT
    'Product ' || i,
    (ARRAY['Electronics','Clothing','Home','Books','Sports'])[1 + ((i - 1) % 5)],
    ROUND((500 + ((i * 137) % 45000))::numeric, 2)
FROM generate_series(1, 30) AS s(i);

INSERT INTO orders (customer_id, order_date, total_amount, status)
SELECT
    1 + ((i - 1) % 100),
    CURRENT_DATE - ((i * 3) % 365),
    ROUND((500 + ((i * 173) % 20000))::numeric, 2),
    (ARRAY['completed','completed','completed','pending','cancelled'])[1 + ((i - 1) % 5)]
FROM generate_series(1, 300) AS s(i);

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT
    o.order_id,
    1 + ((o.order_id * 7) % 30),
    1 + (o.order_id % 4),
    p.price
FROM orders o
JOIN products p
    ON p.product_id = 1 + ((o.order_id * 7) % 30);

INSERT INTO payments (order_id, amount, payment_date, payment_status)
SELECT
    order_id,
    total_amount,
    order_date,
    CASE
        WHEN status = 'completed' THEN 'paid'
        WHEN status = 'pending' THEN 'pending'
        ELSE 'failed'
    END
FROM orders;
