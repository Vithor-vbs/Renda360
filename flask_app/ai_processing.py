from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
import json

from flask_app.models import PDFExtractable, Transaction


def generate_data_embeddings(user_id, pdf_id):
    # Fetch structured data
    pdf = PDFExtractable.query.get(pdf_id)
    transactions = Transaction.query.filter_by(pdf_id=pdf_id).all()

    # Create composite documents
    documents = []

    # 1. Transaction-level documents
    for t in transactions:
        doc = f"Transaction on {t.date}: {t.description} | Amount: R${t.amount}"
        documents.append(doc)

    # 2. Statement summary document
    summary_doc = f"""
    Statement Period: {pdf.statement_period_start} to {pdf.statement_period_end}
    Total Purchases: R${pdf.total_purchases}
    Categories: {pdf.summary_json}
    Next Payment Due: {pdf.next_closing_date}
    """
    documents.append(summary_doc)

    # 3. Generate embeddings
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.create_documents(documents)

    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(chunks, embeddings)

    # Save to user-specific vector store path
    save_path = f"vectorstores/user_{user_id}"
    vectorstore.save_local(save_path)
