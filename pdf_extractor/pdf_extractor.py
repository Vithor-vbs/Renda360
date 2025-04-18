import pdfplumber
import re
from typing import List, Dict, Any, Optional
from datetime import datetime
import os


class PDFExtractor:
    """
    A class to extract information from PDF files, with special handling for Nubank statements.
    """

    def __init__(self, pdf_path: str):
        """
        Initialize the PDFExtractor with a PDF file path.

        Args:
            pdf_path (str): Path to the PDF file
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found at: {pdf_path}")

        self.pdf_path = pdf_path
        self.pdf = pdfplumber.open(pdf_path)

    def extract_all_text(self) -> str:
        """
        Extract all text from the PDF file.

        Returns:
            str: All extracted text
        """
        text = ""
        for page in self.pdf.pages:
            text += page.extract_text() + "\n\n"
        return text

    def extract_page_text(self, page_num: int) -> str:
        """
        Extract text from a specific page.

        Args:
            page_num (int): The page number (0-indexed)

        Returns:
            str: Text from the specified page
        """
        if page_num < 0 or page_num >= len(self.pdf.pages):
            raise ValueError(
                f"Page number {page_num} out of range. PDF has {len(self.pdf.pages)} pages.")

        return self.pdf.pages[page_num].extract_text()

    def extract_nubank_transactions(self) -> List[Dict[str, Any]]:
        """
        Extract Nubank transactions from the statement.

        Returns:
            List[Dict]: List of transaction dictionaries with date, description, and amount
        """
        transactions = []
        date_pattern = r'(\d{2}\s\w{3})'  # Pattern for dates like "27 Mar"
        # Pattern for amounts like "R$ 42.50" or "R$ -42.50"
        amount_pattern = r'R\$\s*(-?\d+[.,]\d{2})'

        for page in self.pdf.pages:
            text = page.extract_text()
            lines = text.split('\n')

            for i, line in enumerate(lines):
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

                    # Clean up description
                    description = re.sub(r'\s+', ' ', description)

                    transactions.append({
                        'date': date_str,
                        'description': description,
                        'amount': amount
                    })

        return transactions

    def extract_nubank_summary(self) -> Dict[str, Any]:
        """
        Extract summary information from a Nubank statement.

        Returns:
            Dict: Summary information including statement date, total, etc.
        """
        summary = {}

        # Try to extract statement date, total balance, etc.
        text = self.extract_all_text()

        # Find statement date
        statement_date_match = re.search(r'(\d{2}/\d{2}/\d{4})', text)
        if statement_date_match:
            summary['statement_date'] = statement_date_match.group(1)

        # Find total balance
        balance_match = re.search(r'Total\s+R\$\s*(-?\d+[.,]\d{2})', text)
        if balance_match:
            balance_str = balance_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_balance'] = float(balance_str)

        return summary

    def close(self):
        """
        Close the PDF file.
        """
        self.pdf.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class NubankExtractor(PDFExtractor):
    """
    A specialized extractor for Nubank statements.
    """

    def extract_income(self) -> float:
        """
        Extract total income (positive transactions) from the statement.

        Returns:
            float: Total income amount
        """
        transactions = self.extract_nubank_transactions()
        return sum(t['amount'] for t in transactions if t['amount'] > 0)

    def extract_expenses(self) -> float:
        """
        Extract total expenses (negative transactions) from the statement.

        Returns:
            float: Total expense amount (as a positive number)
        """
        transactions = self.extract_nubank_transactions()
        return abs(sum(t['amount'] for t in transactions if t['amount'] < 0))

    def extract_categories(self) -> Dict[str, float]:
        """
        Pretty trashy attempt to categorize expenses based on description keywords.

        Returns:
            Dict[str, float]: Categories and their total amounts
        """
        transactions = self.extract_nubank_transactions()
        categories = {
            'food': ['restaurante', 'ifood', 'mercado', 'supermercado', 'padaria'],
            'transport': ['uber', '99', 'taxi', 'combustível', 'combustivel', 'estacionamento', 'pedágio', 'pedagio'],
            'shopping': ['shopping', 'loja', 'magazine', 'americanas', 'amazon'],
            'entertainment': ['netflix', 'spotify', 'cinema', 'teatro', 'show'],
            'utilities': ['luz', 'água', 'agua', 'energia', 'telefone', 'internet', 'celular'],
            'health': ['farmácia', 'farmacia', 'médico', 'medico', 'hospital', 'consulta', 'exame'],
            'others': []
        }  # This isn't going to catch even half of the transactions, total horseshit - but it is a start

        categorized_expenses = {category: 0.0 for category in categories}

        for transaction in transactions:
            if transaction['amount'] < 0:
                amount = abs(transaction['amount'])
                description = transaction['description'].lower()

                categorized = False
                for category, keywords in categories.items():
                    if any(keyword in description for keyword in keywords):
                        categorized_expenses[category] += amount
                        categorized = True
                        break

                if not categorized:
                    categorized_expenses['others'] += amount

        return {k: v for k, v in categorized_expenses.items() if v > 0}

    def extract_statement_period(self) -> Dict[str, str]:
        """
        Extract the statement period (período vigente).

        Returns:
            Dict[str, str]: Start and end dates of the statement period
        """
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
        """
        Extract the current invoice summary (RESUMO DA FATURA ATUAL).

        Returns:
            Dict[str, float]: Summary information with amounts
        """
        text = self.extract_all_text()
        summary = {}

        # Previous invoice
        prev_invoice_match = re.search(
            r'Fatura anterior\s*R\$\s*(-?\d+[.,]\d{2})', text)
        if prev_invoice_match:
            amount_str = prev_invoice_match.group(
                1).replace('.', '').replace(',', '.')
            summary['previous_invoice'] = float(amount_str)

        # Payment received
        payment_match = re.search(
            r'Pagamento recebido\s*−R\$\s*(-?\d+[.,]\d{2})', text)
        if payment_match:
            amount_str = payment_match.group(
                1).replace('.', '').replace(',', '.')
            # Make it negative as it's a payment
            summary['payment_received'] = -float(amount_str)

        # Total purchases
        purchases_match = re.search(
            r'Total de compras de todos os cartões,.*?R\$\s*(-?\d+[.,]\d{2})', text)
        if purchases_match:
            amount_str = purchases_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_purchases'] = float(amount_str)

        # Other charges
        other_match = re.search(
            r'Outros lançamentos\s*−R\$\s*(-?\d+[.,]\d{2})', text)
        if other_match:
            amount_str = other_match.group(
                1).replace('.', '').replace(',', '.')
            summary['other_charges'] = -float(amount_str)  # Make it negative

        # Total to pay
        total_match = re.search(
            r'Total a pagar\s*R\$\s*(-?\d+[.,]\d{2})', text)
        if total_match:
            amount_str = total_match.group(
                1).replace('.', '').replace(',', '.')
            summary['total_to_pay'] = float(amount_str)

        return summary

    def extract_available_limits(self) -> Dict[str, float]:
        """
        Extract available limits information.

        Returns:
            Dict[str, float]: Total and available limits
        """
        text = self.extract_all_text()
        limits = {}

        # Total limit
        total_limit_match = re.search(
            r'R\$\s*(-?\d+[.,]\d{2}).*?Disponível', text)
        if total_limit_match:
            amount_str = total_limit_match.group(
                1).replace('.', '').replace(',', '.')
            limits['available_limit'] = float(amount_str)

        # Total credit limit
        credit_limit_match = re.search(
            r'Limite total.*?R\$\s*(-?\d+[.,]\d{2})', text)
        if credit_limit_match:
            amount_str = credit_limit_match.group(
                1).replace('.', '').replace(',', '.')
            limits['total_limit'] = float(amount_str)

        return limits

    def extract_next_invoices(self) -> Dict[str, Any]:
        """
        Extract information about next invoices.

        Returns:
            Dict[str, Any]: Next invoice closing date and balances
        """
        text = self.extract_all_text()
        next_invoices = {}

        # Next invoice closing date
        next_date_match = re.search(
            r'Fechamento da próxima fatura\s*(\d+\s+\w+\s+\d{4})', text)
        if next_date_match:
            next_invoices['next_closing_date'] = next_date_match.group(1)

        # Next invoice balance
        next_balance_match = re.search(
            r'Saldo em aberto da próxima fatura\s*R\$\s*(-?\d+[.,]\d{2})', text)
        if next_balance_match:
            amount_str = next_balance_match.group(
                1).replace('.', '').replace(',', '.')
            next_invoices['next_invoice_balance'] = float(amount_str)

        # Total open balance
        total_balance_match = re.search(
            r'Saldo em aberto total\s*R\$\s*(-?\d+[.,]\d{2})', text)
        if total_balance_match:
            amount_str = total_balance_match.group(
                1).replace('.', '').replace(',', '.')
            next_invoices['total_open_balance'] = float(amount_str)

        return next_invoices


# Example usage
if __name__ == "__main__":
    # Replace with the path to your PDF file
    pdf_path = "./Nubank_2025-03-27.pdf"

    try:
        with NubankExtractor(pdf_path) as extractor:
            # Extract all transactions
            transactions = extractor.extract_nubank_transactions()
            print(f"Found {len(transactions)} transactions")

            # Print a few sample transactions
            for i, transaction in enumerate(transactions[:100]):
                print(
                    f"{i+1}. {transaction['date']} - {transaction['description']} - R$ {transaction['amount']:.2f}")

            # Get summary info
            summary = extractor.extract_nubank_summary()
            print("\nStatement Summary:")
            for key, value in summary.items():
                print(f"{key}: {value}")

            # Get income and expenses
            income = extractor.extract_income()
            expenses = extractor.extract_expenses()
            print(f"\nTotal Income: R$ {income:.2f}")
            print(f"Total Expenses: R$ {expenses:.2f}")

            # Get categorized expenses
            categories = extractor.extract_categories()
            print("\nExpenses by category:")
            for category, amount in categories.items():
                print(f"{category}: R$ {amount:.2f}")

            period = extractor.extract_statement_period()
            print("\nStatement Period:")
            print(
                f"From {period.get('start_date')} to {period.get('end_date')}")

            # Extract invoice summary
            summary = extractor.extract_invoice_summary()
            print("\nInvoice Summary:")
            for key, value in summary.items():
                print(f"{key}: R$ {value:.2f}")

            # Extract available limits
            limits = extractor.extract_available_limits()
            print("\nAvailable Limits:")
            for key, value in limits.items():
                print(f"{key}: R$ {value:.2f}")

            # Extract next invoices info
            next_info = extractor.extract_next_invoices()
            print("\nNext Invoices:")
            for key, value in next_info.items():
                if isinstance(value, float):
                    print(f"{key}: R$ {value:.2f}")
                else:
                    print(f"{key}: {value}")

    except Exception as e:
        print(f"Error: {e}")
