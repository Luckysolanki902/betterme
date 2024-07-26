// @/api/celibacy/[year]/[month].js
import connectToMongo from '@/middleware/connectToMongo';
import MonthlyCelibacyRecord from '@/models/MonthlyCelibacyRecord';

const handler = async (req, res) => {
  const { method } = req;
  const { year, month } = req.query;

  switch (method) {
    case 'GET':
      try {
        const record = await MonthlyCelibacyRecord.findOne({ year, month });
        if (!record) {
          return res.status(404).json({ success: false, message: 'Record not found' });
        }
        res.status(200).json({ success: true, data: record });
      } catch (error) {
        console.error(`GET error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error while fetching record', error: error.message });
      }
      break;
    case 'POST':
      try {
        const { dailyRecords } = req.body;
        if (!dailyRecords || !Array.isArray(dailyRecords)) {
          return res.status(400).json({ success: false, message: 'Invalid input: dailyRecords should be an array' });
        }
        const record = await MonthlyCelibacyRecord.findOneAndUpdate(
          { year, month },
          { year, month, dailyRecords },
          { upsert: true, new: true }
        );
        res.status(201).json({ success: true, data: record });
      } catch (error) {
        console.error(`POST error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error while saving record', error: error.message });
      }
      break;
    default:
      res.status(405).json({ success: false, message: 'Method not allowed' });
      break;
  }
};

export default connectToMongo(handler);
