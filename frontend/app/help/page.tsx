'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { PageHeader } from '@/components/layout';
import {
  useFAQs,
  useHelpArticles,
  useVideoTutorials,
  useSupportTickets,
  useRateFAQ,
  useRateArticle,
  useRateTutorial,
} from '@/hooks/useHelpSupport';
import {
  Card,
  CardContent,
  Badge,
  LoadingSpinner,
  ErrorMessage,
  EmptyState,
  SearchBar,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  CardSkeleton,
  ListSkeleton,
} from '@/components/ui';
import { showToast } from '@/lib/toast';
import type { FAQCategory, HelpArticleCategory, TicketStatus, TicketCategory } from '@/lib/api/helpSupport';
import { HelpCircle, MessageSquare, BookOpen, Video, Plus, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';

const FAQ_CATEGORIES: { value: FAQCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'courses', label: 'Courses' },
  { value: 'payments', label: 'Payments' },
  { value: 'technical', label: 'Technical' },
  { value: 'features', label: 'Features' },
  { value: 'other', label: 'Other' },
];

const ARTICLE_CATEGORIES: { value: HelpArticleCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'account-settings', label: 'Account Settings' },
  { value: 'courses', label: 'Courses' },
  { value: 'payments', label: 'Payments' },
  { value: 'features', label: 'Features' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'api', label: 'API' },
  { value: 'other', label: 'Other' },
];

