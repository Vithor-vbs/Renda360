import os
import json
import logging
import time
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional, List

from langchain_openai import ChatOpenAI
from langchain import hub
from langchain.agents import Tool, AgentExecutor, create_structured_chat_agent
from langchain.chains import RetrievalQA
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

from .vector_store import FinancialVectorStore
from .query_executor import FinancialQueryExecutor
from .smart_query_generator import BrazilianFinancialQueryGenerator


logger = logging.getLogger(__name__)


class InMemoryCache:
    """Simple in-memory cache for Julius AI responses"""

    def __init__(self, max_size: int = 500, default_ttl: int = 1800):
        self.cache = {}
        self.access_times = {}
        self.max_size = max_size
        self.default_ttl = default_ttl

    def _cleanup_expired(self):
        """Remove expired items"""
        current_time = time.time()
        expired_keys = [
            key for key, item in self.cache.items()
            if current_time > item['expires']
        ]
        for key in expired_keys:
            del self.cache[key]
            self.access_times.pop(key, None)

    def _evict_lru(self):
        """Evict least recently used items if cache is full"""
        if len(self.cache) >= self.max_size:
            # Remove 20% of least recently used items
            sorted_keys = sorted(self.access_times.items(), key=lambda x: x[1])
            keys_to_remove = [
                k for k, _ in sorted_keys[:int(self.max_size * 0.2)]]
            for key in keys_to_remove:
                self.cache.pop(key, None)
                self.access_times.pop(key, None)

    def get(self, key: str) -> Optional[Dict]:
        """Get cached item"""
        self._cleanup_expired()

        if key in self.cache:
            current_time = time.time()
            if current_time <= self.cache[key]['expires']:
                self.access_times[key] = current_time
                return self.cache[key]['data']
            else:
                del self.cache[key]
                self.access_times.pop(key, None)
        return None

    def set(self, key: str, value: Dict, ttl: Optional[int] = None):
        """Set cached item"""
        self._cleanup_expired()
        self._evict_lru()

        ttl = ttl or self.default_ttl
        current_time = time.time()

        self.cache[key] = {
            'data': value,
            'expires': current_time + ttl,
            'created': current_time
        }
        self.access_times[key] = current_time


class SmartQueryInput(BaseModel):
    question: str = Field(
        description="The financial question in Portuguese. Examples: 'Quais meus maiores gastos?', 'Quanto gastei este mês?', 'Últimas transações'")


class FinancialQueryInput(BaseModel):
    query_type: str = Field(
        description="The type of query. Supported: 'largest_expenses', 'transactions_by_amount', 'spending_by_category', 'total_spending'.")
    period: str | None = Field(
        default=None, description="Relative time period. Supported: 'last_month', 'this_month', 'last_30_days'.")
    limit: int = Field(
        default=5, description="The maximum number of results to return.")
    min_amount: float | None = Field(
        default=None, description="The minimum transaction amount.")
    max_amount: float | None = Field(
        default=None, description="The maximum transaction amount.")


