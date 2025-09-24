import pdfplumber
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, date
import os
import json
import logging
from dataclasses import dataclass

from enum import Enum
logger = logging.getLogger(__name__)

# Brazilian month abbreviations for proper date parsing
PORTUGUESE_MONTHS = {
    'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
}


class TransactionCategory(Enum):
    """Enhanced categories with better matching"""
    FOOD_DELIVERY = "food_delivery"
    RESTAURANTS = "restaurants"
    GROCERIES = "groceries"
    TRANSPORT = "transport"
    FUEL = "fuel"
    SHOPPING_ONLINE = "shopping_online"
    SHOPPING_PHYSICAL = "shopping_physical"
    ENTERTAINMENT = "entertainment"
    SUBSCRIPTIONS = "subscriptions"
    UTILITIES = "utilities"
    HEALTH = "health"
    EDUCATION = "education"
    FINANCIAL_SERVICES = "financial_services"
    OTHERS = "others"


@dataclass
class NormalizedTransaction:
    """Properly structured transaction data"""
    date: date  # Normalized Python date object
    date_formatted: str  # Human-readable format: "2025-08-21"
    description: str  # Cleaned description
    description_original: str  # Original raw description
    amount: float  # Always positive for expenses, negative for credits
    category: TransactionCategory
    merchant: str  # Extracted merchant name
    is_installment: bool  # True if it's an installment payment
    installment_info: Optional[str]  # "2/6" for 2nd of 6 installments


