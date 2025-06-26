const express = require('express');
const axios = require('axios');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateDemoRequest } = require('../middleware/validation');

const router = express.Router();

// Create demo request
router.post('/request', authenticateToken, validateDemoRequest, async (req, res) => {
  let connection;
  
  try {
    const { organization = {}, user = {} } = req.body;
    const userId = req.user.id;

    // Get database connection for transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert demo request
    const [result] = await connection.execute(`
      INSERT INTO demo_requests (
        user_id, organization_name, business_name, organization_email, 
        organization_phone, address_line, city, state, pin_code,
        user_email, user_full_name, user_phone, job_title, department,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processing')
    `, [
      userId,
      organization.name || null,
      organization.business_name || null,
      organization.email || null,
      organization.phone || null,
      organization.address_line || null,
      organization.city || null,
      organization.state || null,
      organization.pin_code || null,
      user.email || null,
      user.full_name || user.name || null,
      user.phone || null,
      user.job_title || null,
      user.department || null
    ]);

    const demoRequestId = result.insertId;

    try {
      // Call external API
      const apiResponse = await axios.post(
        process.env.DEMO_API_URL,
        { organization, user },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Update demo request with success
      await connection.execute(`
        UPDATE demo_requests 
        SET demo_credentials = ?, external_api_response = ?, status = 'completed'
        WHERE id = ?
      `, [
        JSON.stringify(apiResponse.data),
        JSON.stringify({
          status: apiResponse.status,
          data: apiResponse.data,
          timestamp: new Date().toISOString()
        }),
        demoRequestId
      ]);

      await connection.commit();

      res.status(201).json({
        message: 'Demo request created successfully',
        demo_request_id: demoRequestId,
        credentials: apiResponse.data,
        status: 'completed'
      });

    } catch (apiError) {
      console.error('External API error:', apiError.message);
      
      // Update demo request with failure
      await connection.execute(`
        UPDATE demo_requests 
        SET external_api_response = ?, status = 'failed'
        WHERE id = ?
      `, [
        JSON.stringify({
          error: apiError.message,
          status: apiError.response?.status || 'unknown',
          timestamp: new Date().toISOString()
        }),
        demoRequestId
      ]);

      await connection.commit();

      res.status(500).json({
        error: 'Failed to create demo credentials',
        demo_request_id: demoRequestId,
        details: apiError.response?.data || apiError.message
      });
    }

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Demo request error:', error);
    res.status(500).json({ error: 'Failed to process demo request' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Get user's demo requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [requests] = await pool.execute(`
      SELECT 
        id,
        organization_name,
        business_name,
        demo_credentials,
        status,
        created_at,
        updated_at
      FROM demo_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);

    // Parse JSON credentials
    const formattedRequests = requests.map(request => ({
      ...request,
      demo_credentials: request.demo_credentials ? JSON.parse(request.demo_credentials) : null
    }));

    res.json({
      requests: formattedRequests
    });
  } catch (error) {
    console.error('Get demo requests error:', error);
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

// Get specific demo request
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestId = req.params.id;
    
    const [requests] = await pool.execute(`
      SELECT 
        id,
        organization_name,
        business_name,
        organization_email,
        organization_phone,
        address_line,
        city,
        state,
        pin_code,
        user_email,
        user_full_name,
        user_phone,
        job_title,
        department,
        demo_credentials,
        status,
        created_at,
        updated_at
      FROM demo_requests 
      WHERE id = ? AND user_id = ?
    `, [requestId, userId]);

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    const request = requests[0];
    
    res.json({
      request: {
        ...request,
        demo_credentials: request.demo_credentials ? JSON.parse(request.demo_credentials) : null
      }
    });
  } catch (error) {
    console.error('Get demo request error:', error);
    res.status(500).json({ error: 'Failed to fetch demo request' });
  }
});

module.exports = router;