import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();
crons.interval('Initialize legacy offer deadlines', { hours: 1 }, internal.deadlines.initializeOffers, {});
crons.interval('Initialize legacy review deadlines', { hours: 1 }, internal.deadlines.initializeReviews, {});
export default crons;
