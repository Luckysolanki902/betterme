// pages/api/daily-completion/index.js
import connectToMongo from '@/middleware/connectToMongo';
import DailyCompletion from '@/models/DailyCompletion';
import Todo from '@/models/Todo';
import Config from '@/models/Config';
import { format, startOfDay, endOfDay } from 'date-fns';
import mongoose from 'mongoose';

const handler = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const { date } = req.query;
      const selectedDate = date || format(new Date(), 'yyyy-MM-dd');
      
      const dailyCompletion = await DailyCompletion.findOne({ 
        date: { 
          $gte: startOfDay(new Date(selectedDate)), 
          $lte: endOfDay(new Date(selectedDate)) 
        } 
      }).populate('completedTodos');
      
      if (!dailyCompletion) {
        return res.status(200).json({ 
          completedTodos: [], 
          score: 0,
          totalPossibleScore: 0
        });
      }
      
      return res.status(200).json({
        completedTodos: dailyCompletion.completedTodos,
        score: dailyCompletion.score,
        totalPossibleScore: dailyCompletion.totalPossibleScore
      });
    } catch (error) {
      console.error('Error fetching daily completion:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }  } else if (req.method === 'POST') {
    try {
      const { category, todoId } = req.body;
      
      if (!todoId && !category) {
        return res.status(400).json({ error: 'Either todoId or category is required', success: false });
      }
      
      // Validate todoId format if provided
      if (todoId && !mongoose.Types.ObjectId.isValid(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID format', success: false });
      }
      
      // Find the todo
      const todo = todoId ? 
        await Todo.findById(todoId) : 
        await Todo.findOne({ category });
        
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found', success: false });
      }
      
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      
      // Find or create today's completion record
      let dailyCompletion = await DailyCompletion.findOne({
        date: { $gte: todayStart, $lte: todayEnd }
      });
      
      if (!dailyCompletion) {
        // Calculate total possible score for today from all todos
        const allTodos = await Todo.find({});
        const totalPossible = allTodos.reduce((sum, t) => sum + t.score, 0);
        
        dailyCompletion = new DailyCompletion({
          date: today,
          completedTodos: [],
          score: 0,
          totalPossibleScore: totalPossible
        });
      }
        // Add todo to completedTodos if not already there
      // Need to convert ObjectIds to strings for proper comparison
      const todoIdStr = todo._id.toString();
      const todoExists = dailyCompletion.completedTodos.some(id => id.toString() === todoIdStr);
      
      if (!todoExists) {        dailyCompletion.completedTodos.push(todo._id);
        dailyCompletion.score += todo.score;
        
        // Update todo completion status
        todo.completed = true;
        await todo.save();
        
        await dailyCompletion.save();
        
        // Update config with total score
        const config = await Config.findOne() || new Config();
        config.totalScore += todo.score;
        config.totalPossibleScore += todo.score;
        
        // Add to scoresByDay map
        const dateKey = format(today, 'yyyy-MM-dd');
        const dayScores = config.scoresByDay.get(dateKey) || { score: 0, totalPossible: dailyCompletion.totalPossibleScore };
        dayScores.score += todo.score;
        config.scoresByDay.set(dateKey, dayScores);
        
        await config.save();
      }
      
      return res.status(200).json({ success: true, dailyCompletion });
    } catch (error) {
      console.error('Error updating daily completion:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }  } else if (req.method === 'DELETE') {
    try {
      const { category, todoId } = req.body;
      
      if (!todoId && !category) {
        return res.status(400).json({ error: 'Either todoId or category is required', success: false });
      }
      
      // Validate todoId format if provided
      if (todoId && !mongoose.Types.ObjectId.isValid(todoId)) {
        return res.status(400).json({ error: 'Invalid todo ID format', success: false });
      }
      
      // Find the todo
      const todo = todoId ? 
        await Todo.findById(todoId) : 
        await Todo.findOne({ category });
        
      if (!todo) {
        return res.status(404).json({ error: 'Todo not found', success: false });
      }
      
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
        // Find today's completion record
      const dailyCompletion = await DailyCompletion.findOne({
        date: { $gte: todayStart, $lte: todayEnd }
      });
      
      if (!dailyCompletion) {
        return res.status(404).json({ error: 'No completion record found for today' });
      }
      
      // Check if the todo ID exists in the completedTodos array
      // We need to convert ObjectIds to strings for proper comparison
      const todoIdStr = todo._id.toString();
      const todoExists = dailyCompletion.completedTodos.some(id => id.toString() === todoIdStr);
      
      if (todoExists) {        // Remove todo from completedTodos using proper ObjectId comparison
        dailyCompletion.completedTodos = dailyCompletion.completedTodos?.filter(
          id => id.toString() !== todoIdStr
        );
        dailyCompletion.score = Math.max(0, dailyCompletion.score - todo.score);
        
        // Update todo completion status
        todo.completed = false;
        await todo.save();
        
        await dailyCompletion.save();
        
        // Update config with total score
        const config = await Config.findOne();
        if (config) {
          config.totalScore -= todo.score;
          
          // Update scoresByDay map
          const dateKey = format(today, 'yyyy-MM-dd');
          const dayScores = config.scoresByDay.get(dateKey);
          if (dayScores) {
            dayScores.score -= todo.score;
            config.scoresByDay.set(dateKey, dayScores);
          }
          
          await config.save();
        }
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error removing daily completion:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
