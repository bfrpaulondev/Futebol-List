'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  Newspaper,
  BookOpen,
  Calendar,
  Trophy,
  Target,
  Star,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Flame,
  Users,
} from 'lucide-react';

interface WeeklyReview {
  id: string;
  title: string;
  content: string;
  dateRange: string;
  publishedAt: string;
  stats: {
    gamesPlayed: number;
    totalGoals: number;
    mvps: string[];
    badgesEarned: number;
    complaints: number;
  };
  highlights: {
    playerName: string;
    description: string;
  }[];
  funnyMoments: string[];
}

interface Chronicle {
  id: string;
  gameId: string;
  date: string;
  score: string;
  hero: string;
  narrative: string;
  teamAScore: number;
  teamBScore: number;
}

export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<'review' | 'chronicles'>('review');
  const [reviews, setReviews] = useState<WeeklyReview[]>([]);
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChronicle, setExpandedChronicle] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setChronicles(data.chronicles || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 glass-card rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">📰 Revista Palestrinha</h1>
        <p className="text-zinc-500 text-sm mt-0.5">A imprensa do Futebol Bonfim</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-1 ${
            activeTab === 'review'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          Revista Semanal
        </button>
        <button
          onClick={() => setActiveTab('chronicles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex-1 ${
            activeTab === 'chronicles'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Crónicas de Jogo
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'review' ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {reviews.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-zinc-600 text-2xl mb-2">📝</p>
                <p className="text-zinc-500 text-sm">Ainda não há revistas publicadas</p>
                <p className="text-zinc-600 text-xs mt-1">Palestrinha está a preparar a primeira edição!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="space-y-3">
                  {/* Review Header */}
                  <div className="glass-card rounded-2xl overflow-hidden gradient-border-emerald">
                    <div className="bg-zinc-900 rounded-2xl">
                      <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-2xl">🎭</div>
                          <div className="flex-1">
                            <h2 className="text-lg font-bold text-white">{review.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-zinc-500" />
                              <span className="text-zinc-500 text-xs">{review.dateRange}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-5 gap-2 mb-4">
                          <div className="text-center bg-zinc-800/50 rounded-lg p-2">
                            <Users className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                            <p className="text-white text-sm font-bold">{review.stats.gamesPlayed}</p>
                            <p className="text-zinc-600 text-[9px]">Jogos</p>
                          </div>
                          <div className="text-center bg-zinc-800/50 rounded-lg p-2">
                            <Target className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
                            <p className="text-white text-sm font-bold">{review.stats.totalGoals}</p>
                            <p className="text-zinc-600 text-[9px]">Golos</p>
                          </div>
                          <div className="text-center bg-zinc-800/50 rounded-lg p-2">
                            <Star className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
                            <p className="text-white text-sm font-bold">{review.stats.mvps.length}</p>
                            <p className="text-zinc-600 text-[9px]">MVPs</p>
                          </div>
                          <div className="text-center bg-zinc-800/50 rounded-lg p-2">
                            <Award className="w-3.5 h-3.5 text-purple-400 mx-auto mb-0.5" />
                            <p className="text-white text-sm font-bold">{review.stats.badgesEarned}</p>
                            <p className="text-zinc-600 text-[9px]">Badges</p>
                          </div>
                          <div className="text-center bg-zinc-800/50 rounded-lg p-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mx-auto mb-0.5" />
                            <p className="text-white text-sm font-bold">{review.stats.complaints}</p>
                            <p className="text-zinc-600 text-[9px]">Queixas</p>
                          </div>
                        </div>

                        {/* Highlights */}
                        {review.highlights.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Destaques da Semana
                            </h3>
                            <div className="space-y-1.5">
                              {review.highlights.map((h, i) => (
                                <div key={i} className="flex items-start gap-2 bg-zinc-800/30 rounded-lg p-2">
                                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-white text-xs font-medium">{h.playerName}</span>
                                    <p className="text-zinc-400 text-xs">{h.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Funny Moments */}
                        {review.funnyMoments.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              Momentos Engraçados
                            </h3>
                            <div className="space-y-1.5">
                              {review.funnyMoments.map((m, i) => (
                                <div key={i} className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-2">
                                  <p className="text-zinc-300 text-xs italic">😂 {m}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Article Content */}
                      <div className="p-4">
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1">{children}</h3>,
                              p: ({ children }) => <p className="text-zinc-300 text-sm leading-relaxed mb-3">{children}</p>,
                              strong: ({ children }) => <strong className="text-emerald-400 font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1 mb-3">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 text-sm space-y-1 mb-3">{children}</ol>,
                              li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-emerald-500/30 pl-3 text-zinc-400 text-sm italic my-3">{children}</blockquote>
                              ),
                            }}
                          >
                            {review.content}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-zinc-800/50">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          <span className="text-zinc-600 text-xs">Publicado em {formatDate(review.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chronicles"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            {chronicles.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <p className="text-zinc-600 text-2xl mb-2">📚</p>
                <p className="text-zinc-500 text-sm">Ainda não há crónicas</p>
                <p className="text-zinc-600 text-xs mt-1">As crónicas são geradas após cada jogo!</p>
              </div>
            ) : (
              chronicles.map((chronicle) => {
                const isExpanded = expandedChronicle === chronicle.id;
                return (
                  <div
                    key={chronicle.id}
                    className="glass-card rounded-2xl p-4 transition-all duration-200 hover:bg-zinc-800/60"
                  >
                    {/* Chronicle Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">🎭</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-bold">{chronicle.score}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3 h-3 text-zinc-600" />
                            <span className="text-zinc-500 text-xs">{formatDate(chronicle.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-2 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Star className="w-2.5 h-2.5 mr-1" />
                          {chronicle.hero}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setExpandedChronicle(isExpanded ? null : chronicle.id)}
                          className="text-zinc-500 hover:text-zinc-300 h-8 w-8"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Score Visualization */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 text-center bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5">
                        <p className="text-xs text-zinc-400">Equipa A</p>
                        <p className="text-lg font-bold text-emerald-400">{chronicle.teamAScore}</p>
                      </div>
                      <span className="text-zinc-600 text-sm font-bold">×</span>
                      <div className="flex-1 text-center bg-sky-500/10 border border-sky-500/20 rounded-lg p-1.5">
                        <p className="text-xs text-zinc-400">Equipa B</p>
                        <p className="text-lg font-bold text-sky-400">{chronicle.teamBScore}</p>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="prose prose-invert prose-sm max-w-none pt-2 border-t border-zinc-800/50">
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-semibold text-white mb-2">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-semibold text-zinc-200 mb-1">{children}</h3>,
                                p: ({ children }) => <p className="text-zinc-300 text-sm leading-relaxed mb-3">{children}</p>,
                                strong: ({ children }) => <strong className="text-emerald-400 font-semibold">{children}</strong>,
                                em: ({ children }) => <em className="text-zinc-400 italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1 mb-3">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 text-sm space-y-1 mb-3">{children}</ol>,
                                li: ({ children }) => <li className="text-zinc-300">{children}</li>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-2 border-emerald-500/30 pl-3 text-zinc-400 text-sm italic my-3">{children}</blockquote>
                                ),
                              }}
                            >
                              {chronicle.narrative}
                            </ReactMarkdown>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