class PDFExtractor:
    """
    A class to extract information from PDF files, with special handling for Nubank statements.
    """

    def __init__(self, pdf_path: str):
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

        self.pdf_path = pdf_path
        self.pdf = pdfplumber.open(pdf_path)

    def extract_all_text(self) -> str:
        text = ""
        for page in self.pdf.pages:
            text += page.extract_text() + "\n\n"
        return text

    def extract_page_text(self, page_num: int) -> str:
        if page_num < 0 or page_num >= len(self.pdf.pages):
            raise ValueError(
                f"Page number {page_num} out of range. PDF has {len(self.pdf.pages)} pages.")
        return self.pdf.pages[page_num].extract_text()

    def extract_nubank_transactions(self) -> List[Dict[str, Any]]:
        transactions = []
        date_pattern = r'^(\d{2}\s\w{3})\b'
        amount_pattern = r'R\$\s*(-?[\d\.]+,\d{2})'

        for page in self.pdf.pages:
            text = page.extract_text()
            lines = text.split('\n')

            for line in lines:
                # Skip lines that are not transactions
                if (
                    "vez" in line.lower()
                    or "entrada" in line.lower()
                    or re.search(r'\d{2}\s\w{3}\s*-\s*a\s*\d{2}\s\w{3}', line)
                ):
                    continue

                date_match = re.search(date_pattern, line)
                amount_match = re.search(amount_pattern, line)

                if date_match and amount_match:
                    date_str = date_match.group(1)
                    amount_str = amount_match.group(
                        1).replace('.', '').replace(',', '.')
                    amount = float(amount_str)

                    # Extract description (text between date and amount)
                    date_end = date_match.end()
                    amount_start = amount_match.start()
                    description = line[date_end:amount_start].strip()
                    description = re.sub(r'\s+', ' ', description)

                    transactions.append({
                        'date': date_str,
                        'description': description,
                        'amount': amount
                    })

        return transactions

    def extract_nubank_summary(self) -> Dict[str, Any]:
        summary = {}
        text = self.extract_all_text()

        # Find statement date
        statement_date_match = re.search(r'(\d{2}/\d{2}/\d{4})', text)
        if statement_date_match:
            summary['statement_date'] = statement_date_match.group(1)

        # Find total balance
        balance_match = re.search(r'Total\s+R\$\s*(-?[\d\.]+,\d{2})', text)
        if balance_match:
            balance_str = balance_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_balance'] = float(balance_str)

        return summary

    def close(self):
        self.pdf.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class NubankExtractor(PDFExtractor):
    """
    Enhanced Nubank statement extractor with intelligent categorization and data normalization.
    """

    def __init__(self, pdf_path: str, year: int = None):
        super().__init__(pdf_path)
        self.year = year or datetime.now().year
        self._category_patterns = self._initialize_category_patterns()
        self._merchant_patterns = self._initialize_merchant_patterns()

    def _initialize_category_patterns(self) -> Dict[TransactionCategory, List[str]]:
        """Comprehensive category patterns based on real Nubank transaction analysis"""
        return {
            TransactionCategory.FOOD_DELIVERY: [
                r'ifood', r'uber\s*eats', r'rappi', r'99\s*food', r'delivery',
                r'entrega', r'comida', r'lanche', r'pizza', r'burguer',
                r'mc\s*donald', r'bk\s', r'subway', r'domino'
            ],
            TransactionCategory.RESTAURANTS: [
                r'restaurante', r'rest\s', r'bar\s', r'cafe', r'café',
                r'lanchonete', r'sorveteria', r'padaria', r'confeitaria',
                r'churrascar', r'pizzaria', r'hamburger', r'self\s*service'
            ],
            TransactionCategory.GROCERIES: [
                r'mercado', r'supermercado', r'super\s', r'hipermercado',
                r'extra\s', r'carrefour', r'pao\s*de\s*acucar', r'big\s',
                r'walmart', r'atacadao', r'sam.*club', r'hortifruti',
                r'acougue', r'padaria.*pao', r'feira'
            ],
            TransactionCategory.TRANSPORT: [
                r'uber(?!\s*eats)', r'99(?!\s*food)', r'taxi', r'cabify',
                r'metro', r'onibus', r'brt', r'vlt', r'trem', r'cptm',
                r'bilhete\s*unico', r'riocard', r'cartao\s*transporte'
            ],
            TransactionCategory.FUEL: [
                r'posto\s', r'combustivel', r'gasolina', r'alcool', r'etanol',
                r'diesel', r'shell', r'petrobras', r'ipiranga', r'br\s*distribuidora',
                r'esso', r'texaco', r'raizen'
            ],
            TransactionCategory.SHOPPING_ONLINE: [
                r'amazon', r'mercado\s*livre', r'americanas', r'submarino',
                r'magazine\s*luiza', r'casas\s*bahia', r'extra\.com',
                r'shopee', r'aliexpress', r'ebay', r'olx', r'enjoei',
                r'zattini', r'netshoes', r'dafiti'
            ],
            TransactionCategory.SHOPPING_PHYSICAL: [
                r'shopping\s', r'loja\s', r'magazine\s(?!luiza)', r'riachuelo',
                r'renner', r'cea\s', r'marisa', r'pernambucanas', r'ricardo\s*eletro',
                r'fast\s*shop', r'fnac', r'livraria', r'papelaria'
            ],
            TransactionCategory.ENTERTAINMENT: [
                r'cinema', r'teatro', r'show', r'evento', r'ingresso',
                r'parque', r'clube', r'bar.*karaoke', r'boate', r'balada',
                r'festa', r'aniversario'
            ],
            TransactionCategory.SUBSCRIPTIONS: [
                r'netflix', r'spotify', r'amazon\s*prime', r'youtube\s*premium',
                r'disney\s*plus', r'globoplay', r'paramount', r'hbo', r'apple\s*music',
                r'deezer', r'assinatura', r'mensalidade', r'anuidade'
            ],
            TransactionCategory.UTILITIES: [
                r'light', r'enel', r'cemig', r'eletropaulo', r'energia',
                r'cedae', r'sabesp', r'agua', r'saneamento', r'esgoto',
                r'vivo', r'tim', r'claro', r'oi\s', r'telefone', r'celular',
                r'internet', r'banda\s*larga', r'fibra'
            ],
            TransactionCategory.HEALTH: [
                r'farmacia', r'drogaria', r'drogasil', r'pacheco', r'raia',
                r'hospital', r'clinica', r'laboratorio', r'medico', r'dr\.',
                r'consulta', r'exame', r'dentista', r'odonto', r'plano\s*saude'
            ],
            TransactionCategory.EDUCATION: [
                r'escola', r'universidade', r'faculdade', r'curso', r'colegio',
                r'ensino', r'educacao', r'matricula', r'mensalidade\s*escolar',
                r'livro', r'apostila', r'material\s*escolar'
            ],
            TransactionCategory.FINANCIAL_SERVICES: [
                r'banco\s', r'financeira', r'emprestimo', r'financiamento',
                r'cartao\s*credito', r'anuidade', r'tarifa', r'taxa',
                r'seguro', r'previdencia', r'investimento', r'corretora'
            ]
        }

    def _initialize_merchant_patterns(self) -> Dict[str, str]:
        """Common merchant name patterns for cleaner extraction"""
        return {
            r'UBER\s*EATS.*': 'Uber Eats',
            r'IFOOD.*': 'iFood',
            r'MC\s*DONALD.*': 'McDonald\'s',
            r'AMAZON.*': 'Amazon',
            r'MERCADO\s*LIVRE.*': 'Mercado Livre',
            r'NETFLIX.*': 'Netflix',
            r'SPOTIFY.*': 'Spotify',
            r'POSTO\s*[\w\s]*': 'Posto de Combustível',
        }

    def _parse_brazilian_date(self, date_str: str) -> Optional[date]:
        """Convert Brazilian date format to Python date object"""
        try:
            # Handle format like "21 AGO"
            match = re.match(
                r'(\d{1,2})\s+([A-Z]{3})', date_str.upper().strip())
            if match:
                day = int(match.group(1))
                month_abbr = match.group(2)
                month = PORTUGUESE_MONTHS.get(month_abbr)
                if month:
                    return date(self.year, month, day)
        except Exception as e:
            logger.warning(f"Failed to parse Brazilian date '{date_str}': {e}")
        return None

    def _normalize_description(self, raw_description: str) -> str:
        """Clean and normalize transaction description"""
        # Remove excessive whitespace
        normalized = re.sub(r'\s+', ' ', raw_description.strip())

        # Remove common Nubank artifacts
        normalized = re.sub(r'\*{2,}', '', normalized)
        normalized = re.sub(r'-{2,}', '', normalized)

        # Capitalize properly
        normalized = normalized.title()

        return normalized

    def _extract_merchant_name(self, description: str) -> str:
        """Extract clean merchant name from description"""
        # Try pattern matching first
        for pattern, clean_name in self._merchant_patterns.items():
            if re.search(pattern, description, re.IGNORECASE):
                return clean_name

        # Fallback: clean up the description
        merchant = description.strip()

        # Remove common suffixes
        merchant = re.sub(r'\s*(LTDA|S\.?A\.?|EIRELI|EPP).*$',
                          '', merchant, flags=re.IGNORECASE)

        # Remove location indicators
        # Remove state codes like "- SP"
        merchant = re.sub(r'\s*-\s*[A-Z]{2}$', '', merchant)

        # Take first meaningful part (usually merchant name)
        parts = merchant.split()
        if len(parts) > 3:
            merchant = ' '.join(parts[:3])

        return merchant.title()

    def _categorize_transaction(self, description: str) -> TransactionCategory:
        """Intelligent transaction categorization using enhanced patterns"""
        desc_lower = description.lower()

        # Remove accents for better matching
        import unicodedata
        desc_normalized = unicodedata.normalize('NFD', desc_lower)
        desc_normalized = ''.join(
            c for c in desc_normalized if unicodedata.category(c) != 'Mn')

        for category, patterns in self._category_patterns.items():
            for pattern in patterns:
                if re.search(pattern, desc_normalized, re.IGNORECASE):
                    return category

        return TransactionCategory.OTHERS

    def _detect_installment(self, description: str) -> tuple[bool, Optional[str]]:
        """Detect if transaction is an installment and extract info"""
        # Look for patterns like "2/6", "03/12", etc.
        installment_pattern = r'(\d{1,2})/(\d{1,2})'
        match = re.search(installment_pattern, description)

        if match:
            current = int(match.group(1))
            total = int(match.group(2))
            if current <= total and total > 1:
                return True, f"{current}/{total}"

        # Look for words indicating installments
        installment_words = ['parc', 'parcela']
        if any(word in description.lower() for word in installment_words):
            return True, None

        return False, None

    def extract_normalized_transactions(self) -> List[NormalizedTransaction]:
        """Extract and normalize all transactions with proper data types"""
        transactions = []
        date_pattern = r'^(\d{1,2}\s+\w{3})\b'
        amount_pattern = r'R\$\s*(-?[\d\.]+,\d{2})'

        for page in self.pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            lines = text.split('\n')

            for line in lines:
                # Skip obvious non-transaction lines
                if self._should_skip_line(line):
                    continue

                date_match = re.search(date_pattern, line)
                amount_match = re.search(amount_pattern, line)

                if date_match and amount_match:
                    # Extract date
                    date_str = date_match.group(1)
                    parsed_date = self._parse_brazilian_date(date_str)
                    if not parsed_date:
                        continue

                    # Extract amount
                    amount_str = amount_match.group(
                        1).replace('.', '').replace(',', '.')
                    try:
                        amount = float(amount_str)
                    except ValueError:
                        continue

                    # Extract description
                    date_end = date_match.end()
                    amount_start = amount_match.start()
                    raw_description = line[date_end:amount_start].strip()

                    if not raw_description:  # Skip empty descriptions
                        continue

                    # Normalize and process
                    normalized_desc = self._normalize_description(
                        raw_description)
                    merchant = self._extract_merchant_name(normalized_desc)
                    category = self._categorize_transaction(normalized_desc)
                    is_installment, installment_info = self._detect_installment(
                        raw_description)

                    transaction = NormalizedTransaction(
                        date=parsed_date,
                        date_formatted=parsed_date.strftime('%Y-%m-%d'),
                        description=normalized_desc,
                        description_original=raw_description,
                        amount=abs(amount),  # Always positive for consistency
                        category=category,
                        merchant=merchant,
                        is_installment=is_installment,
                        installment_info=installment_info
                    )

                    transactions.append(transaction)

        return transactions

    def _should_skip_line(self, line: str) -> bool:
        """Enhanced logic to skip non-transaction lines"""
        skip_patterns = [
            r'vez.*parcel',  # Installment summary lines
            r'entrada.*parcel',  # Entry payment lines
            r'\d{2}\s\w{3}\s*-\s*\d{2}\s\w{3}',  # Date range lines
            r'total\s*geral',  # Total lines
            r'saldo\s*(anterior|atual)',  # Balance lines
            r'limite\s*disponivel',  # Limit lines
            r'pagamento\s*minimo',  # Minimum payment lines
            r'vencimento',  # Due date lines
            r'^\s*$',  # Empty lines
            r'^[A-Z\s]{10,}$',  # Headers (all caps, long)
        ]

        line_lower = line.lower()
        return any(re.search(pattern, line_lower) for pattern in skip_patterns)

    def get_spending_by_category(self) -> Dict[str, float]:
        """Get spending totals by category with proper normalization"""
        transactions = self.extract_normalized_transactions()
        category_totals = {}

        for transaction in transactions:
            category_name = transaction.category.value
            if category_name not in category_totals:
                category_totals[category_name] = 0.0
            category_totals[category_name] += transaction.amount

        return {k: v for k, v in category_totals.items() if v > 0}

    def get_top_merchants(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top merchants by spending amount"""
        transactions = self.extract_normalized_transactions()
        merchant_totals = {}

        for transaction in transactions:
            merchant = transaction.merchant
            if merchant not in merchant_totals:
                merchant_totals[merchant] = {
                    'total_amount': 0.0,
                    'transaction_count': 0,
                    'category': transaction.category.value
                }
            merchant_totals[merchant]['total_amount'] += transaction.amount
            merchant_totals[merchant]['transaction_count'] += 1

        # Sort by total amount and return top N
        sorted_merchants = sorted(
            merchant_totals.items(),
            key=lambda x: x[1]['total_amount'],
            reverse=True
        )

        return [
            {
                'merchant': merchant,
                'total_amount': data['total_amount'],
                'transaction_count': data['transaction_count'],
                'category': data['category']
            }
            for merchant, data in sorted_merchants[:limit]
        ]

    def extract_categories(self) -> Dict[str, float]:
        """Legacy method for backward compatibility"""
        return self.get_spending_by_category()

    def extract_income(self) -> float:
        """Extract total income (credits) from transactions"""
        transactions = self.extract_normalized_transactions()
        # Credits are negative
        return sum(t.amount for t in transactions if t.amount < 0)

    def extract_expenses(self) -> float:
        """Extract total expenses from transactions"""
        transactions = self.extract_normalized_transactions()
        # Expenses are positive
        return sum(t.amount for t in transactions if t.amount > 0)

    def extract_statement_period(self) -> Dict[str, str]:
        text = self.extract_all_text()
        period_match = re.search(
            r'Período vigente:\s*(\d+\s+\w+)\s+a\s+(\d+\s+\w+)', text)

        if period_match:
            return {
                'start_date': period_match.group(1),
                'end_date': period_match.group(2)
            }
        return {}

    def extract_invoice_summary(self) -> Dict[str, float]:
        text = self.extract_all_text()
        summary = {}

        # Previous invoice
        prev_invoice_match = re.search(
            r'Fatura anterior\s*R\$\s*(-?[\d\.]+,\d{2})', text)
        if prev_invoice_match:
            amount_str = prev_invoice_match.group(
                1).replace('.', '').replace(',', '.')
            summary['previous_invoice'] = float(amount_str)

        # Payment received
        payment_match = re.search(
            r'Pagamento recebido\s*−?R\$\s*(-?[\d\.]+,\d{2})', text)
        if payment_match:
            amount_str = payment_match.group(
                1).replace('.', '').replace(',', '.')
            summary['payment_received'] = -float(amount_str)

        # Total purchases
        purchases_match = re.search(
            r'Total de compras de todos os cartões,.*?R\$\s*(-?[\d\.]+,\d{2})', text)
        if purchases_match:
            amount_str = purchases_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_purchases'] = float(amount_str)

        # Other charges
        other_match = re.search(
            r'Outros lançamentos\s*−?R\$\s*(-?[\d\.]+,\d{2})', text)
        if other_match:
            amount_str = other_match.group(
                1).replace('.', '').replace(',', '.')
            summary['other_charges'] = -float(amount_str)

        # Total to pay
        total_match = re.search(
            r'Total a pagar\s*R\$\s*(-?[\d\.]+,\d{2})', text)
        if total_match:
            amount_str = total_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_to_pay'] = float(amount_str)

        return summary

    def extract_available_limits(self) -> Dict[str, float]:
        text = self.extract_all_text()
        limits = {}

        # Find the line with "Limite total" and two BRL values
        pattern = r'Limite total\s+R\$\s*([\d\.]+,\d{2})\s+R\$\s*([\d\.]+,\d{2})'
        match = re.search(pattern, text)
        if match:
            used_str = match.group(1).replace('.', '').replace(',', '.')
            avail_str = match.group(2).replace('.', '').replace(',', '.')
            limits['used_limit'] = float(used_str)
            limits['available_limit'] = float(avail_str)

        # Optionally, you can still try to extract total_limit if it's elsewhere
        # For now, let's set total_limit as used + available if both are found
        if 'used_limit' in limits and 'available_limit' in limits:
            limits['total_limit'] = limits['used_limit'] + \
                limits['available_limit']

        return limits

    def extract_next_invoices(self) -> Dict[str, Any]:
        text = self.extract_all_text()
        next_invoices = {}

        # Next invoice closing date
        next_date_match = re.search(
            r'Fechamento da próxima fatura\s*(\d+\s+\w+\s+\d{4})', text)
        if next_date_match:
            next_invoices['next_closing_date'] = next_date_match.group(1)

        # Next invoice balance
        next_balance_match = re.search(
            r'Saldo em aberto da próxima fatura\s*R\$\s*(-?[\d\.]+,\d{2})', text)
        if next_balance_match:
            amount_str = next_balance_match.group(
                1).replace('.', '').replace(',', '.')
            next_invoices['next_invoice_balance'] = float(amount_str)

        # Total open balance
        total_balance_match = re.search(
            r'Saldo em aberto total\s*R\$\s*(-?[\d\.]+,\d{2})', text)
        if total_balance_match:
            amount_str = total_balance_match.group(
                1).replace('.', '').replace(',', '.')
            next_invoices['total_open_balance'] = float(amount_str)

        return next_invoices


# Example usage
if __name__ == "__main__":
    pdf_path = "./Nubank_2025-03-27.pdf"

    try:
        with NubankExtractor(pdf_path, year=2025) as extractor:
            # Use new normalized transactions method
            transactions = extractor.extract_normalized_transactions()
            print(f"Found {len(transactions)} normalized transactions")

            # Show first 10 with all normalized data
            for i, transaction in enumerate(transactions[:10]):
                print(f"\n{i+1}. Date: {transaction.date_formatted}")
                print(f"   Description: {transaction.description}")
                print(f"   Original: {transaction.description_original}")
                print(f"   Amount: R$ {transaction.amount:.2f}")
                print(f"   Merchant: {transaction.merchant}")
                print(f"   Category: {transaction.category.value}")
                if transaction.is_installment:
                    print(
                        f"   Installment: {transaction.installment_info or 'Yes'}")

            # Enhanced category analysis
            categories = extractor.get_spending_by_category()
            print(
                f"\n🏷️ Expenses by category ({len(categories)} categories found):")
            for category, amount in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                print(f"   {category}: R$ {amount:.2f}")

            # Top merchants analysis
            top_merchants = extractor.get_top_merchants(5)
            print(f"\n🏪 Top 5 merchants:")
            for merchant_data in top_merchants:
                print(
                    f"   {merchant_data['merchant']}: R$ {merchant_data['total_amount']:.2f}")
                print(
                    f"      ({merchant_data['transaction_count']} transactions, {merchant_data['category']})")

            # Legacy methods still work
            income = extractor.extract_income()
            expenses = extractor.extract_expenses()
            print(f"\n💰 Financial Summary:")
            print(f"   Total Income: R$ {income:.2f}")
            print(f"   Total Expenses: R$ {expenses:.2f}")
            print(f"   Net: R$ {income + expenses:.2f}")

            # Other extractions (unchanged)
            period = extractor.extract_statement_period()
            if period:
                print(f"\n📅 Statement Period:")
                print(
                    f"   From {period.get('start_date')} to {period.get('end_date')}")

            invoice_summary = extractor.extract_invoice_summary()
            if invoice_summary:
                print(f"\n🧾 Invoice Summary:")
                for key, value in invoice_summary.items():
                    print(f"   {key}: R$ {value:.2f}")

            limits = extractor.extract_available_limits()
            if limits:
                print(f"\n💳 Available Limits:")
                for key, value in limits.items():
                    print(f"   {key}: R$ {value:.2f}")

    except Exception as e:
        print(f"Error: {e}")
