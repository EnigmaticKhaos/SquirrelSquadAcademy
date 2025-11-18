import express from 'express';
import { protect } from '../middleware/auth';
import {
  getLiveSessions,
  getLiveSession,
  createLiveSessionHandler,
  updateLiveSession,
  registerForLiveSession,
  joinLiveSession,
  leaveLiveSession,
  endLiveSession,
  getSessionParticipants,
  getSessionPolls,
  createPollHandler,
  voteOnPollHandler,
  getSessionQuestions,
  askQuestionHandler,
  answerQuestionHandler,
  upvoteQuestionHandler,
  getSessionRecording,
  saveRecordingHandler,
} from '../controllers/liveSessionController';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Sessions
router.get('/', getLiveSessions);
router.post('/', createLiveSessionHandler);
router.get('/:id', getLiveSession);
router.put('/:id', updateLiveSession);
router.post('/:id/register', registerForLiveSession);
router.post('/:id/join', joinLiveSession);
router.post('/:id/leave', leaveLiveSession);
router.post('/:id/end', endLiveSession);

// Participants
router.get('/:id/participants', getSessionParticipants);

// Polls
router.get('/:id/polls', getSessionPolls);
router.post('/:id/polls', createPollHandler);
router.post('/polls/:pollId/vote', voteOnPollHandler);

// Q&A
router.get('/:id/questions', getSessionQuestions);
router.post('/:id/questions', askQuestionHandler);
router.post('/questions/:questionId/answer', answerQuestionHandler);
router.post('/questions/:questionId/upvote', upvoteQuestionHandler);

// Recordings
router.get('/:id/recording', getSessionRecording);
router.post('/:id/recording', saveRecordingHandler);

export default router;

