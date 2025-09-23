import logging
import re
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy import text
import hashlib

logger = logging.getLogger(__name__)


class BrazilianFinancialQueryGenerator:
    """
    Smart query generator optimized for Portuguese and cost efficiency
    """

    def __init__(self, user_id: int, session_factory):
        self.user_id = user_id
        self.session_factory = session_factory

        # Cached query patterns to avoid API calls
        self.query_patterns = self._initialize_query_patterns()

        # Portuguese financial terms mapping
        self.portuguese_terms = self._initialize_portuguese_terms()

        # Query cache to avoid regenerating similar queries
        self.query_cache = {}

        # Only use OpenAI for complex queries that can't be pattern-matched
        self.llm = None  # Initialize only when needed

    def _get_llm(self):
        """Lazy initialization of LLM to avoid unnecessary API connections"""
        if self.llm is None:
            from langchain_openai import ChatOpenAI
            self.llm = ChatOpenAI(
                temperature=0,
                model="gpt-3.5-turbo",  # Cheaper than GPT-4
                max_tokens=300  # Limit tokens to control costs
            )
        return self.llm

    def _initialize_query_patterns(self) -> Dict[str, Dict]:
        """
        Pre-defined query patterns for common Portuguese questions
        This avoids API calls for 80%+ of common queries
        """
        return {
            # Gastos/Despesas queries
            "maiores_gastos": {
                "keywords": ["maiores gastos", "maiores despesas", "mais gastei", "maior gasto", "gastos mais altos"],
                "sql_template": """
                    SELECT t.date, t.description, t.amount
                    FROM transaction t
                    JOIN pdf_extractable p ON t.pdf_id = p.id
                    JOIN card c ON p.card_id = c.id
                    WHERE c.user_id = :user_id
                    AND t.amount > 0.01
                    ORDER BY t.amount DESC
                    LIMIT {limit}
                """,
                "query_type": "list",
                "default_params": {"limit": 10}
            },

            "total_gasto": {
                "keywords": ["quanto gastei", "total gasto", "soma dos gastos", "valor total", "total de gastos"],
                "sql_template": """
                    SELECT 
                        SUM(t.amount) as total_gasto,
                        COUNT(*) as num_transacoes,
                        AVG(t.amount) as gasto_medio
                    FROM transaction t
                    JOIN pdf_extractable p ON t.pdf_id = p.id
                    JOIN card c ON p.card_id = c.id
                    WHERE c.user_id = :user_id
                    AND t.amount > 0.01
                """,
                "query_type": "aggregation",
                "default_params": {}
            },

            "ultimas_transacoes": {
                "keywords": ["últimas transações", "ultimas transacoes", "últimos gastos", "transações recentes", "gastos recentes"],
                "sql_template": """
                    SELECT t.date, t.description, t.amount
                    FROM transaction t
                    JOIN pdf_extractable p ON t.pdf_id = p.id
                    JOIN card c ON p.card_id = c.id
                    WHERE c.user_id = :user_id
                    AND t.amount > 0.01
                    ORDER BY t.date DESC, t.amount DESC
                    LIMIT {limit}
                """,
                "query_type": "list",
                "default_params": {"limit": 15}
            },

            "gastos_acima_valor": {
                "keywords": ["gastos acima", "transações acima", "maior que", "superior a", "mais de"],
                "sql_template": """
                    SELECT t.date, t.description, t.amount
                    FROM transaction t
                    JOIN pdf_extractable p ON t.pdf_id = p.id
                    JOIN card c ON p.card_id = c.id
                    WHERE c.user_id = :user_id
                    AND t.amount >= {min_amount}
                    ORDER BY t.amount DESC
                    LIMIT {limit}
                """,
                "query_type": "list",
                "default_params": {"limit": 15, "min_amount": 100}
            },

            "transacoes_periodo": {
                "keywords": ["transações", "compras", "gastos do", "movimentação", "atividade"],
                "sql_template": """
                    SELECT t.date, t.description, t.amount
                    FROM transaction t
                    JOIN pdf_extractable p ON t.pdf_id = p.id
                    JOIN card c ON p.card_id = c.id
                    WHERE c.user_id = :user_id
                    AND t.amount > 0.01
                    ORDER BY t.date DESC, t.amount DESC
                    LIMIT {limit}
                """,
                "query_type": "list",
                "default_params": {"limit": 20}
            }
        }

    def _initialize_portuguese_terms(self) -> Dict[str, str]:
        """
        Mapping of Portuguese terms to standardized periods
        """
        return {
            # Períodos temporais
            "mês passado": "last_month",
            "último mês": "last_month",
            "mes passado": "last_month",
            "mês anterior": "last_month",

            "este mês": "this_month",
            "neste mês": "this_month",
            "mês atual": "this_month",
            "esse mês": "this_month",

            "últimos 30 dias": "last_30_days",
            "ultimos 30 dias": "last_30_days",
            "30 dias": "last_30_days"
        }

    def generate_query(self, question: str, context: Dict = None) -> Dict[str, Any]:
        """
        Generate optimized query with minimal API usage
        """

        # Normalize question
        question_normalized = self._normalize_question(question)

        # Create cache key
        cache_key = self._create_cache_key(question_normalized, context)

        # Check cache first
        if cache_key in self.query_cache:
            logger.info("Using cached query pattern")
            return self.query_cache[cache_key]

        # Try pattern matching first (no API call)
        pattern_result = self._match_query_pattern(
            question_normalized, context)

        if pattern_result:
            logger.info("Matched predefined pattern - no API call needed")
            self.query_cache[cache_key] = pattern_result
            return pattern_result

        # Only use LLM for complex queries that don't match patterns
        logger.info("Using LLM for complex query - API call required")
        llm_result = self._generate_with_llm(question_normalized, context)

        # Cache the result
        self.query_cache[cache_key] = llm_result
        return llm_result

    def _normalize_question(self, question: str) -> str:
        """
        Normalize Portuguese question for better pattern matching
        """
        normalized = question.lower().strip()

        # Remove accents for better matching
        accent_map = {
            'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a',
            'é': 'e', 'ê': 'e',
            'í': 'i',
            'ó': 'o', 'ô': 'o', 'õ': 'o',
            'ú': 'u',
            'ç': 'c'
        }

        for accented, normal in accent_map.items():
            normalized = normalized.replace(accented, normal)

        return normalized

    def _match_query_pattern(self, question: str, context: Dict = None) -> Optional[Dict[str, Any]]:
        """
        Match question against predefined patterns (no API cost)
        """

        # Extract time period
        period_info = self._extract_period_from_question(question)

        # Extract value information
        value_info = self._extract_value_from_question(question)

        # Match against patterns
        for pattern_name, pattern_config in self.query_patterns.items():
            for keyword in pattern_config["keywords"]:
                if keyword in question:
                    # Build query from pattern
                    query_result = self._build_query_from_pattern(
                        pattern_config,
                        period_info,
                        value_info,
                        context
                    )

                    query_result["pattern_matched"] = pattern_name
                    query_result["api_cost"] = 0  # No API call

                    return query_result

        return None

    def _extract_period_from_question(self, question: str) -> Dict[str, Any]:
        """
        Extract time period from Portuguese question
        """
        period_info = {"period": None, "start_date": None, "end_date": None}

        # Check for specific periods
        for term, period in self.portuguese_terms.items():
            if term in question:
                if period in ["last_month", "this_month", "last_30_days"]:
                    period_info["period"] = period
                    start_date, end_date = self._parse_relative_date(period)
                    period_info["start_date"] = start_date
                    period_info["end_date"] = end_date
                    break

        return period_info

    def _extract_value_from_question(self, question: str) -> Dict[str, Any]:
        """
        Extract monetary values from Portuguese question
        """
        value_info = {"min_amount": None, "max_amount": None}

        # Look for patterns like "acima de R$ 100", "maior que 50 reais"
        value_patterns = [
            r"acima de r?\$?\s*(\d+(?:,\d{2})?)",
            r"maior que r?\$?\s*(\d+(?:,\d{2})?)",
            r"superior a r?\$?\s*(\d+(?:,\d{2})?)",
            r"mais de r?\$?\s*(\d+(?:,\d{2})?)",
            r"r?\$?\s*(\d+(?:,\d{2})?) ou mais"
        ]

        for pattern in value_patterns:
            match = re.search(pattern, question, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    value_info["min_amount"] = float(amount_str)
                    break
                except ValueError:
                    continue

        return value_info

    def _build_query_from_pattern(self, pattern_config: Dict, period_info: Dict,
                                  value_info: Dict, context: Dict = None) -> Dict[str, Any]:
        """
        Build SQL query from matched pattern
        """

        # Start with base SQL template
        sql_template = pattern_config["sql_template"]
        params = pattern_config["default_params"].copy()

        # Add value filters
        if value_info["min_amount"]:
            params["min_amount"] = value_info["min_amount"]

        # Format SQL with parameters
        sql_query = sql_template.format(**params)

        return {
            "sql_query": sql_query,
            "query_type": pattern_config["query_type"],
            "expected_format": "table" if pattern_config["query_type"] == "list" else "summary",
            "post_processing": {
                "filter_dates": period_info["start_date"] is not None,
                "period_start": period_info["start_date"],
                "period_end": period_info["end_date"],
                "min_amount": value_info.get("min_amount")
            },
            "params": {"user_id": self.user_id}
        }

    def _generate_with_llm(self, question: str, context: Dict = None) -> Dict[str, Any]:
        """
        Use LLM only for complex queries (minimal API usage)
        """

        # Simplified prompt to reduce token usage
        prompt = f"""
        Pergunta: {question}
        
        Gere SQL PostgreSQL para dados financeiros.
        
        Tabelas:
        - transaction (date VARCHAR, description, amount, pdf_id)
        - pdf_extractable (card_id)
        - card (user_id)
        
        Sempre usar: WHERE c.user_id = :user_id
        
        JSON:
        {{"sql_query": "SELECT...", "query_type": "list", "expected_format": "table"}}
        """

        try:
            llm = self._get_llm()
            response = llm.invoke(prompt)
            result = json.loads(response.content)
            result["api_cost"] = 1  # Mark as API call
            result["post_processing"] = {"filter_dates": False}
            result["params"] = {"user_id": self.user_id}
            return result
        except Exception as e:
            logger.error(f"LLM query generation failed: {e}")
            return {
                "sql_query": None,
                "query_type": "error",
                "error": str(e),
                "api_cost": 1
            }

    def execute_smart_query(self, question: str, context: Dict = None) -> Dict[str, Any]:
        """
        Execute query with post-processing for Portuguese dates
        """

        query_plan = self.generate_query(question, context)

        if query_plan.get("error"):
            return {"error": query_plan["error"]}

        try:
            session = self.session_factory()
            sql_query = query_plan.get("sql_query")

            if sql_query:
                # Execute query
                result = session.execute(
                    text(sql_query),
                    query_plan.get("params", {})
                ).fetchall()

                # Apply post-processing for Portuguese dates
                processed_result = self._post_process_results(
                    result,
                    query_plan.get("post_processing", {})
                )

                return {
                    "data": processed_result,
                    "query_type": query_plan.get("query_type"),
                    "format": query_plan.get("expected_format"),
                    "sql_used": sql_query,
                    "api_cost": query_plan.get("api_cost", 0),
                    "pattern_matched": query_plan.get("pattern_matched", "llm_generated"),
                    "total_results": len(processed_result)
                }
            else:
                return {"error": "Não foi possível gerar consulta SQL"}

        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            return {"error": f"Erro na execução: {str(e)}"}
        finally:
            if 'session' in locals():
                session.close()

    def _post_process_results(self, results: List, processing_config: Dict) -> List[Dict]:
        """
        Post-process results including Portuguese date filtering
        """
        if not results:
            return []

        processed = []
        for row in results:
            row_dict = dict(row._mapping)

            # Apply date filtering if specified
            if processing_config.get("filter_dates") and "date" in row_dict:
                date_str = row_dict["date"]
                parsed_date = self._parse_portuguese_date(date_str)

                if parsed_date:
                    start_date = processing_config.get("period_start")
                    end_date = processing_config.get("period_end")

                    if start_date and end_date:
                        if isinstance(start_date, str):
                            start_date = datetime.strptime(
                                start_date, "%Y-%m-%d").date()
                        if isinstance(end_date, str):
                            end_date = datetime.strptime(
                                end_date, "%Y-%m-%d").date()

                        if not (start_date <= parsed_date <= end_date):
                            continue  # Skip this result

                    # Format date for display
                    row_dict["date_formatted"] = parsed_date.strftime(
                        "%d/%m/%Y")

            # Apply amount filtering
            min_amount = processing_config.get("min_amount")
            if min_amount and "amount" in row_dict:
                if float(row_dict["amount"]) < min_amount:
                    continue

            processed.append(row_dict)

        return processed

    def _parse_portuguese_date(self, date_str: str, year: int = 2025):
        """Parse Portuguese date format"""
        portuguese_months = {
            'JAN': 1, 'FEV': 2, 'MAR': 3, 'ABR': 4, 'MAI': 5, 'JUN': 6,
            'JUL': 7, 'AGO': 8, 'SET': 9, 'OUT': 10, 'NOV': 11, 'DEZ': 12
        }

        try:
            match = re.match(r'(\d+)\s+([A-Z]{3})', date_str.upper().strip())
            if match:
                day = int(match.group(1))
                month_abbr = match.group(2)
                month = portuguese_months.get(month_abbr)
                if month:
                    return datetime(year, month, day).date()
        except Exception as e:
            logger.warning(f"Failed to parse date '{date_str}': {e}")
        return None

    def _parse_relative_date(self, period: str) -> Tuple[str, str]:
        """Parse relative date periods"""
        from .utils import parse_relative_date  # Reuse existing function
        return parse_relative_date(period)

    def _create_cache_key(self, question: str, context: Dict = None) -> str:
        """Create cache key for query caching"""
        key_data = f"{question}:{str(context or {})}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def get_query_stats(self) -> Dict[str, Any]:
        """Get statistics about query performance and API usage"""
        if not self.query_cache:
            return {
                "total_queries_cached": 0,
                "api_queries": 0,
                "pattern_matched_queries": 0,
                "api_cost_savings": "0%"
            }

        total_queries = len(self.query_cache)
        api_queries = sum(1 for result in self.query_cache.values()
                          if result.get("api_cost", 0) > 0)

        return {
            "total_queries_cached": total_queries,
            "api_queries": api_queries,
            "pattern_matched_queries": total_queries - api_queries,
            "api_cost_savings": f"{((total_queries - api_queries) / total_queries) * 100:.1f}%" if total_queries > 0 else "0%"
        }


def create_cost_effective_query_generator(user_id: int, session_factory):
    """
    Factory function to create cost-effective query generator
    """
    return BrazilianFinancialQueryGenerator(user_id, session_factory)
