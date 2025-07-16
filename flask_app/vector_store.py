from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
import os
import logging
from langchain.docstore.document import Document
from .models import db, PDFExtractable, Transaction, Card

logger = logging.getLogger(__name__)


class FinancialVectorStore:
    def __init__(self, user_id):
        self.user_id = user_id
        self.save_path = f"vectorstores/user_{user_id}"
        os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
        self.embeddings = OpenAIEmbeddings()
        self.vectorstore = self._load_or_create_store()

    def _load_or_create_store(self):
        try:
            if os.path.exists(self.save_path):
                return FAISS.load_local(
                    self.save_path,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )

            # Create empty index
            return FAISS.from_texts(
                texts=[""],
                embedding=self.embeddings,
                metadatas=[{"type": "dummy"}]
            )
        except Exception as e:
            logger.error(f"Vector store initialization failed: {str(e)}")
            return FAISS.from_texts([""], self.embeddings)

    def update_user_data(self, pdf_id=None):
        try:
            """Update vector store with latest financial data"""
            # Fetch all PDFs for user
            pdfs = PDFExtractable.query.join(Card).filter(
                Card.user_id == self.user_id
            ).all()

            if not pdfs:
                logger.info(f"No PDFs found for user {self.user_id}")
                return 0

            documents = []
            for pdf in pdfs:
                # Skip if specific PDF is requested and doesn't match
                if pdf_id and pdf.id != pdf_id:
                    continue

                # Create document for PDF summary
                summary_doc = f"""
                Statement Period: {pdf.statement_period_start} to {pdf.statement_period_end}
                Total Purchases: R${pdf.total_purchases}
                Categories: {pdf.summary_json}
                Next Payment Due: {pdf.next_closing_date}
                """
                documents.append(Document(
                    page_content=summary_doc,
                    metadata={
                        "type": "summary",
                        "pdf_id": pdf.id,
                        "card_id": pdf.card_id
                    }
                ))

                # Add transactions
                transactions = Transaction.query.filter_by(pdf_id=pdf.id).all()
                for t in transactions:
                    transaction_doc = f"""
                    Transaction Date: {t.date}
                    Description: {t.description}
                    Amount: R${t.amount}
                    """
                    documents.append(Document(
                        page_content=transaction_doc,
                        metadata={
                            "type": "transaction",
                            "transaction_id": t.id,
                            "date": t.date,
                            "amount": t.amount,
                            "pdf_id": pdf.id
                        }
                    ))

            if not documents:
                logger.warning(
                    f"No documents generated for user {self.user_id}")
                return 0

            if documents:
                self.vectorstore.add_documents(documents)
                self.vectorstore.save_local(self.save_path)

            return len(documents)

        except Exception as e:
            logger.exception(f"Error updating user data: {str(e)}")
            return 0
