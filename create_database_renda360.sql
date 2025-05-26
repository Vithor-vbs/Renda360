# Implementar isso nos models - preguiça de fazer :P
# temos que pensar melhor na organização dessas tabelas


CREATE TABLE client (
    client_id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL  
);

CREATE TABLE bank (
    bank_id SERIAL PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL,
    email_login VARCHAR(255) NOT NULL,
    ispb VARCHAR(100) NOT NULL
);

CREATE TABLE document_ctr (
    document_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_size_txt NUMERIC(10,0) NOT NULL,
    extension_type VARCHAR(20) NOT NULL,
    create_date TIMESTAMP NOT NULL,
    CONSTRAINT fk_client_document
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE
);

CREATE TABLE account (
    account_id SERIAL PRIMARY KEY,
    bank_id INTEGER NOT NULL,
    institution VARCHAR(255) NOT NULL,
    account_type VARCHAR(20) NOT NULL, 
    agency_number INTEGER NOT NULL,
    account_number INTEGER NOT NULL,
    account_digit INTEGER NOT NULL,
    titular_name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    client_id INTEGER NOT NULL,
    CONSTRAINT fk_client_account
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bank_account
        FOREIGN KEY (bank_id)
        REFERENCES bank(bank_id)
        ON DELETE CASCADE
);

CREATE TABLE authentication (
    auth_id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL UNIQUE,
    email_login VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    CONSTRAINT fk_client_auth
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE
);

CREATE TABLE auth_session (
    session_id SERIAL PRIMARY KEY,
    auth_id INTEGER NOT NULL,
    token_access VARCHAR(255) NOT NULL UNIQUE,
    token_expiration TIMESTAMP NOT NULL,
    login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_auth_session
        FOREIGN KEY (auth_id)
        REFERENCES authentication(auth_id)
        ON DELETE CASCADE
);

CREATE TABLE pf (
    client_id INTEGER PRIMARY KEY,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    rg VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    CONSTRAINT fk_client_pf
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE
);

CREATE TABLE pj (
    client_id INTEGER PRIMARY KEY,
    corporate_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    state_registration VARCHAR(50) NOT NULL,
    municipal_registration VARCHAR(50) NOT NULL,
    CONSTRAINT fk_client_pj
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE
);

CREATE TABLE address (
    address_id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL UNIQUE,
    street TEXT NOT NULL,
    number VARCHAR(10),
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state CHAR(2) NOT NULL,
    postal_code VARCHAR(8) NOT NULL,
    CONSTRAINT fk_client
        FOREIGN KEY (client_id)
        REFERENCES client(client_id)
        ON DELETE CASCADE
);

CREATE TABLE document_extract (
    extract_id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    extract_result JSONB,
    error_text TEXT,
    extract_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_document_extract
        FOREIGN KEY (document_id)
        REFERENCES document_ctr(document_id)
        ON DELETE CASCADE
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    date_transaction TIMESTAMP NOT NULL,
    category VARCHAR(30) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    document_id INT,
    CONSTRAINT fk_account_transaction
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_transaction
        FOREIGN KEY (document_id)
        REFERENCES document_ctr(document_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_category
        CHECK (category IN ('alimentacao', 'transporte', 'lazer', 'salario', 'outros')),
    CONSTRAINT chk_status
        CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
    CONSTRAINT chk_source_type
        CHECK (source_type IN ('manual', 'importado'))
);

CREATE TABLE general_data_account (
    general_data_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL,
    balance DECIMAL(12,2),
    credit_limit DECIMAL(12,2),
    due_date DATE,
    total_due DECIMAL(12,2),
    available_limit DECIMAL(12,2),
    previous_balance DECIMAL(12,2),
    savings_balance DECIMAL(12,2),
    closing_date DATE,
    source_type VARCHAR(20),
    document_id INT,
    CONSTRAINT fk_account_general_data
        FOREIGN KEY (account_id)
        REFERENCES account(account_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_general_data
        FOREIGN KEY (document_id)
        REFERENCES document_ctr(document_id)
        ON DELETE SET NULL
);

CREATE INDEX idx_client_email ON client(email);
CREATE INDEX idx_client_phone ON client(phone);
CREATE INDEX idx_address_postal_code ON address(postal_code);
CREATE INDEX idx_pf_cpf ON pf(cpf);
CREATE INDEX idx_pj_cnpj ON pj(cnpj);
CREATE INDEX idx_auth_email_login ON authentication(email_login);
CREATE INDEX idx_auth_session_token ON auth_session(token_access);
CREATE INDEX idx_auth_session_expiration ON auth_session(token_expiration);
CREATE INDEX idx_account_bank ON account(bank_id);
CREATE INDEX idx_transactions_date ON transactions(date_transaction);
CREATE INDEX idx_transactions_category ON transactions(category);

COMMENT ON TABLE client IS 'Stores basic client information for the Renda360 system, such as phone, email, and address.';
COMMENT ON TABLE bank IS 'Stores information about registered banking institutions.';
COMMENT ON TABLE document_ctr IS 'Stores documents uploaded by clients, linked to client_id.';
COMMENT ON TABLE account IS 'Stores information about clients'' bank accounts, linked to banks and clients.';
COMMENT ON TABLE authentication IS 'Stores authentication credentials, with a 1:1 relationship to client.';
COMMENT ON TABLE auth_session IS 'Stores authentication sessions, access tokens, and expiration dates.';
COMMENT ON TABLE pf IS 'Stores Individual (Pessoa Física) data (CPF, RG, birth date) linked to the client.';
COMMENT ON TABLE pj IS 'Stores Company (Pessoa Jurídica) data (CNPJ, corporate name, etc.) linked to the client.';
COMMENT ON TABLE address IS 'Stores detailed client addresses, 1:1 relationship.';
COMMENT ON TABLE document_extract IS 'Stores data extraction results from uploaded documents.';
COMMENT ON TABLE transactions IS 'Stores financial transactions for client accounts.';
COMMENT ON TABLE general_data_account IS 'Stores general data and balances for clients'' bank accounts.';