const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { Order, Payment } = require('../models');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');

// ============================================
// KHALTI PAYMENT ROUTES
// ============================================

// @route   POST /api/payment/khalti/initiate
// @desc    Initiate Khalti payment
// @access  Public
router.post('/khalti/initiate', asyncHandler(async (req, res) => {
  const { amount, orderId, orderName, customerName, customerEmail, customerPhone } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Amount and orderId are required'
    });
  }

  // Amount in paisa (1 NPR = 100 paisa)
  const amountInPaisa = Math.round(amount * 100);

  const payload = {
    return_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/payment/khalti/verify`,
    website_url: process.env.FRONTEND_URL || 'http://localhost:5000',
    amount: amountInPaisa,
    purchase_order_id: orderId,
    purchase_order_name: orderName || `Synaptix Order ${orderId}`,
    customer_info: {
      name: customerName || 'Customer',
      email: customerEmail || 'customer@synaptix.com',
      phone: customerPhone || '9800000000'
    }
  };

  try {
    const response = await axios.post(
      `${process.env.KHALTI_API_URL || 'https://dev.khalti.com/api/v2'}/epayment/initiate/`,
      payload,
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save payment record
    await Payment.create({
      paymentId: response.data.pidx,
      orderId: orderId,
      type: 'khalti',
      amount: amount,
      status: 'initiated',
      gatewayResponse: response.data
    });

    res.json({
      success: true,
      message: 'Payment initiated',
      paymentUrl: response.data.payment_url,
      pidx: response.data.pidx,
      data: response.data
    });

  } catch (error) {
    console.error('Khalti Initiate Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Khalti payment',
      error: error.response?.data?.detail || error.message
    });
  }
}));

// @route   GET /api/payment/khalti/verify
// @desc    Verify Khalti payment (callback)
// @access  Public
router.get('/khalti/verify', asyncHandler(async (req, res) => {
  const { pidx, status, transaction_id, amount, purchase_order_id } = req.query;

  if (!pidx) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?reason=missing_pidx`);
  }

  if (status !== 'Completed') {
    // Update payment status
    await Payment.findOneAndUpdate(
      { paymentId: pidx },
      { status: 'failed', gatewayResponse: req.query }
    );
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?order=${purchase_order_id}`);
  }

  try {
    // Verify with Khalti API
    const verifyResponse = await axios.post(
      `${process.env.KHALTI_API_URL || 'https://dev.khalti.com/api/v2'}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = verifyResponse.data;

    if (paymentData.status === 'Completed') {
      // Update payment record
      await Payment.findOneAndUpdate(
        { paymentId: pidx },
        { 
          status: 'success',
          verifiedAt: new Date(),
          gatewayResponse: paymentData
        }
      );

      // Update order
      await Order.findOneAndUpdate(
        { orderId: purchase_order_id },
        { 
          paymentStatus: 'paid',
          status: 'confirmed',
          'paymentDetails.khaltiPidx': pidx,
          'paymentDetails.paidAt': new Date(),
          $push: {
            timeline: {
              status: 'paid',
              note: `Payment verified via Khalti. Transaction ID: ${transaction_id}`,
              timestamp: new Date()
            }
          }
        }
      );

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order=${purchase_order_id}&method=khalti`);
    } else {
      await Payment.findOneAndUpdate(
        { paymentId: pidx },
        { status: 'failed', gatewayResponse: paymentData }
      );
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?order=${purchase_order_id}`);
    }

  } catch (error) {
    console.error('Khalti Verify Error:', error.response?.data || error.message);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?order=${purchase_order_id}`);
  }
}));

// @route   POST /api/payment/khalti/verify
// @desc    Verify Khalti payment (API)
// @access  Public
router.post('/khalti/verify', asyncHandler(async (req, res) => {
  const { pidx } = req.body;

  if (!pidx) {
    return res.status(400).json({
      success: false,
      message: 'pidx is required'
    });
  }

  try {
    const response = await axios.post(
      `${process.env.KHALTI_API_URL || 'https://dev.khalti.com/api/v2'}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentData = response.data;
    const isSuccess = paymentData.status === 'Completed';

    // Update payment record
    await Payment.findOneAndUpdate(
      { paymentId: pidx },
      { 
        status: isSuccess ? 'success' : 'failed',
        verifiedAt: isSuccess ? new Date() : null,
        gatewayResponse: paymentData
      }
    );

    if (isSuccess && paymentData.purchase_order_id) {
      await Order.findOneAndUpdate(
        { orderId: paymentData.purchase_order_id },
        { 
          paymentStatus: 'paid',
          status: 'confirmed',
          'paymentDetails.khaltiPidx': pidx,
          'paymentDetails.paidAt': new Date(),
          $push: {
            timeline: {
              status: 'paid',
              note: 'Payment verified via Khalti',
              timestamp: new Date()
            }
          }
        }
      );
    }

    res.json({
      success: isSuccess,
      message: isSuccess ? 'Payment verified' : 'Payment not completed',
      data: paymentData
    });

  } catch (error) {
    console.error('Khalti Verify API Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.response?.data?.detail || error.message
    });
  }
}));

// ============================================
// eSEWA PAYMENT ROUTES
// ============================================

