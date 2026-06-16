'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { EbookRatingBucket, EbookReview } from '@/types/product';

interface DbReview {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  profiles?: { name: string | null } | null;
}

interface Props {
  productId: string;
  /** 실제 리뷰가 0건일 때 보여줄 seed(목업/사회적 증거) */
  seedRating?: number;
  seedCount?: number;
  seedDist?: EbookRatingBucket[];
  seedReviews?: EbookReview[];
}

const SELECT = 'id, user_id, rating, body, created_at, profiles(name)';

/** 별점 ★ 표시 (amber) — mockup 정합 */
function Stars({ rating, className = 'h-[18px] w-[18px]' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={className}
          fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
          strokeWidth={i <= Math.round(rating) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

/**
 * ebook 리뷰 섹션 (요약 + 작성폼 + 목록) — mockup ebook-free.html .review-* 정합 + DB 배선.
 * 작성: 로그인 + 구매자(무료 다운로드 포함)만. 1인 1리뷰(수정/삭제). RLS가 구매 게이트 강제.
 * 실제 리뷰가 0건이면 seed(목업) 요약·목록을 표시.
 */
export function EbookReviews({ productId, seedRating, seedCount, seedDist, seedReviews }: Props) {
  const supabase = createSupabaseBrowserClient();
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);
      const { data } = await supabase
        .from('reviews')
        .select(SELECT)
        .eq('product_id', productId)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!active) return;
      setReviews((data ?? []) as unknown as DbReview[]);
      if (user) {
        const { data: p } = await supabase
          .from('purchases')
          .select('id')
          .eq('product_id', productId)
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        if (active) setPurchased(!!p);
      }
    })();
    return () => {
      active = false;
    };
  }, [productId, supabase]);

  const mine = useMemo(() => (user ? reviews.find((r) => r.user_id === user.id) : undefined), [reviews, user]);

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setText(mine.body);
    }
  }, [mine]);

  // 실제 리뷰 기준 요약(평균·개수·분포). 0건이면 seed로 폴백.
  const summary = useMemo(() => {
    if (reviews.length > 0) {
      const counts = [5, 4, 3, 2, 1].map((score) => ({
        score,
        count: reviews.filter((r) => r.rating === score).length,
      }));
      const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
      return { rating: avg, count: reviews.length, dist: counts, fromDb: true };
    }
    return {
      rating: seedRating ?? null,
      count: seedCount ?? null,
      dist: seedDist ?? [],
      fromDb: false,
    };
  }, [reviews, seedRating, seedCount, seedDist]);

  const distMax = summary.dist.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const canWrite = !!user && purchased;
  const filled = hover || rating;

  function submit() {
    if (!canWrite || rating < 1 || !text.trim()) return;
    startTransition(async () => {
      if (mine) {
        const { data } = await supabase
          .from('reviews')
          .update({ rating, body: text.trim(), updated_at: new Date().toISOString() })
          .eq('id', mine.id)
          .select(SELECT)
          .single();
        if (data) setReviews((rs) => rs.map((r) => (r.id === mine.id ? (data as unknown as DbReview) : r)));
      } else {
        const { data } = await supabase
          .from('reviews')
          .insert({ product_id: productId, user_id: user!.id, rating, body: text.trim() })
          .select(SELECT)
          .single();
        if (data) setReviews((rs) => [data as unknown as DbReview, ...rs]);
      }
    });
  }

  function remove() {
    if (!mine) return;
    startTransition(async () => {
      await supabase.from('reviews').delete().eq('id', mine.id);
      setReviews((rs) => rs.filter((r) => r.id !== mine.id));
      setRating(0);
      setText('');
    });
  }

  return (
    <>
      <h2 className="mb-4 text-xl font-extrabold tracking-[-0.025em]">
        리뷰{' '}
        {summary.count != null && (
          <span className="ml-1 text-[15px] font-semibold text-ink/40">{summary.count}개</span>
        )}
      </h2>

      {/* 요약 */}
      {summary.rating != null && (
        <div className="mb-6 flex items-center gap-8 rounded-xl bg-muted p-6">
          <div className="text-center">
            <div className="text-[40px] font-extrabold leading-none">{summary.rating.toFixed(1)}</div>
            <div className="mt-1">
              <Stars rating={summary.rating} className="h-5 w-5" />
            </div>
            {summary.count != null && (
              <div className="mt-1 text-[13px] text-ink/50">{summary.count}개 리뷰</div>
            )}
          </div>
          {summary.dist.length > 0 && (
            <div className="flex-1">
              {summary.dist.map((d) => (
                <div key={d.score} className="mb-1 flex items-center gap-2 text-[13px]">
                  <span className="w-5 text-right font-semibold text-ink/50">{d.score}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded bg-border">
                    <span
                      className="block h-full rounded bg-amber-400"
                      style={{ width: `${Math.round((d.count / distMax) * 100)}%` }}
                    />
                  </span>
                  <span className="w-6 text-[12px] text-ink/40">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 작성 폼 */}
      <div className="mb-5 rounded-xl border border-border bg-white p-5">
        <div className="mb-2.5 text-sm font-extrabold tracking-[-0.02em]">
          {mine ? '내 리뷰 수정' : '이 책 어떠셨나요?'}
        </div>

        <div className="mb-3 inline-flex select-none gap-0.5" role="radiogroup" aria-label="별점">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              aria-label={`${v}점`}
              disabled={!canWrite}
              onMouseEnter={() => setHover(v)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(v)}
              className="leading-none disabled:cursor-not-allowed"
            >
              <Star
                className={cn(
                  'h-6 w-6 transition-colors',
                  v <= filled ? 'text-amber-400' : 'text-border',
                )}
                fill={v <= filled ? 'currentColor' : 'none'}
                strokeWidth={v <= filled ? 0 : 1.5}
              />
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!canWrite}
          placeholder="이 책에서 가장 도움이 된 부분, 아쉬웠던 점을 자유롭게 적어주세요."
          className="min-h-20 w-full resize-y rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm outline-none placeholder:text-ink/40 focus:border-ink disabled:bg-muted"
        />

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink/50">
            {!user ? (
              <>
                <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
                  로그인
                </Link>{' '}
                후 평가를 남길 수 있습니다.
              </>
            ) : !purchased ? (
              '책을 받으신 분만 평가를 남길 수 있습니다.'
            ) : (
              '별점을 선택하고 등록해주세요.'
            )}
          </span>
          <div className="flex items-center gap-3">
            {mine && (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="text-xs text-ink/40 hover:text-red-600"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              disabled={!canWrite || pending || rating < 1 || !text.trim()}
              onClick={submit}
              className="rounded-lg bg-ink px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-border"
            >
              {mine ? '수정' : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 목록 — 실제 리뷰 우선, 없으면 seed(사회적 증거) */}
      {reviews.length > 0 ? (
        <div>
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-border py-5 last:border-b-0">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[13px] font-bold text-ink/50">
                  {(r.profiles?.name || '익').slice(0, 1)}
                </span>
                <span className="text-sm font-semibold">
                  {r.profiles?.name || '익명'}
                  {user && r.user_id === user.id && <span className="ml-1.5 text-xs text-accent">내 리뷰</span>}
                </span>
                <span className="ml-auto text-xs text-ink/40">{formatDate(r.created_at)}</span>
              </div>
              <Stars rating={r.rating} className="h-3.5 w-3.5" />
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80 break-keep whitespace-pre-wrap">{r.body}</p>
            </div>
          ))}
        </div>
      ) : seedReviews && seedReviews.length > 0 ? (
        <div>
          {seedReviews.map((r, i) => (
            <div key={i} className="border-b border-border py-5 last:border-b-0">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[13px] font-bold text-ink/50">
                  {r.author.slice(0, 1)}
                </span>
                <span className="text-sm font-semibold">{r.author}</span>
                {r.date && <span className="ml-auto text-xs text-ink/40">{r.date}</span>}
              </div>
              <Stars rating={r.rating} className="h-3.5 w-3.5" />
              <p className="mt-1.5 text-sm leading-relaxed text-ink/80 break-keep">{r.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-2 text-sm text-ink/40">아직 리뷰가 없어요. 첫 리뷰를 남겨주세요.</p>
      )}
    </>
  );
}
