/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

/**
 * Validate YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeVideoId(url) !== null;
};

/**
 * Generate YouTube embed URL
 */
export const getYouTubeEmbedUrl = (
  videoId: string,
  options?: {
    autoplay?: boolean;
    controls?: boolean;
    start?: number;
    end?: number;
    loop?: boolean;
    mute?: boolean;
  }
): string => {
  const params = new URLSearchParams();

  if (options?.autoplay) params.append('autoplay', '1');
  if (options?.controls !== undefined) params.append('controls', options.controls ? '1' : '0');
  if (options?.start) params.append('start', options.start.toString());
  if (options?.end) params.append('end', options.end.toString());
  if (options?.loop) params.append('loop', '1');
  if (options?.mute) params.append('mute', '1');

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Generate YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (
  videoId: string,
  quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'high'
): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    standard: 'sddefault',
    maxres: 'maxresdefault',
  };

  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

/**
 * Get YouTube video URL from video ID
 */
export const getYouTubeVideoUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

