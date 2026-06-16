'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  status: 'visible' | 'hidden' | 'reported';
  created_at: string;
  profiles?: { name: string | null } | null;
}

interface Props {
  contentId?: string;
  toolId?: string;
  productId?: string;
  /** 제품 리뷰처럼 구매자만 작성 가능하게 게이트 (RLS가 최종 강제, UI는 안내용) */
  requirePurchase?: boolean;
}

const SELECT = 'id, user_id, rating, body, status, created_at, profiles(name)';

/**
 * 별점+텍스트 리뷰 — 콘텐츠/도구/제품 폴리모픽 타깃.
 * 비로그인 → 안내, 제품인데 미구매 → 안내. 1인 1리뷰(수정/삭제). CommentThread 패턴 미러.
 */
export function ReviewSection({ contentId, toolId, productId, requirePurchase }: Props) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const col = contentId ? 'content_id' : toolId ? 'tool_id' : 'product_id';
  const id = contentId ?? toolId ?? productId;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setUser(user);
      const { data } = await supabase
        .from('reviews')
        .select(SELECT)
        .eq(col, id)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!active) return;
      setReviews((data ?? []) as unknown as Review[]);
      if (user && requirePurchase && productId) {
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
  }, [id, col, productId, requirePurchase, supabase]);

  const mine = useMemo(() => (user ? reviews.find((r) => r.user_id === user.id) : undefined), [reviews, user]);

  // 본인 리뷰 있으면 폼에 프리필(수정 모드)
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setBody(mine.body);
    }
  }, [mine]);

  const { avg, dist } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 → 1점 … index 4 → 5점
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1] += 1;
    });
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { avg: total ? sum / total : 0, dist: counts };
  }, [reviews]);

  const canWrite = !!user && (!requirePurchase || purchased);

  function submit() {
    if (!user || !id || rating < 1 || !body.trim()) return;
    startTransition(async () => {
      if (mine) {
        const { data, error } = await supabase
          .from('reviews')
          .update({ rating, body: body.trim(), updated_at: new Date().toISOString() })
          .eq('id', mine.id)
          .select(SELECT)
          .single();
        if (!error && data) {
          setReviews((rs) => rs.map((r) => (r.id === mine.id ? (data as unknown as Review) : r)));
        }
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .insert({ [col]: id, user_id: user.id, rating, body: body.trim() })
          .select(SELECT)
          .single();
        if (!error && data) {
          setReviews((rs) => [data as unknown as Review, ...rs]);
          void track('review', { content_id: id, rating });
        }
      }
    });
  }

  function remove() {
    if (!mine) return;
    startTransition(async () => {
      const { error } = await supabase.from('reviews').delete().eq('id', mine.id);
      if (!error) {
        setReviews((rs) => rs.filter((r) => r.id !== mine.id));
        setRating(0);
        setBody('');
      }
    });
  }

  if (!id) return null;

  return (
    <section className="my-10 scroll-mt-28">
      <div className="flex items-baseline gap-3 mb-5">
        <h2 className="text-xl font-extrabold tracking-[-0.025em]">리뷰</h2>
        {reviews.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm">
            <Stars rating={avg} />
            <span className="font-bold">{avg.toFixed(1)}</span>
            <span className="text-ink/40">· {reviews.length}개</span>
          </span>
        )}
      </div>

      {/* 평점 요약 + 분포 막대 */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 items-center p-5 bg-muted rounded-xl mb-6 max-w-[680px]">
          <div className="text-center shrink-0">
            <div className="text-4xl font-extrabold">{avg.toFixed(1)}</div>
            <div className="mt-1"><Stars rating={avg} /></div>
            <div className="mt-1 text-xs text-ink/50">{reviews.length}개 리뷰</div>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const c = dist[star - 1];
              const pct = reviews.length ? (c / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-6 text-ink/50">{star}점</span>
                  <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 text-right text-ink/50">{c}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 작성 폼 */}
      {canWrite ? (
        <div className="p-5 bg-white border border-border rounded-xl mb-6 max-w-[680px]">
          <div className="text-sm font-bold mb-2.5">{mine ? '내 리뷰 수정' : '이 콘텐츠 어떠셨나요?'}</div>
          <div className="flex items-center gap-1 mb-3" role="radiogroup" aria-label="별점">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                aria-label={`${v}점`}
                aria-checked={rating === v}
                role="radio"
                onClick={() => setRating(v)}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(0)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    (hover || rating) >= v ? 'text-accent' : 'text-border',
                  )}
                  fill={(hover || rating) >= v ? 'currentColor' : 'none'}
                  strokeWidth={(hover || rating) >= v ? 0 : 1.5}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="가장 도움이 된 부분, 아쉬웠던 점을 자유롭게 적어주세요."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            {mine ? (
              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="inline-flex items-center gap-1 text-xs text-ink/40 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" /> 삭제
              </button>
            ) : (
              <span />
            )}
            <Button onClick={submit} disabled={pending || rating < 1 || !body.trim()} size="sm">
              <Send className="h-3.5 w-3.5" /> {mine ? '수정' : '등록'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mb-6 text-sm text-ink/60">
          {!user ? (
            <>
              <button type="button" onClick={() => router.push('/login')} className="underline hover:text-accent">
                로그인
              </button>{' '}
              후 평가를 남길 수 있어요.
            </>
          ) : (
            '구매하신 분만 리뷰를 남길 수 있어요.'
          )}
        </p>
      )}

      {/* 목록 */}
      {reviews.length === 0 ? (
        <p className="text-sm text-ink/40">아직 리뷰가 없어요. 첫 리뷰를 남겨주세요.</p>
      ) : (
        <ul className="space-y-3 max-w-[680px]">
          {reviews.map((r) => (
            <li key={r.id} className="p-4 border border-border rounded-xl bg-white">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold">
                  {r.profiles?.name || '익명'}
                  {user && r.user_id === user.id && <span className="ml-1.5 text-xs text-accent">내 리뷰</span>}
                </span>
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-ink/40">{formatDate(r.created_at)}</span>
                </div>
              </div>
              <p className="text-[13.5px] text-ink/70 leading-relaxed break-keep whitespace-pre-wrap">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5"
          fill={i < Math.round(rating) ? 'currentColor' : 'none'}
          strokeWidth={i < Math.round(rating) ? 0 : 1.5}
        />
      ))}
    </span>
  );
}