class JuliusAI:
    def __init__(self, user_id, optimization_level: str = "aggressive", session_id: Optional[str] = None):
        self.user_id = user_id
        self.optimization_level = optimization_level
        self.session_id = session_id

        # Initialize cost optimization components
        self.response_cache = InMemoryCache(max_size=500, default_ttl=1800)
        self.cost_stats = {
            'total_queries': 0,
            'cache_hits': 0,
            'pattern_matches': 0,
            'llm_cheap_queries': 0,
            'llm_expensive_queries': 0,
            'total_cost_saved': 0.0,
            'total_api_cost': 0.0,
            'avg_response_time': 0.0
        }

        try:
            self.vector_store = FinancialVectorStore(user_id)
            self.query_executor = FinancialQueryExecutor(user_id)

            # Add the new smart query generator
            self.smart_query_generator = BrazilianFinancialQueryGenerator(
                user_id,
                self._get_session_factory()
            )

            # Configure models based on optimization level
            self.models = self._configure_models()

            # Primary LLM (cost-optimized based on level)
            self.llm = ChatOpenAI(
                temperature=0,
                model=self.models['primary'],
                max_tokens=400,  # Cost control
                openai_api_key=os.getenv("OPENAI_API_KEY")
            )

            # Secondary LLM for complex queries (if different from primary)
            if self.models['secondary'] != self.models['primary']:
                self.llm_complex = ChatOpenAI(
                    temperature=0.1,
                    model=self.models['secondary'],
                    max_tokens=600,
                    openai_api_key=os.getenv("OPENAI_API_KEY")
                )
            else:
                self.llm_complex = self.llm

            self.agent = self._create_agent()
        except Exception as e:
            logger.exception(f"JuliusAI initialization failed: {str(e)}")
            raise

    def _configure_models(self) -> Dict[str, str]:
        """Configure models based on optimization level"""
        model_configs = {
            "aggressive": {
                "primary": "gpt-3.5-turbo",
                "secondary": "gpt-3.5-turbo"  # Never use GPT-4
            },
            "balanced": {
                "primary": "gpt-3.5-turbo",
                "secondary": "gpt-4-turbo-preview"
            },
            "quality": {
                "primary": "gpt-4-turbo-preview",
                "secondary": "gpt-4-turbo-preview"
            }
        }
        return model_configs.get(self.optimization_level, model_configs["aggressive"])

    def _classify_query_complexity(self, question: str) -> str:
        """Classify query complexity to select appropriate model"""
        question_lower = question.lower()

        # Simple data retrieval patterns
        simple_patterns = [
            'quanto', 'total', 'soma', 'maiores', 'últimas', 'últimos',
            'gastos', 'despesas', 'transações', 'compras', 'valor',
            'mostrar', 'listar', 'ver'
        ]

        # Complex analysis patterns
        complex_patterns = [
            'análise', 'analisar', 'comparar', 'tendência', 'padrão',
            'recomendação', 'estratégia', 'otimizar', 'planejar',
            'avaliar', 'explicar', 'porque', 'como melhorar'
        ]

        simple_count = sum(
            1 for pattern in simple_patterns if pattern in question_lower)
        complex_count = sum(
            1 for pattern in complex_patterns if pattern in question_lower)

        # If it's clearly a simple query
        if simple_count > 0 and complex_count == 0:
            return "simple"

        # If it has complex indicators or is long
        if complex_count > 0 or len(question.split()) > 10:
            return "complex"

        # Default to simple for cost efficiency
        return "simple"

    def _normalize_question(self, question: str) -> str:
        """Normalize question for cache key generation"""
        import unicodedata
        import re

        # Remove accents
        normalized = unicodedata.normalize('NFD', question.lower())
        normalized = ''.join(
            c for c in normalized if unicodedata.category(c) != 'Mn')

        # Remove punctuation and extra spaces
        normalized = re.sub(r'[^\w\s]', '', normalized)
        normalized = ' '.join(normalized.split())

        return normalized

    def _is_conversation_history_question(self, question: str) -> bool:
        """Check if question is about conversation history"""
        conversation_keywords = [
            'última pergunta', 'ultima pergunta', 'pergunta anterior',
            'perguntei antes', 'conversa anterior', 'histórico',
            'o que perguntei', 'minha pergunta anterior'
        ]
        question_lower = question.lower()
        return any(keyword in question_lower for keyword in conversation_keywords)

    def _handle_conversation_history_question(self, question: str) -> str:
        """Handle questions about conversation history using memory system"""
        try:
            history = self.get_conversation_history(limit=10)

            if len(history) < 2:  # No previous conversation
                return "Esta é nossa primeira conversa. Você ainda não fez perguntas anteriores."

            # Find the last user question (excluding current one)
            user_messages = [
                msg for msg in history if msg['message_type'] == 'user']

            if len(user_messages) < 2:
                return "Você ainda não fez perguntas anteriores nesta conversa."

            # Second most recent (first is current)
            last_question = user_messages[1]['content']
            last_time = user_messages[1]['created_at']

            return f"Sua última pergunta foi: '{last_question}' (feita em {last_time})"

        except Exception as e:
            logger.error(f"Error handling conversation history question: {e}")
            return "Desculpe, não consegui acessar o histórico da conversa no momento."

    def _get_cache_key(self, question: str) -> str:
        """Generate cache key for question"""
        normalized = self._normalize_question(question)
        key_data = f"julius:{self.user_id}:{normalized}"
        return hashlib.md5(key_data.encode()).hexdigest()

    def _get_session_factory(self):
        """Return session factory for the smart query generator"""
        return self.query_executor._get_session

    def _create_agent(self):
        """
        Creates a more robust agent using Pydantic schemas and modern LangChain components.
        """
        try:
            tools = [
                # Prioritize zero-cost pattern matching
                StructuredTool.from_function(
                    func=self._enhanced_smart_query_structured,
                    name="SmartPortugueseQuery",
                    description="🥇 PREFERRED TOOL for ALL Portuguese financial questions. Zero API cost for common queries. Input: {'question': 'your question in portuguese'}. Handles 'quais meus maiores gastos', 'quanto gastei', 'últimas transações', 'gastos acima de R$ X', etc. Always try this FIRST before other tools.",
                    args_schema=SmartQueryInput
                ),

                # Moderate cost document search
                Tool(
                    name="FinancialKnowledgeBase",
                    func=self._cost_aware_retrieval_qa,
                    description="Use ONLY for questions about financial documents, PDFs, or general financial advice that SmartPortugueseQuery cannot answer. Moderate API cost."
                ),

                # Expensive structured query (discouraged)
                StructuredTool.from_function(
                    func=self._cost_aware_db_query,
                    name="ExpensiveDatabaseQuery",
                    description="⚠️ LAST RESORT: Expensive structured database query. HIGH API COST. Use SmartPortugueseQuery instead for better performance and cost efficiency.",
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

    def _enhanced_smart_query_structured(self, question: str) -> str:
        """Enhanced smart query with structured input using Pydantic schema"""
        logger.info(f"SmartPortugueseQuery called with question: {question}")
        return self._enhanced_smart_query(question)

    def _enhanced_smart_query(self, question) -> str:
        """Enhanced smart query with cost tracking and optimization"""
        try:
            # Handle both string and dict inputs from the agent
            if isinstance(question, dict):
                actual_question = question.get('type', question.get(
                    'question', question.get('tool_input', {}).get('type', '')))
            else:
                actual_question = question

            if not actual_question:
                return "Erro: pergunta não especificada corretamente."

            # Handle conversation history questions directly
            if self._is_conversation_history_question(actual_question):
                return self._handle_conversation_history_question(actual_question)

            result = self.smart_query_generator.execute_smart_query(
                actual_question)

            if result.get("error"):
                return f"Erro na consulta: {result['error']}"

            data = result.get("data", [])
            if not data:
                return "Nenhum resultado encontrado para sua consulta."

            # Track pattern match success
            self.cost_stats['pattern_matches'] += 1

            query_type = result.get("query_type", "list")
            pattern_matched = result.get("pattern_matched", "unknown")

            # Format response based on query type
            if query_type == "aggregation":
                if len(data) == 1 and "total_gasto" in data[0]:
                    row = data[0]
                    total = row.get("total_gasto", 0)
                    count = row.get("num_transacoes", 0)
                    avg = row.get("gasto_medio", 0)

                    response = f"💰 Total gasto: R$ {total:.2f}\n"
                    response += f"🔢 Transações: {count}\n"
                    response += f"📊 Média: R$ {avg:.2f} por transação"
                else:
                    response = json.dumps(data, ensure_ascii=False, indent=2)
            else:
                # Handle list results with better formatting
                response = f"📋 Encontrei {len(data)} transações:\n\n"

                display_data = data[:8]  # Show top 8 for better readability
                for i, transaction in enumerate(display_data, 1):
                    date = transaction.get(
                        'date_formatted', transaction.get('date', 'N/A'))
                    # Truncate long descriptions
                    desc = transaction.get('description', 'N/A')[:50]
                    amount = transaction.get('amount', 0)
                    response += f"{i}. R$ {amount:.2f} - {desc} ({date})\n"

                if len(data) > 8:
                    response += f"\n... e mais {len(data) - 8} transações."

            # Add cost optimization notice
            response += f"\n\n✅ Consulta otimizada (padrão: {pattern_matched}) - economia de API ✅"

            return response

        except Exception as e:
            logger.exception(f"Enhanced smart query failed: {e}")
            return f"Erro na consulta inteligente: {str(e)}"

    def _cost_aware_retrieval_qa(self, query: str):
        """Cost-aware retrieval QA with usage tracking"""
        try:
            # Use cheaper model and limit results for cost control
            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,  # Uses optimized model based on level
                chain_type="stuff",
                retriever=self.vector_store.vectorstore.as_retriever(
                    search_kwargs={"k": 3}  # Limit results to reduce cost
                )
            )

            result = qa_chain.invoke({"query": query})

            # Track moderate cost usage
            self.cost_stats['llm_cheap_queries'] += 1
            estimated_cost = 0.008  # Rough estimate for GPT-3.5
            self.cost_stats['total_api_cost'] += estimated_cost

            response = result.get(
                "result", "Não encontrei resposta na base de conhecimento.")
            response += f"\n\n💰 Custo estimado: ~${estimated_cost:.3f}"

            return response

        except Exception as e:
            logger.exception(f"Cost-aware retrieval QA failed: {e}")
            return f"Erro na busca de documentos: {str(e)}"

    def _cost_aware_db_query(self, query_type: str, period: str = None, limit: int = 5, min_amount: float = None, max_amount: float = None):
        """Expensive structured database query with cost tracking and warnings"""
        try:
            # Log expensive operation
            logger.warning(
                f"Using expensive database query for user {self.user_id}: {query_type}")

            parameters = {
                "limit": limit, "period": period,
                "min_amount": min_amount, "max_amount": max_amount
            }
            parameters = {k: v for k, v in parameters.items() if v is not None}

            if query_type == "largest_expenses" and "period" not in parameters:
                parameters["period"] = "this_month"

            result = self.query_executor.execute_query(query_type, parameters)

            # Track expensive operation
            self.cost_stats['llm_expensive_queries'] += 1
            estimated_cost = 0.025  # Higher cost estimate
            self.cost_stats['total_api_cost'] += estimated_cost

            if isinstance(result, list):
                if not result:
                    return "⚠️ Nenhuma transação encontrada para os critérios especificados.\n\n💰 Consulta cara utilizada - considere usar SmartPortugueseQuery"

                response = "Resultados da consulta estruturada:\n\n"
                response += "\n".join(
                    f"Em {t['date']}, transação '{t['description']}' custou R${t['amount']}" for t in result
                )
                response += f"\n\n⚠️ Consulta cara utilizada (${estimated_cost:.3f}) - considere usar SmartPortugueseQuery para economia"
                return response

            response = json.dumps(result) if isinstance(
                result, dict) else str(result)
            response += f"\n\n⚠️ Consulta cara utilizada (${estimated_cost:.3f})"
            return response

        except Exception as e:
            logger.exception(f"Cost-aware DB query failed: {e}")
            return f"Erro na consulta cara: {str(e)}"

    def _update_avg_response_time(self, response_time: float):
        """Update average response time"""
        total_queries = self.cost_stats['total_queries']
        current_avg = self.cost_stats['avg_response_time']

        # Calculate new average
        new_avg = ((current_avg * (total_queries - 1)) +
                   response_time) / total_queries
        self.cost_stats['avg_response_time'] = round(new_avg, 3)

    def ask(self, question: str, use_cache: bool = True):
        """
        Main interface with full cost optimization pipeline
        """
        start_time = time.time()
        self.cost_stats['total_queries'] += 1

        try:
            # 1. Check cache first
            if use_cache:
                cache_key = self._get_cache_key(question)
                cached_response = self.response_cache.get(cache_key)
                if cached_response:
                    self.cost_stats['cache_hits'] += 1
                    response_time = time.time() - start_time
                    self._update_avg_response_time(response_time)

                    return f"{cached_response['response']}\n\n🚀 Resposta em cache - economia total de custo ✅"

            # 2. Classify query complexity for model selection
            complexity = self._classify_query_complexity(question)

            # 3. Create context with cost optimization guidance
            context = """Você é Julius, assistente financeiro brasileiro. SEMPRE use SmartPortugueseQuery PRIMEIRO para consultas em português. 
            Esse tool tem custo ZERO e responde 80%+ das perguntas financeiras. Use outros tools apenas se SmartPortugueseQuery não conseguir responder."""

            augmented_question = f"{context}\n\nPergunta: {question}"

            # 4. Process with appropriate model
            if not self.agent:
                return "Sistema não inicializado corretamente. Tente novamente."

            # Use complex model only for complex queries in balanced/quality modes
            if (complexity == "complex" and
                self.optimization_level in ["balanced", "quality"] and
                    hasattr(self, 'llm_complex')):

                # Temporarily switch to complex model
                original_llm = self.agent.agent.llm_chain.llm
                self.agent.agent.llm_chain.llm = self.llm_complex

                response = self.agent.invoke({"input": augmented_question})

                # Restore original model
                self.agent.agent.llm_chain.llm = original_llm

                # Track expensive usage
                self.cost_stats['llm_expensive_queries'] += 1

            else:
                # Use primary (cheaper) model
                response = self.agent.invoke({"input": augmented_question})
                self.cost_stats['llm_cheap_queries'] += 1

            final_response = response.get(
                "output", "Não consegui encontrar uma resposta.")

            # 5. Cache successful responses
            if use_cache and "erro" not in final_response.lower():
                cache_key = self._get_cache_key(question)
                self.response_cache.set(cache_key, {
                    'response': final_response,
                    'timestamp': datetime.now().isoformat(),
                    'complexity': complexity
                }, ttl=1800)  # 30 minutes cache

            # 6. Update performance metrics
            response_time = time.time() - start_time
            self._update_avg_response_time(response_time)

            # Add cost optimization summary to response
            if "✅" in final_response:  # Pattern matched response
                final_response += f"\n\n⚡ Tempo de resposta: {response_time:.2f}s"

            return final_response

        except Exception as e:
            logger.exception(f"Optimized ask method failed: {e}")
            return f"Desculpe, ocorreu um erro ao processar sua pergunta: {str(e)}"

    def get_optimization_report(self) -> Dict[str, Any]:
        """Get comprehensive cost optimization report"""
        try:
            stats = self.cost_stats.copy()
            total_queries = stats['total_queries']

            if total_queries == 0:
                return {"message": "Nenhuma consulta processada ainda."}

            # Get smart query generator stats
            try:
                smart_stats = self.smart_query_generator.get_query_stats()
                stats.update({
                    "smart_query_stats": smart_stats,
                    "pattern_matches": smart_stats.get("pattern_matched_queries", 0)
                })
            except Exception as e:
                logger.warning(f"Could not get smart query stats: {e}")

            # Calculate rates and efficiency
            cache_hit_rate = (stats['cache_hits'] / total_queries) * 100
            pattern_match_rate = (
                stats['pattern_matches'] / total_queries) * 100

            # Estimate cost savings
            potential_cost_per_query = 0.02  # Assume $0.02 per query without optimization
            potential_total_cost = total_queries * potential_cost_per_query
            actual_cost = stats['total_api_cost']
            cost_saved = potential_total_cost - actual_cost

            stats.update({
                'cache_hit_rate': round(cache_hit_rate, 1),
                'pattern_match_rate': round(pattern_match_rate, 1),
                'cost_saved': round(cost_saved, 4),
                'cost_efficiency': round((cost_saved / potential_total_cost) * 100, 1) if potential_total_cost > 0 else 0,
                'optimization_level': self.optimization_level,
                'user_id': self.user_id,
                'models_used': self.models
            })

            return stats

        except Exception as e:
            logger.error(f"Failed to get optimization report: {e}")
            return {"error": str(e)}

    def clear_cache(self):
        """Clear response cache"""
        self.response_cache = InMemoryCache(max_size=500, default_ttl=1800)
        logger.info(f"Cache cleared for user {self.user_id}")

    def update_optimization_level(self, level: str):
        """Update optimization level and reconfigure models"""
        if level in ["aggressive", "balanced", "quality"]:
            old_level = self.optimization_level
            self.optimization_level = level
            self.models = self._configure_models()

            # Log change
            logger.info(
                f"Optimization level changed from {old_level} to {level} for user {self.user_id}")

            # Note: LLM reconfiguration would require reinitializing the agent
            # For now, just update the configuration
        else:
            logger.warning(f"Invalid optimization level: {level}")

    # === Conversation Memory System ===

    def get_or_create_conversation_session(self) -> str:
        """Get or create active conversation session for user"""
        from .models import db, ConversationSession
        import uuid

        if self.session_id:
            # Check if provided session exists and is active
            session = ConversationSession.query.filter_by(
                session_id=self.session_id,
                user_id=self.user_id,
                is_active=True
            ).first()
            if session:
                return self.session_id

        # Create new session or get existing active one
        active_session = ConversationSession.query.filter_by(
            user_id=self.user_id,
            is_active=True
        ).first()

        if active_session:
            self.session_id = active_session.session_id
            return self.session_id

        # Create new session
        new_session_id = str(uuid.uuid4())
        new_session = ConversationSession(
            user_id=self.user_id,
            session_id=new_session_id,
            is_active=True
        )
        db.session.add(new_session)
        db.session.commit()

        self.session_id = new_session_id
        return self.session_id

    def get_conversation_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history for context"""
        from .models import ConversationMessage

        if not self.session_id:
            return []

        messages = ConversationMessage.query.filter_by(
            session_id=self.session_id
        ).order_by(ConversationMessage.created_at.desc()).limit(limit * 2).all()

        # Return in chronological order (oldest first)
        history = []
        for message in reversed(messages):
            history.append({
                'id': message.id,
                'message_type': message.message_type,
                'content': message.content,
                'created_at': message.created_at.isoformat(),
                'query_type': message.query_type,
                'optimization_level': message.optimization_level,
                'response_time_ms': message.response_time_ms,
                'cost_estimate': message.cost_estimate
            })

        return history

    def save_conversation_message(self, message_type: str, content: str,
                                  query_type: str = None, response_time_ms: int = None,
                                  cost_estimate: float = None):
        """Save message to conversation history"""
        from .models import db, ConversationMessage

        session_id = self.get_or_create_conversation_session()

        message = ConversationMessage(
            session_id=session_id,
            message_type=message_type,  # 'user' or 'assistant'
            content=content,
            query_type=query_type,
            optimization_level=self.optimization_level,
            response_time_ms=response_time_ms,
            cost_estimate=cost_estimate
        )

        db.session.add(message)
        db.session.commit()

    def clear_conversation(self) -> bool:
        """Clear current conversation and start fresh"""
        from .models import db, ConversationSession

        if self.session_id:
            session = ConversationSession.query.filter_by(
                session_id=self.session_id,
                user_id=self.user_id
            ).first()

            if session:
                session.is_active = False
                db.session.commit()
                self.session_id = None
                return True

        return False

    def ask_with_context(self, question: str) -> Dict[str, Any]:
        """Enhanced ask method with conversation context and memory"""
        import time
        start_time = time.time()

        # Ensure we have an active session
        session_id = self.get_or_create_conversation_session()

        # Save user message
        self.save_conversation_message('user', question)

        # Get conversation history for context
        history = self.get_conversation_history(limit=5)  # Last 5 exchanges

        # Build context-aware question if we have history
        contextual_question = question
        if len(history) > 2:  # If we have previous conversation
            context_summary = self._build_context_summary(history)
            contextual_question = f"Contexto da conversa: {context_summary}\n\nPergunta atual: {question}"

        # Process the question
        try:
            response = self.ask(contextual_question)
            query_type = self._get_last_query_type()  # We'll need to track this

            # Calculate metrics
            response_time_ms = int((time.time() - start_time) * 1000)
            cost_estimate = self._estimate_last_query_cost()

            # Save assistant response
            self.save_conversation_message(
                'assistant',
                response,
                query_type,
                response_time_ms,
                cost_estimate
            )

            return {
                'response': response,
                'session_id': session_id,
                'response_time_ms': response_time_ms,
                'query_type': query_type,
                'optimization_level': self.optimization_level
            }

        except Exception as e:
            logger.exception(f"Error in ask_with_context: {e}")
            error_response = f"Desculpe, ocorreu um erro ao processar sua pergunta: {str(e)}"

            # Save error response
            self.save_conversation_message(
                'assistant', error_response, 'error')

            return {
                'response': error_response,
                'session_id': session_id,
                'error': True
            }

    def _build_context_summary(self, history: List[Dict]) -> str:
        """Build a concise context summary from conversation history"""
        recent_topics = []
        for msg in history[-4:]:  # Last 2 exchanges
            if msg['type'] == 'user':
                # Extract key topics from user questions
                content = msg['content'].lower()
                if any(word in content for word in ['gasto', 'gastei', 'despesa']):
                    recent_topics.append('gastos')
                if any(word in content for word in ['delivery', 'entrega', 'ifood', 'uber']):
                    recent_topics.append('delivery')
                if any(word in content for word in ['categoria', 'tipo', 'classificação']):
                    recent_topics.append('categorias')

        if recent_topics:
            return f"Tópicos recentes: {', '.join(set(recent_topics))}"
        return "Continuação da conversa anterior"

    def _get_last_query_type(self) -> str:
        """Get the type of the last query executed (for tracking)"""
        # This would need to be set during query execution
        return getattr(self, '_last_query_type', 'unknown')

    def _estimate_last_query_cost(self) -> float:
        """Estimate cost of the last query"""
        # This would need to be calculated during query execution
        return getattr(self, '_last_query_cost', 0.0)

    # Backwards compatibility
    def get_performance_stats(self) -> Dict[str, Any]:
        """Backwards compatibility method"""
        return self.get_optimization_report()


def update_embeddings_for_user(user_id, pdf_id=None):
    # This function remains unchanged
    vector_store = FinancialVectorStore(user_id)
    return vector_store.update_user_data(pdf_id)
