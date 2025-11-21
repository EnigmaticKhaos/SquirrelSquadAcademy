'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useHelpArticle, useRateArticle } from '@/hooks/useHelpSupport';
import {
  Card,
  CardContent,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  Button,
} from '@/components/ui';
import { showToast } from '@/lib/toast';
import { ArrowLeft, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui';

export default function HelpArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const { data: article, isLoading, error } = useHelpArticle(slug);
  const rateArticle = useRateArticle();

  const handleRate = (isHelpful: boolean) => {
    if (article) {
      rateArticle.mutate({ id: article._id, isHelpful });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !article) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <ErrorMessage message="Article not found" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/help">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help Center
          </Button>
        </Link>

        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{article.category}</Badge>
              {article.tags && article.tags.length > 0 && (
                <>
                  {article.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-100 mb-4">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-gray-400 mb-6">
                {article.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-6 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{article.author?.username || 'Admin'}</span>
              </div>
              {article.publishedAt && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Published {new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
              )}
              <span>{article.viewCount || 0} views</span>
            </div>

            {article.videoUrl && (
              <div className="mb-8">
                <iframe
                  src={article.videoUrl}
                  className="w-full h-96 rounded-lg"
                  allowFullScreen
                  title={article.title}
                />
              </div>
            )}

            <div className="prose prose-invert max-w-none mb-8">
              <MarkdownRenderer content={article.content} />
            </div>

            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-3">
                  Related Articles
                </h3>
                <ul className="space-y-2">
                  {article.relatedArticles.map((related) => (
                    <li key={related._id}>
                      <Link
                        href={`/help/articles/${related.slug}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {related.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {article.relatedFAQs && article.relatedFAQs.length > 0 && (
              <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-3">
                  Related FAQs
                </h3>
                <ul className="space-y-2">
                  {article.relatedFAQs.map((faq) => (
                    <li key={faq._id}>
                      <Link
                        href={`/help#faq-${faq._id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {faq.question}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Was this article helpful?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRate(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                  disabled={rateArticle.isPending}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Yes ({article.helpfulCount || 0})</span>
                </button>
                <button
                  onClick={() => handleRate(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                  disabled={rateArticle.isPending}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>No ({article.notHelpfulCount || 0})</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

