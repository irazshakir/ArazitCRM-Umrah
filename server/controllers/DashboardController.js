import { DashboardModel } from '../models/index.js';

const DashboardController = {
  getDashboardStats: async (req, res) => {
    try {
      const { branchId, startDate, endDate } = req.query;
      
      console.log('Request params:', req.query); // Debug log
      
      // Get current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      
      // Get first day of current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      const currentMonthStart = firstDayOfMonth.toISOString().split('T')[0];

      const stats = await DashboardModel.getDashboardStats({
        currentDate,
        currentMonthStart,
        branchId: branchId || 'all',
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Controller error:', error); // Debug log
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard statistics',
        error: error.message,
        details: error.stack // Include stack trace for debugging
      });
    }
  },

  getLeadConversionStats: async (req, res) => {
    try {
      const { timeRange, branchId } = req.query;
      
      const stats = await DashboardModel.getLeadConversionStats({
        timeRange,
        branchId
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching lead conversion statistics',
        error: error.message
      });
    }
  },

  getBranches: async (req, res) => {
    try {
      const branches = await DashboardModel.getBranches();
      
      res.json({
        success: true,
        data: branches
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching branches',
        error: error.message
      });
    }
  }
};

export default DashboardController;