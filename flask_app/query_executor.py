from datetime import datetime
import logging
from .models import db, Transaction, PDFExtractable, Card
from .utils import parse_relative_date

logger = logging.getLogger(__name__)


class FinancialQueryExecutor:
    def __init__(self, user_id):
        self.user_id = user_id

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
        query = Transaction.query.join(PDFExtractable).join(Card).filter(
            Card.user_id == self.user_id
        )

        if min_amount is not None:
            query = query.filter(Transaction.amount >= min_amount)
        if max_amount is not None:
            query = query.filter(Transaction.amount <= max_amount)
        if start_date:
            query = query.filter(Transaction.date >= start_date)
        if end_date:
            query = query.filter(Transaction.date <= end_date)

        transactions = query.all()

        return [{
            "id": t.id,
            "date": t.date,
            "description": t.description,
            "amount": t.amount,
            "pdf_id": t.pdf_id
        } for t in transactions]

    def _get_spending_by_category(self, start_date=None, end_date=None):
        """Get spending aggregated by category"""
        # This requires category data - you'll need to implement based on your data model
        # Placeholder implementation
        return {"categories": []}
