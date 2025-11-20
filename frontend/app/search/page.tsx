'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent, SearchBar, LoadingSpinner, EmptyState, Button, Badge, Avatar, FilterPanel } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import Link from 'next/link';
import { useSearch, useSearchCourses, useSearchUsers, useSearchPosts, useSearchProjects } from '@/hooks/useSearch';
import type { Course, User, Post, Project } from '@/types';
import { Clock, Users, Star, BookOpen, Code, Image as ImageIcon, Video, FileText } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'users' | 'posts' | 'projects'>('all');
  const [filters, setFilters] = useState<{
    courseType?: string;
    difficulty?: string;
    category?: string;
    isFree?: boolean;
    minRating?: number;
    sort?: 'relevance' | 'newest' | 'popular' | 'rating';
  }>({});

  // Search queries
  const { data: allResults, isLoading: allLoading } = useSearch(query, {
    type: activeTab === 'all' ? 'all' : activeTab,
    ...filters,
  });

  const { data: courses, isLoading: coursesLoading } = useSearchCourses(query, {
    ...filters,
    sort: filters.sort as any,
  });

  const { data: users, isLoading: usersLoading } = useSearchUsers(query);
  const { data: posts, isLoading: postsLoading } = useSearchPosts(query);
  const { data: projects, isLoading: projectsLoading } = useSearchProjects(query);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  const isLoading = allLoading || coursesLoading || usersLoading || postsLoading || projectsLoading;

  const courseFilters = [
    {
      key: 'courseType',
      label: 'Course Type',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Types' },
        { value: 'video', label: 'Video' },
        { value: 'text', label: 'Text' },
        { value: 'interactive', label: 'Interactive' },
      ],
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      type: 'select' as const,
      options: [
        { value: '', label: 'All Levels' },
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' },
      ],
    },
    {
      key: 'isFree',
      label: 'Free Only',
      type: 'checkbox' as const,
    },
    {
      key: 'sort',
      label: 'Sort By',
      type: 'select' as const,
      options: [
        { value: 'relevance', label: 'Relevance' },
        { value: 'newest', label: 'Newest' },
        { value: 'popular', label: 'Most Popular' },
        { value: 'rating', label: 'Highest Rated' },
      ],
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <PageHeader title="Search" description="Find courses, users, posts, and more" />

          <div className="mb-6">
            <SearchBar
              placeholder="Search for courses, users, posts..."
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              className="max-w-2xl"
            />
          </div>

          {query && (
            <>
              {activeTab === 'courses' && (
                <FilterPanel
                  filters={courseFilters}
                  values={filters}
                  onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
                  onReset={() => setFilters({})}
                  className="mb-6"
                />
              )}

              <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="courses">Courses</TabsTrigger>
                  <TabsTrigger value="users">Users</TabsTrigger>
                  <TabsTrigger value="posts">Posts</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>

                {isLoading && (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                )}

                {!isLoading && (
                  <>
                    <TabsContent value="all" className="mt-6">
                      <div className="space-y-6">
                        {allResults?.courses && allResults.courses.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                              <BookOpen className="w-5 h-5" />
                              Courses ({allResults.courses.length})
                            </h3>
                            <div className="space-y-4">
                              {allResults.courses.slice(0, 5).map((course: Course) => (
                                <Link key={course._id} href={`/courses/${course._id}`}>
                                  <Card hover>
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-100 mb-1">{course.title}</h4>
                                          <p className="text-sm text-gray-400 line-clamp-2 mb-2">{course.description}</p>
                                          <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {course.difficulty && (
                                              <Badge variant="secondary" className="capitalize">
                                                {course.difficulty}
                                              </Badge>
                                            )}
                                            {course.averageRating && (
                                              <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                {course.averageRating.toFixed(1)}
                                              </span>
                                            )}
                                            {course.enrollmentCount !== undefined && (
                                              <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {course.enrollmentCount}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {allResults?.users && allResults.users.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Users ({allResults.users.length})
                            </h3>
                            <div className="space-y-4">
                              {allResults.users.slice(0, 5).map((user: User) => (
                                <Link key={user._id} href={`/profile/${user._id}`}>
                                  <Card hover>
                                    <CardContent className="p-4">
                                      <div className="flex items-center gap-4">
                                        <Avatar src={user.profilePhoto} name={user.username} size="md" />
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-gray-100">{user.username}</h4>
                                          {user.bio && <p className="text-sm text-gray-400 line-clamp-1">{user.bio}</p>}
                                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                            <span>Level {user.level || 1}</span>
                                            {user.xp !== undefined && <span>{user.xp} XP</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {allResults?.posts && allResults.posts.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                              <FileText className="w-5 h-5" />
                              Posts ({allResults.posts.length})
                            </h3>
                            <div className="space-y-4">
                              {allResults.posts.slice(0, 5).map((post: Post) => (
                                <Link key={post._id} href={`/feed`}>
                                  <Card hover>
                                    <CardContent className="p-4">
                                      <div className="flex items-start gap-3">
                                        {typeof post.user !== 'string' && (
                                          <Avatar src={post.user?.profilePhoto} name={post.user?.username} size="sm" />
                                        )}
                                        <div className="flex-1">
                                          {typeof post.user !== 'string' && (
                                            <p className="text-sm font-medium text-gray-100 mb-1">
                                              {post.user?.username}
                                            </p>
                                          )}
                                          <p className="text-sm text-gray-400 line-clamp-2">{post.content}</p>
                                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span>{formatDate(post.createdAt)}</span>
                                            {post.likesCount !== undefined && <span>{post.likesCount} likes</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {allResults?.projects && allResults.projects.length > 0 && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                              <Code className="w-5 h-5" />
                              Projects ({allResults.projects.length})
                            </h3>
                            <div className="space-y-4">
                              {allResults.projects.slice(0, 5).map((project: Project) => (
                                <Link key={project._id} href={`/projects/${project._id}`}>
                                  <Card hover>
                                    <CardContent className="p-4">
                                      <h4 className="font-semibold text-gray-100 mb-1">{project.title}</h4>
                                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">{project.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {project.type && (
                                          <Badge variant="secondary" className="capitalize">
                                            {project.type}
                                          </Badge>
                                        )}
                                        {project.language && <span>{project.language}</span>}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {allResults && allResults.total === 0 && (
                          <EmptyState
                            title="No results found"
                            description={`No results found for "${query}". Try a different search term.`}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="courses" className="mt-6">
                      <div className="space-y-4">
                        {courses && courses.length > 0 ? (
                          courses.map((course: Course) => (
                            <Link key={course._id} href={`/courses/${course._id}`}>
                              <Card hover>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-100 mb-1">{course.title}</h4>
                                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">{course.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {course.difficulty && (
                                          <Badge variant="secondary" className="capitalize">
                                            {course.difficulty}
                                          </Badge>
                                        )}
                                        {course.averageRating && (
                                          <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                            {course.averageRating.toFixed(1)}
                                          </span>
                                        )}
                                        {course.enrollmentCount !== undefined && (
                                          <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {course.enrollmentCount}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))
                        ) : (
                          <EmptyState
                            title="No courses found"
                            description={`No courses found for "${query}". Try adjusting your filters.`}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="users" className="mt-6">
                      <div className="space-y-4">
                        {users && users.length > 0 ? (
                          users.map((user: User) => (
                            <Link key={user._id} href={`/profile/${user._id}`}>
                              <Card hover>
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar src={user.profilePhoto} name={user.username} size="md" />
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-100">{user.username}</h4>
                                      {user.bio && <p className="text-sm text-gray-400 line-clamp-1">{user.bio}</p>}
                                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span>Level {user.level || 1}</span>
                                        {user.xp !== undefined && <span>{user.xp} XP</span>}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))
                        ) : (
                          <EmptyState
                            title="No users found"
                            description={`No users found for "${query}".`}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="posts" className="mt-6">
                      <div className="space-y-4">
                        {posts && posts.length > 0 ? (
                          posts.map((post: Post) => (
                            <Link key={post._id} href={`/feed`}>
                              <Card hover>
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    {typeof post.user !== 'string' && (
                                      <Avatar src={post.user?.profilePhoto} name={post.user?.username} size="sm" />
                                    )}
                                    <div className="flex-1">
                                      {typeof post.user !== 'string' && (
                                        <p className="text-sm font-medium text-gray-100 mb-1">
                                          {post.user?.username}
                                        </p>
                                      )}
                                      <p className="text-sm text-gray-400 line-clamp-2">{post.content}</p>
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>{formatDate(post.createdAt)}</span>
                                        {post.likesCount !== undefined && <span>{post.likesCount} likes</span>}
                                        {post.commentsCount !== undefined && <span>{post.commentsCount} comments</span>}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))
                        ) : (
                          <EmptyState
                            title="No posts found"
                            description={`No posts found for "${query}".`}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="projects" className="mt-6">
                      <div className="space-y-4">
                        {projects && projects.length > 0 ? (
                          projects.map((project: Project) => (
                            <Link key={project._id} href={`/projects/${project._id}`}>
                              <Card hover>
                                <CardContent className="p-4">
                                  <h4 className="font-semibold text-gray-100 mb-1">{project.title}</h4>
                                  <p className="text-sm text-gray-400 line-clamp-2 mb-2">{project.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {project.type && (
                                      <Badge variant="secondary" className="capitalize">
                                        {project.type}
                                      </Badge>
                                    )}
                                    {project.language && <span>{project.language}</span>}
                                    {project.likesCount !== undefined && (
                                      <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        {project.likesCount}
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))
                        ) : (
                          <EmptyState
                            title="No projects found"
                            description={`No projects found for "${query}".`}
                          />
                        )}
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </>
          )}

          {!query && (
            <EmptyState
              title="Start searching"
              description="Enter a search query to find courses, users, posts, and more"
            />
          )}
        </div>
    </AppLayout>
  );
}
