import { supabase } from '../config/database.js';

const ReportsModel = {
  getReportsStats: async ({ currentDate, currentMonthStart, branchId, startDate, endDate }) => {
    try {
      console.log('Reports Model - Query Parameters:', {
        currentDate,
        currentMonthStart,
        branchId,
        startDate,
        endDate
      });

      // New Leads Query
      let newLeadsQuery = supabase
        .from('leads')
        .select('count');

      // Apply date range filter
      if (startDate && endDate) {
        newLeadsQuery = newLeadsQuery
          .gte('created_at', `${startDate}T00:00:00`)
          .lt('created_at', `${endDate}T23:59:59`);
      } else {
        newLeadsQuery = newLeadsQuery
          .gte('created_at', `${currentMonthStart}T00:00:00`)
          .lt('created_at', `${currentDate}T23:59:59`);
      }

      // Apply branch filter
      if (branchId !== 'all') {
        newLeadsQuery = newLeadsQuery.eq('branch_id', branchId);
      }

      const { data: newLeads, error: newLeadsError } = await newLeadsQuery;

      if (newLeadsError) {
        console.error('New Leads Query Error:', newLeadsError);
        throw newLeadsError;
      }

      // Active Leads Query
      let activeLeadsQuery = supabase
        .from('leads')
        .select('count')
        .eq('lead_active_status', true);

      if (branchId !== 'all') {
        activeLeadsQuery = activeLeadsQuery.eq('branch_id', branchId);
      }

      const { data: activeLeads, error: activeLeadsError } = await activeLeadsQuery;

      if (activeLeadsError) {
        console.error('Active Leads Query Error:', activeLeadsError);
        throw activeLeadsError;
      }

      // Closed Leads Query
      let closedLeadsQuery = supabase
        .from('leads')
        .select('count')
        .eq('lead_active_status', false);

      // Apply date range filter
      if (startDate && endDate) {
        closedLeadsQuery = closedLeadsQuery
          .gte('closed_at', `${startDate}T00:00:00`)
          .lt('closed_at', `${endDate}T23:59:59`);
      } else {
        closedLeadsQuery = closedLeadsQuery
          .gte('closed_at', `${currentMonthStart}T00:00:00`)
          .lt('closed_at', `${currentDate}T23:59:59`);
      }

      // Apply branch filter if specified
      if (branchId !== 'all') {
        closedLeadsQuery = closedLeadsQuery.eq('branch_id', branchId);
      }

      const { data: closedLeads, error: closedLeadsError } = await closedLeadsQuery;

      if (closedLeadsError) {
        console.error('Closed Leads Query Error:', closedLeadsError);
        throw closedLeadsError;
      }

      // Sales Leads Query
      let salesLeadsQuery = supabase
        .from('leads')
        .select('count')
        .eq('lead_stage', 4); // Stage 4 represents won/sales

      // Apply date range filter
      if (startDate && endDate) {
        salesLeadsQuery = salesLeadsQuery
          .gte('won_at', `${startDate}T00:00:00`)
          .lt('won_at', `${endDate}T23:59:59`);
      } else {
        salesLeadsQuery = salesLeadsQuery
          .gte('won_at', `${currentMonthStart}T00:00:00`)
          .lt('won_at', `${currentDate}T23:59:59`);
      }

      // Apply branch filter if specified
      if (branchId !== 'all') {
        salesLeadsQuery = salesLeadsQuery.eq('branch_id', branchId);
      }

      const { data: salesLeads, error: salesLeadsError } = await salesLeadsQuery;

      if (salesLeadsError) {
        console.error('Sales Leads Query Error:', salesLeadsError);
        throw salesLeadsError;
      }

      // Non Potential Leads Query
      let nonPotentialLeadsQuery = supabase
        .from('leads')
        .select('count')
        .eq('lead_stage', 6); // Stage 6 represents non-potential

      // Apply date range filter
      if (startDate && endDate) {
        nonPotentialLeadsQuery = nonPotentialLeadsQuery
          .gte('created_at', `${startDate}T00:00:00`)
          .lt('created_at', `${endDate}T23:59:59`);
      } else {
        nonPotentialLeadsQuery = nonPotentialLeadsQuery
          .gte('created_at', `${currentMonthStart}T00:00:00`)
          .lt('created_at', `${currentDate}T23:59:59`);
      }

      // Apply branch filter if specified
      if (branchId !== 'all') {
        nonPotentialLeadsQuery = nonPotentialLeadsQuery.eq('branch_id', branchId);
      }

      const { data: nonPotentialLeads, error: nonPotentialLeadsError } = await nonPotentialLeadsQuery;

      if (nonPotentialLeadsError) {
        console.error('Non Potential Leads Query Error:', nonPotentialLeadsError);
        throw nonPotentialLeadsError;
      }

      // Hot Leads Query
      let hotLeadsQuery = supabase
        .from('leads')
        .select('count')
        .eq('lead_stage', 3); // Stage 3 represents hot leads

      // Apply date range filter
      if (startDate && endDate) {
        hotLeadsQuery = hotLeadsQuery
          .gte('created_at', `${startDate}T00:00:00`)
          .lt('created_at', `${endDate}T23:59:59`);
      } else {
        hotLeadsQuery = hotLeadsQuery
          .gte('created_at', `${currentMonthStart}T00:00:00`)
          .lt('created_at', `${currentDate}T23:59:59`);
      }

      // Apply branch filter if specified
      if (branchId !== 'all') {
        hotLeadsQuery = hotLeadsQuery.eq('branch_id', branchId);
      }

      const { data: hotLeads, error: hotLeadsError } = await hotLeadsQuery;

      if (hotLeadsError) {
        console.error('Hot Leads Query Error:', hotLeadsError);
        throw hotLeadsError;
      }

      // Followup Required Query
      let followupRequiredQuery = supabase
        .from('leads')
        .select('count')
        .lt('fu_date', currentDate) // Get leads where followup date has passed
        .not('lead_stage', 'in', '(4,6)'); // Exclude won and non-potential leads

      // Apply branch filter if specified
      if (branchId !== 'all') {
        followupRequiredQuery = followupRequiredQuery.eq('branch_id', branchId);
      }

      const { data: followupRequired, error: followupRequiredError } = await followupRequiredQuery;

      if (followupRequiredError) {
        console.error('Followup Required Query Error:', followupRequiredError);
        throw followupRequiredError;
      }

      return {
        newLeads: newLeads[0]?.count || 0,
        activeLeads: activeLeads[0]?.count || 0,
        closedLeads: closedLeads[0]?.count || 0,
        salesLeads: salesLeads[0]?.count || 0,
        nonPotentialLeads: nonPotentialLeads[0]?.count || 0,
        hotLeads: hotLeads[0]?.count || 0,
        followupRequired: followupRequired[0]?.count || 0
      };

    } catch (error) {
      console.error('ReportsModel Error:', error);
      throw error;
    }
  },

  getUserWiseLeadStats: async ({ currentMonthStart, currentDate, branchId, startDate, endDate }) => {
    try {
      // First get all active users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name')
        .eq('user_is_active', true)
        .order('name');

      if (userError) throw userError;

      // For each user, get their lead stats
      const userStats = await Promise.all(users.map(async (user) => {
        // New Leads Query (with date and branch filters)
        let newLeadsQuery = supabase
          .from('leads')
          .select('count')
          .eq('assigned_user', user.id);

        // Apply date range filter for new leads
        if (startDate && endDate) {
          newLeadsQuery = newLeadsQuery
            .gte('created_at', `${startDate}T00:00:00`)
            .lt('created_at', `${endDate}T23:59:59`);
        } else {
          newLeadsQuery = newLeadsQuery
            .gte('created_at', `${currentMonthStart}T00:00:00`)
            .lt('created_at', `${currentDate}T23:59:59`);
        }

        // Apply branch filter for new leads if specified
        if (branchId !== 'all') {
          newLeadsQuery = newLeadsQuery.eq('branch_id', branchId);
        }

        // Active Leads Query (without date and branch filters)
        const activeLeadsQuery = supabase
          .from('leads')
          .select('count')
          .eq('assigned_user', user.id)
          .eq('lead_active_status', true);

        // Closed Leads Query (with date filter)
        let closedLeadsQuery = supabase
          .from('leads')
          .select('count')
          .eq('assigned_user', user.id)
          .eq('lead_active_status', false);

        // Sales Leads Query (won leads)
        let salesLeadsQuery = supabase
          .from('leads')
          .select('count')
          .eq('assigned_user', user.id)
          .eq('lead_stage', 4);

        // Apply date range filter for new, closed and sales leads
        if (startDate && endDate) {
          newLeadsQuery = newLeadsQuery
            .gte('created_at', `${startDate}T00:00:00`)
            .lt('created_at', `${endDate}T23:59:59`);
          
          closedLeadsQuery = closedLeadsQuery
            .gte('created_at', `${startDate}T00:00:00`)
            .lt('created_at', `${endDate}T23:59:59`);
          
          salesLeadsQuery = salesLeadsQuery
            .gte('won_at', `${startDate}T00:00:00`)
            .lt('won_at', `${endDate}T23:59:59`);
        } else {
          newLeadsQuery = newLeadsQuery
            .gte('created_at', `${currentMonthStart}T00:00:00`)
            .lt('created_at', `${currentDate}T23:59:59`);
          
          closedLeadsQuery = closedLeadsQuery
            .gte('created_at', `${currentMonthStart}T00:00:00`)
            .lt('created_at', `${currentDate}T23:59:59`);
          
          salesLeadsQuery = salesLeadsQuery
            .gte('won_at', `${currentMonthStart}T00:00:00`)
            .lt('won_at', `${currentDate}T23:59:59`);
        }

        // Apply branch filter if specified
        if (branchId !== 'all') {
          newLeadsQuery = newLeadsQuery.eq('branch_id', branchId);
          closedLeadsQuery = closedLeadsQuery.eq('branch_id', branchId);
          salesLeadsQuery = salesLeadsQuery.eq('branch_id', branchId);
        }

        // Execute all queries in parallel
        const [newLeadsResult, activeLeadsResult, closedLeadsResult, salesLeadsResult] = await Promise.all([
          newLeadsQuery,
          activeLeadsQuery,
          closedLeadsQuery,
          salesLeadsQuery
        ]);

        if (newLeadsResult.error) throw newLeadsResult.error;
        if (activeLeadsResult.error) throw activeLeadsResult.error;
        if (closedLeadsResult.error) throw closedLeadsResult.error;
        if (salesLeadsResult.error) throw salesLeadsResult.error;

        const newLeadsCount = newLeadsResult.data[0]?.count || 0;
        const salesLeadsCount = salesLeadsResult.data[0]?.count || 0;

        // Calculate conversion ratio
        const conversionRatio = newLeadsCount > 0 
          ? ((salesLeadsCount / newLeadsCount) * 100).toFixed(2)
          : '0.00';

        return {
          key: user.id,
          userName: user.name,
          new: newLeadsCount,
          active: activeLeadsResult.data[0]?.count || 0,
          closed: closedLeadsResult.data[0]?.count || 0,
          sales: salesLeadsCount,
          conversionRatio: `${conversionRatio}%`
        };
      }));

      return userStats;

    } catch (error) {
      console.error('Error in getUserWiseLeadStats:', error);
      throw error;
    }
  },

  getLeadsTrend: async ({ currentMonthStart, currentDate, branchId, startDate, endDate }) => {
    try {
      // Determine query date range
      const queryStartDate = startDate || currentMonthStart;
      const queryEndDate = endDate || currentDate;

      // Query for all leads created in the period
      let leadsQuery = supabase
        .from('leads')
        .select('created_at');

      // Query for won leads in the period
      let wonLeadsQuery = supabase
        .from('leads')
        .select('won_at')
        .eq('lead_stage', 4);

      // Apply date filters
      leadsQuery = leadsQuery
        .gte('created_at', `${queryStartDate}T00:00:00`)
        .lt('created_at', `${queryEndDate}T23:59:59`);

      wonLeadsQuery = wonLeadsQuery
        .gte('won_at', `${queryStartDate}T00:00:00`)
        .lt('won_at', `${queryEndDate}T23:59:59`);

      // Apply branch filter if specified
      if (branchId !== 'all') {
        leadsQuery = leadsQuery.eq('branch_id', branchId);
        wonLeadsQuery = wonLeadsQuery.eq('branch_id', branchId);
      }

      // Execute queries in parallel
      const [leadsResult, wonLeadsResult] = await Promise.all([
        leadsQuery,
        wonLeadsQuery
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (wonLeadsResult.error) throw wonLeadsResult.error;

      // Process results by month
      const monthlyData = {};
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      // Initialize monthly data
      months.forEach(month => {
        monthlyData[month] = { leads: 0, sales: 0 };
      });

      // Count leads by month
      leadsResult.data.forEach(lead => {
        const month = months[new Date(lead.created_at).getMonth()];
        monthlyData[month].leads++;
      });

      // Count won leads by month
      wonLeadsResult.data.forEach(lead => {
        const month = months[new Date(lead.won_at).getMonth()];
        monthlyData[month].sales++;
      });

      // Transform data for chart
      const chartData = months.map(month => ({
        month,
        leads: monthlyData[month].leads,
        sales: monthlyData[month].sales
      }));

      return chartData;

    } catch (error) {
      console.error('Error in getLeadsTrend:', error);
      throw error;
    }
  }
};

export default ReportsModel; 