from datetime import datetime
import logging
import os
import re
from flask import current_app, has_app_context
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import db, Transaction, PDFExtractable, Card
from .utils import parse_relative_date

logger = logging.getLogger(__name__)

# Portuguese month abbreviations mapping
PORTUGUESE_MONTHS = {
    'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
    'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
}


class FinancialQueryExecutor:
    def __init__(self, user_id):
        self.user_id = user_id
        self._session = None

    def _parse_portuguese_date(self, date_str, year=2025):
        """Parse Portuguese date format like '21 AGO' to datetime"""
        try:
            # Extract day and month from string like "21 AGO"
            match = re.match(r'(\d+)\s+([A-Z]{3})', date_str.upper().strip())
            if match:
                day = int(match.group(1))
                month_abbr = match.group(2)
                month = PORTUGUESE_MONTHS.get(month_abbr)
                if month:
                    return datetime(year, month, day).date()
        except Exception as e:
            logger.warning(f"Failed to parse date '{date_str}': {e}")
        return None

    def _is_date_in_range(self, date_str, start_date, end_date):
        """Check if a Portuguese date string is within the given range"""
        if not start_date or not end_date:
            return True

        parsed_date = self._parse_portuguese_date(date_str)
        if not parsed_date:
            return False

        # Convert string dates to date objects if needed
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()

        return start_date <= parsed_date <= end_date

    def _get_session(self):
        """Get a database session that works both inside and outside Flask context"""
        if has_app_context():
            return db.session
        else:
            # Create a standalone session if outside Flask context
            if not self._session:
                from dotenv import load_dotenv
                load_dotenv()
                database_uri = os.getenv('DATABASE_URI')
                engine = create_engine(database_uri)
                Session = sessionmaker(bind=engine)
                self._session = Session()
            return self._session

    def execute_query(self, query_type, parameters):
        """Execute structured financial queries"""
        try:
            if "period" in parameters:
                start_date, end_date = parse_relative_date(
                    parameters["period"])
                parameters["start_date"] = start_date
                parameters["end_date"] = end_date

            if query_type == "transactions_by_amount":
                return self._get_transactions_by_amount(
                    min_amount=parameters.get("min_amount"),
                    max_amount=parameters.get("max_amount"),
                    start_date=parameters.get("start_date"),
                    end_date=parameters.get("end_date")
                )
            elif query_type == "spending_by_category":
                return self._get_spending_by_category(
                    start_date=parameters.get("start_date"),
                    end_date=parameters.get("end_date")
                )
            elif query_type == "largest_expenses":
                return self._get_largest_expenses(
                    limit=parameters.get("limit", 5),
                    start_date=parameters.get("start_date"),
                    end_date=parameters.get("end_date")
                )
            elif query_type == "total_spending":
                return self._get_summary_stats(
                    start_date=parameters.get("start_date"),
                    end_date=parameters.get("end_date")
                )
            else:
                return {"error": f"Unsupported query type: {query_type}"}
        except Exception as e:
            return {"error": f"Query execution failed: {str(e)}"}

    def _get_largest_expenses(self, limit=5, start_date=None, end_date=None):
        """Get the largest expenses in a period"""
        # Get all transactions in the period
        transactions = self._get_transactions_by_amount(
            min_amount=0.01,  # Minimum amount to filter out credits/zero
            max_amount=None,
            start_date=start_date,
            end_date=end_date
        )
        print(f"Found {len(transactions)} transactions for user {self.user_id}")
        for t in transactions[:5]:
            print(f"- {t['date']} {t['description']}: {t['amount']}")

        # Sort by amount descending
        transactions.sort(key=lambda t: t["amount"], reverse=True)

        # Return top results
        return transactions[:limit]

    def _get_summary_stats(self, start_date=None, end_date=None):
        """Get summary statistics for a period"""
        transactions = self._get_transactions_by_amount(
            min_amount=0.01,
            max_amount=None,
            start_date=start_date,
            end_date=end_date
        )

        total = sum(t["amount"] for t in transactions)
        average = total / len(transactions) if transactions else 0
        count = len(transactions)

        return {
            "total_spending": total,
            "average_transaction": average,
            "transaction_count": count
        }

    def _get_transactions_by_amount(self, min_amount=None, max_amount=None, start_date=None, end_date=None):
        """Get transactions filtered by amount and date range"""
        session = self._get_session()
        query = session.query(Transaction).join(PDFExtractable).join(Card).filter(
            Card.user_id == self.user_id
        )

        # Apply amount filters in the database
        if min_amount is not None:
            query = query.filter(Transaction.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Transaction.amount <= max_amount)

        transactions = query.all()

        # Convert to list and filter by date in Python (since dates are stored as strings)
        result = []
        for t in transactions:
            # Apply date filtering in Python
            if start_date or end_date:
                if not self._is_date_in_range(t.date, start_date, end_date):
                    continue

            # Convert Portuguese date to a more readable format
            parsed_date = self._parse_portuguese_date(t.date)
            formatted_date = parsed_date.strftime(
                "%Y-%m-%d") if parsed_date else t.date

            result.append({
                "id": t.id,
                "date": formatted_date,
                "description": t.description,
                "amount": float(t.amount),
                "pdf_id": t.pdf_id
            })

        return result

    def _get_spending_by_category(self, start_date=None, end_date=None):
        """Get spending aggregated by category"""
        # This requires category data - you'll need to implement based on your data model
        # Placeholder implementation
        return {"categories": []}