const TICKET_STATUSES: { value: TicketStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_user', label: 'Waiting for You' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function HelpPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('faqs');
  const [search, setSearch] = useState('');
  const [faqCategory, setFaqCategory] = useState<FAQCategory | ''>('');
  const [articleCategory, setArticleCategory] = useState<HelpArticleCategory | ''>('');
  const [ticketStatus, setTicketStatus] = useState<TicketStatus | ''>('');

  const { data: faqs, isLoading: faqsLoading } = useFAQs({
    category: faqCategory || undefined,
    search: search || undefined,
  });

  const { data: articles, isLoading: articlesLoading } = useHelpArticles({
    category: articleCategory || undefined,
    search: search || undefined,
  });

  const { data: tutorials, isLoading: tutorialsLoading } = useVideoTutorials({
    search: search || undefined,
  });

  const { data: tickets, isLoading: ticketsLoading } = useSupportTickets({
    status: ticketStatus || undefined,
  });

  const rateFAQ = useRateFAQ();
  const rateArticle = useRateArticle();
  const rateTutorial = useRateTutorial();

  const handleRateFAQ = (id: string, isHelpful: boolean) => {
    rateFAQ.mutate({ id, isHelpful });
  };

  const handleRateArticle = (id: string, isHelpful: boolean) => {
    rateArticle.mutate({ id, isHelpful });
  };

  const handleRateTutorial = (id: string, isHelpful: boolean) => {
    rateTutorial.mutate({ id, isHelpful });
  };

  const getStatusColor = (status: TicketStatus) => {
    const colors = {
      open: 'bg-blue-500/10 text-blue-400',
      in_progress: 'bg-yellow-500/10 text-yellow-400',
      waiting_user: 'bg-orange-500/10 text-orange-400',
      resolved: 'bg-green-500/10 text-green-400',
      closed: 'bg-gray-500/10 text-gray-400',
    };
    return colors[status] || colors.closed;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500/10 text-gray-400',
      normal: 'bg-blue-500/10 text-blue-400',
      high: 'bg-orange-500/10 text-orange-400',
      urgent: 'bg-red-500/10 text-red-400',
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Help & Support"
          description="Find answers to common questions, browse help articles, watch tutorials, or contact our support team."
        />

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            placeholder="Search FAQs, articles, and tutorials..."
            value={search}
            onChange={setSearch}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faqs" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="faqs">
              <HelpCircle className="mr-2 h-4 w-4" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="articles">
              <BookOpen className="mr-2 h-4 w-4" />
              Help Articles
            </TabsTrigger>
            <TabsTrigger value="tutorials">
              <Video className="mr-2 h-4 w-4" />
              Video Tutorials
            </TabsTrigger>
            <TabsTrigger value="tickets">
              <MessageSquare className="mr-2 h-4 w-4" />
              My Tickets
            </TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faqs">
            <div className="mb-4 flex items-center justify-between">
              <select
                value={faqCategory}
                onChange={(e) => setFaqCategory(e.target.value as FAQCategory | '')}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {faqsLoading ? (
              <CardSkeleton count={5} />
            ) : faqs && faqs.length > 0 ? (
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <Card key={faq._id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{faq.category}</Badge>
                            {faq.isFeatured && (
                              <Badge variant="success">Featured</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-100 mb-2">
                            {faq.question}
                          </h3>
                          <p className="text-gray-400 whitespace-pre-wrap">
                            {faq.answer}
                          </p>
                          {faq.tags && faq.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {faq.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{faq.viewCount || 0} views</span>
                          <span>
                            {((faq.helpfulCount || 0) / ((faq.helpfulCount || 0) + (faq.notHelpfulCount || 0) || 1) * 100).toFixed(0)}% helpful
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRateFAQ(faq._id, true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                            disabled={rateFAQ.isPending}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{faq.helpfulCount || 0}</span>
                          </button>
                          <button
                            onClick={() => handleRateFAQ(faq._id, false)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                            disabled={rateFAQ.isPending}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{faq.notHelpfulCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No FAQs found"
                description="Try adjusting your search or filters."
              />
            )}
          </TabsContent>

          {/* Help Articles Tab */}
          <TabsContent value="articles">
            <div className="mb-4 flex items-center justify-between">
              <select
                value={articleCategory}
                onChange={(e) => setArticleCategory(e.target.value as HelpArticleCategory | '')}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {ARTICLE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {articlesLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <CardSkeleton count={6} />
              </div>
            ) : articles && articles.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link key={article._id} href={`/help/articles/${article.slug}`}>
                    <Card hover className="h-full">
                      {article.thumbnail && (
                        <img
                          src={article.thumbnail}
                          alt={article.title}
                          className="h-48 w-full rounded-t-lg object-cover"
                        />
                      )}
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{article.category}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:text-blue-400">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{article.viewCount || 0} views</span>
                          <span>
                            {article.author?.username || 'Admin'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No articles found"
                description="Try adjusting your search or filters."
              />
            )}
          </TabsContent>

          {/* Video Tutorials Tab */}
          <TabsContent value="tutorials">
            {tutorialsLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <CardSkeleton count={6} />
              </div>
            ) : tutorials && tutorials.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial._id} hover className="h-full">
                    {tutorial.thumbnail && (
                      <div className="relative">
                        <img
                          src={tutorial.thumbnail}
                          alt={tutorial.title}
                          className="h-48 w-full rounded-t-lg object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-black/50 p-3">
                            <Video className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{tutorial.category}</Badge>
                        {tutorial.isFeatured && (
                          <Badge variant="success">Featured</Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:text-blue-400">
                        {tutorial.title}
                      </h3>
                      {tutorial.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                          {tutorial.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{tutorial.viewCount || 0} views</span>
                        {tutorial.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(tutorial.duration / 60)}:{(tutorial.duration % 60).toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRateTutorial(tutorial._id, true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                          disabled={rateTutorial.isPending}
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>{tutorial.helpfulCount || 0}</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRateTutorial(tutorial._id, false);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
                          disabled={rateTutorial.isPending}
                        >
                          <ThumbsDown className="h-4 w-4" />
                          <span>{tutorial.notHelpfulCount || 0}</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No tutorials found"
                description="Try adjusting your search."
              />
            )}
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets">
            <div className="mb-4 flex items-center justify-between">
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value as TicketStatus | '')}
                className="rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                {TICKET_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <Link href="/help/tickets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Ticket
                </Button>
              </Link>
            </div>

            {ticketsLoading ? (
              <CardSkeleton count={5} />
            ) : tickets && tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Link key={ticket._id} href={`/help/tickets/${ticket._id}`}>
                    <Card hover>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getStatusColor(ticket.status)}>
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                              <Badge variant="secondary">{ticket.category}</Badge>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:text-blue-400">
                              {ticket.subject}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                              {ticket.description}
                            </p>
                            {ticket.assignedTo && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                <User className="h-4 w-4" />
                                <span>Assigned to {ticket.assignedTo.username}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700 text-sm text-gray-500">
                          <span>
                            {ticket.messageCount || 0} messages
                          </span>
                          <span>
                            Created {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No support tickets"
                description="Create a new ticket to get help from our support team."
                action={{
                  label: 'Create Ticket',
                  onClick: () => router.push('/help/tickets/new'),
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

