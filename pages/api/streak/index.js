import connectToMongo from '@/middleware/connectToMongo';
import Streak from '@/models/Streak';
import DailyCompletion from '@/models/DailyCompletion';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    let streak = await Streak.findOne({});
    if (!streak) {
      streak = new Streak({ startDate: new Date(), currentStreak: 0, longestStreak: 0 });
      await streak.save();
    }
    res.status(200).json(streak);
  } else if (req.method === 'POST') {
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    let streak = await Streak.findOne({});
    if (!streak) {
      streak = new Streak({ startDate: new Date(), currentStreak: 0, longestStreak: 0 });
    }
    const yesterdayCompletion = await DailyCompletion.findOne({ date: yesterday });
    const todayCompletion = await DailyCompletion.findOne({ date: today });
    if (yesterdayCompletion && yesterdayCompletion.completedTodos.length > 0 && todayCompletion && todayCompletion.completedTodos.length > 0) {
      streak.currentStreak += 1;
    } else {
      streak.currentStreak = 1;
      streak.startDate = today;
    }
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    await streak.save();
    res.status(200).json(streak);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