// Generate eSewa signature
const generateEsewaSignature = (data, secretKey) => {
  const dataString = `total_amount=${data.total_amount},transaction_uuid=${data.transaction_uuid},product_code=${data.product_code}`;
  const hash = crypto.createHmac('sha256', secretKey).update(dataString).digest('base64');
  return hash;
};

// @route   POST /api/payment/esewa/initiate
// @desc    Initiate eSewa payment
// @access  Public
router.post('/esewa/initiate', asyncHandler(async (req, res) => {
  const { amount, orderId, orderName } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Amount and orderId are required'
    });
  }

  const transactionUuid = `${orderId}-${Date.now()}`;
  const productCode = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/payment/esewa/verify`;
  const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/api/payment/esewa/failed`;

  const signatureData = {
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: productCode
  };

  const signature = generateEsewaSignature(signatureData, secretKey);

  const esewaConfig = {
    amount: amount,
    tax_amount: 0,
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    signature: signature
  };

  // Save payment record
  await Payment.create({
    paymentId: transactionUuid,
    orderId: orderId,
    type: 'esewa',
    amount: amount,
    status: 'initiated',
    gatewayResponse: { ...esewaConfig, orderName }
  });

  res.json({
    success: true,
    message: 'eSewa payment initiated',
    esewaConfig,
    paymentUrl: `${process.env.ESEWA_API_URL || 'https://rc-epay.esewa.com.np'}/api/epay/main/v2/form`
  });
}));

// @route   GET /api/payment/esewa/verify
// @desc    Verify eSewa payment (callback)
// @access  Public
router.get('/esewa/verify', asyncHandler(async (req, res) => {
  const { data } = req.query;

  if (!data) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed?reason=missing_data`);
  }

  try {
    // Decode base64 response
    const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    console.log('eSewa Response:', decodedData);

    const { transaction_uuid, status, total_amount, transaction_code, product_code } = decodedData;

    if (status !== 'COMPLETE') {
      await Payment.findOneAndUpdate(
        { paymentId: transaction_uuid },
        { status: 'failed', gatewayResponse: decodedData }
      );
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed`);
    }

    // Verify with eSewa API
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const verifyData = {
      product_code: product_code,
      transaction_uuid: transaction_uuid,
      total_amount: total_amount
    };

    const verifySignature = generateEsewaSignature(verifyData, secretKey);

    const verifyResponse = await axios.get(
      `${process.env.ESEWA_API_URL || 'https://rc-epay.esewa.com.np'}/api/epay/transaction/status/`,
      {
        params: {
          product_code: product_code,
          transaction_uuid: transaction_uuid,
          total_amount: total_amount,
          signature: verifySignature
        }
      }
    );

    if (verifyResponse.data.status === 'COMPLETE') {
      // Extract order ID from transaction_uuid
      const orderId = transaction_uuid.split('-')[0];

      await Payment.findOneAndUpdate(
        { paymentId: transaction_uuid },
        { 
          status: 'success',
          verifiedAt: new Date(),
          gatewayResponse: { ...decodedData, ...verifyResponse.data }
        }
      );

      await Order.findOneAndUpdate(
        { orderId: orderId },
        { 
          paymentStatus: 'paid',
          status: 'confirmed',
          'paymentDetails.esewaRefId': transaction_code,
          'paymentDetails.esewaTransactionUuid': transaction_uuid,
          'paymentDetails.paidAt': new Date(),
          $push: {
            timeline: {
              status: 'paid',
              note: `Payment verified via eSewa. Ref: ${transaction_code}`,
              timestamp: new Date()
            }
          }
        }
      );

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?order=${orderId}&method=esewa`);
    } else {
      await Payment.findOneAndUpdate(
        { paymentId: transaction_uuid },
        { status: 'failed', gatewayResponse: verifyResponse.data }
      );
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed`);
    }

  } catch (error) {
    console.error('eSewa Verify Error:', error.message);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed`);
  }
}));

// @route   GET /api/payment/esewa/failed
// @desc    eSewa payment failed callback
// @access  Public
router.get('/esewa/failed', asyncHandler(async (req, res) => {
  const { data } = req.query;

  if (data) {
    try {
      const decodedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
      await Payment.findOneAndUpdate(
        { paymentId: decodedData.transaction_uuid },
        { status: 'failed', gatewayResponse: decodedData }
      );
    } catch (e) {
      console.error('Failed to decode eSewa error data');
    }
  }

  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/failed`);
}));

// ============================================
// PAYMENT STATUS & HISTORY
// ============================================

// @route   GET /api/payment/status/:orderId
// @desc    Get payment status for an order
// @access  Public
router.get('/status/:orderId', asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ orderId: req.params.orderId }).sort('-createdAt');

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'No payment found for this order'
    });
  }

  res.json({
    success: true,
    data: {
      paymentId: payment.paymentId,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt
    }
  });
}));

// @route   GET /api/payment/history
// @desc    Get all payments (admin)
// @access  Admin
router.get('/history', protect, asyncHandler(async (req, res) => {
  // Check if admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  const { status, type, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Payment.countDocuments(filter)
  ]);

  res.json({
    success: true,
    count: payments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: payments
  });
}));

module.exports = router;
