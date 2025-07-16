import os
import json
import logging
from datetime import datetime

from langchain_openai import ChatOpenAI
from langchain import hub
from langchain.agents import Tool, AgentExecutor, create_structured_chat_agent
from langchain.chains import RetrievalQA
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from .vector_store import FinancialVectorStore
from .query_executor import FinancialQueryExecutor


logger = logging.getLogger(__name__)


class FinancialQueryInput(BaseModel):
    query_type: str = Field(
        description="The type of query. Supported: 'largest_expenses', 'transactions_by_amount', 'spending_by_category'.")
    period: str | None = Field(
        default=None, description="Relative time period. Supported: 'last_month', 'this_month', 'last_30_days'.")
    limit: int = Field(
        default=5, description="The maximum number of results to return.")
    min_amount: float | None = Field(
        default=None, description="The minimum transaction amount.")
    max_amount: float | None = Field(
        default=None, description="The maximum transaction amount.")


class JuliusAI:
    def __init__(self, user_id):
        self.user_id = user_id
        try:
            self.vector_store = FinancialVectorStore(user_id)
            self.query_executor = FinancialQueryExecutor(user_id)
            self.llm = ChatOpenAI(
                temperature=0,
                model="gpt-4-1106-preview",
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )
            self.agent = self._create_agent()
        except Exception as e:
            logger.exception(f"JuliusAI initialization failed: {str(e)}")
            raise

    def _create_agent(self):
        """
        Creates a more robust agent using Pydantic schemas and modern LangChain components.
        """
        try:
            tools = [
                Tool(
                    name="FinancialKnowledgeBase",
                    func=self._retrieval_qa,
                    description="Use for general questions about financial health, spending patterns, or advice that don't require specific numbers or lists."
                ),
                StructuredTool.from_function(
                    func=self._direct_db_query,
                    name="FinancialDatabaseQuery",
                    description="Use to query the database for specific transactions, amounts, or summaries. Essential for questions asking for lists of expenses, totals, or data from a specific time period.",
                    args_schema=FinancialQueryInput
                )
            ]

            # This prompt is specifically designed for structured chat agents and contains
            # the required 'tools' and 'tool_names' variables.
            prompt = hub.pull("hwchase17/structured-chat-agent")

            agent = create_structured_chat_agent(self.llm, tools, prompt)

            return AgentExecutor(
                agent=agent,
                tools=tools,
                verbose=True,
                max_iterations=5,
                handle_parsing_errors=True
            )

        except Exception as e:
            logger.exception(f"Agent creation failed: {str(e)}")
            return None

    def _direct_db_query(self, query_type: str, period: str = None, limit: int = 5, min_amount: float = None, max_amount: float = None):
        """Executes a precise financial query against the database using structured inputs."""
        try:
            parameters = {
                "limit": limit, "period": period,
                "min_amount": min_amount, "max_amount": max_amount
            }
            parameters = {k: v for k, v in parameters.items() if v is not None}

            if query_type == "largest_expenses" and "period" not in parameters:
                parameters["period"] = "this_month"

            result = self.query_executor.execute_query(query_type, parameters)

            if isinstance(result, list):
                if not result:
                    return "No transactions found for the given criteria."
                # Make the output more conversational for the final answer
                return "\n".join(
                    f"On {t['date']}, a transaction for '{t['description']}' cost R${t['amount']}" for t in result
                )
            return json.dumps(result) if isinstance(result, dict) else str(result)

        except Exception as e:
            logger.exception(f"Direct DB query failed: {e}")
            return f"Query error: {str(e)}"

    def _retrieval_qa(self, query: str):
        try:
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vector_store.vectorstore.as_retriever(
                    search_kwargs={"k": 5, "filter": {"user_id": self.user_id}}
                )
            )
            result = qa_chain.invoke({"query": query})
            return result.get("result", "I could not find an answer in the knowledge base.")
        except Exception as e:
            logger.exception(f"Retrieval QA failed: {str(e)}")
            return "Sorry, I encountered an error with the knowledge base."

    def ask(self, question: str):
        """Main interface for asking questions using the robust agent executor."""
        context = "You are Julius, a financial assistant. Analyze the user's question and use your tools to provide a specific, data-driven answer."
        augmented_question = f"{context}\n\nQuestion: {question}"

        try:
            if not self.agent:
                return "I'm not properly initialized. Please try again later."

            # 4. USE agent.invoke WITH A DICTIONARY INPUT
            # This is the correct way to run modern AgentExecutors.
            response = self.agent.invoke({"input": augmented_question})
            return response.get("output", "I could not find an answer.")

        except Exception as e:
            logger.exception(f"Ask method failed: {str(e)}")
            return "Sorry, I encountered an error processing your request."


def update_embeddings_for_user(user_id, pdf_id=None):
    # This function remains unchanged
    vector_store = FinancialVectorStore(user_id)
    return vector_store.update_user_data(pdf_id)
