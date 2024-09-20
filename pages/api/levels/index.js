import connectToMongo from '@/middleware/connectToMongo';
import Level from '@/models/Level';

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const handler = async (req, res) => {
  if (req.method === 'GET') {
    const levels = await Level.find();
    return res.status(200).json(levels);
  } else if (req.method === 'POST') {
    const { levelName, noOfDays } = req.body;

    // Convert noOfDays to a number
    const days = Number(noOfDays);
    if (isNaN(days)) {
      return res.status(400).json({ error: 'Invalid number of days' });
    }

    console.log('Received Data:', { levelName, noOfDays: days });

    // Fetch the last created level
    const lastLevel = await Level.findOne().sort({ createdAt: -1 });
    console.log('Last Level:', lastLevel);

    const startDate = lastLevel ? addDays(new Date(lastLevel.endDate), 1) : new Date();
    const endDate = addDays(startDate, days);

    console.log('Calculated Start Date:', startDate);
    console.log('Calculated End Date:', endDate);

    const newLevel = new Level({
      startDate,
      noOfDays: days,
      endDate,
      level: lastLevel ? lastLevel.level + 1 : 1,
      levelName,
      improvedPercentage: 0,
    });

    await newLevel.save();
    return res.status(201).json(newLevel);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
};

export default connectToMongo(handler);
