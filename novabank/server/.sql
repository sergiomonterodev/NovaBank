CREATE DATABASE novabank;
USE novabank;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    account_number VARCHAR(20) UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    role ENUM('admin', 'user', 'reader') DEFAULT 'user'
);

CREATE TABLE movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    concept VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    target_account_number VARCHAR(20),
    type ENUM('income', 'expense') NOT NULL,
    date DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);