const prisma = require('../utils/prismaClient');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const admin = require('../config/firebaseAdmin');
const event = require('../utils/eventEmitter');

const supplierProfileSelect = {
  id: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  adminNotes: true,
  averageRating: true,
  totalEarnings: true,
  totalBookings: true,
};

async function getSupplierProfileForUser(userId) {
  return prisma.supplierProfile.findUnique({
    where: { userId },
    select: supplierProfileSelect,
  });
}

async function resolveUserFromFirebaseToken(idToken) {
  const decoded = await admin.auth().verifyIdToken(idToken);

  let user = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return user;
  }

  user = await prisma.user.create({
    data: {
      firebaseUid: decoded.uid,
      name: decoded.name || decoded.email?.split('@')[0] || 'User',
      email: decoded.email,
      photoURL: decoded.picture || '',
      roles: ['customer'],
    },
  });

  event.emit({
    name: 'user.signed_up',
    userId: user.id,
    resource: 'User',
    resourceId: user.id,
    properties: { method: 'firebase' },
  });

  return user;
}

exports.signup = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  }

  const idToken = authHeader.split(' ')[1];

  if (process.env.NODE_ENV === 'development' && idToken === 'test-token') {
    let user = await prisma.user.findFirst({
      where: { firebaseUid: 'dev-uid' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: 'dev-uid',
          name: 'Dev User',
          email: 'dev@test.com',
          photoURL: '',
          roles: ['admin'],
        },
      });
    }

    event.emit({ name: 'user.logged_in', userId: user.id, req, resource: 'User', resourceId: user.id, properties: { method: 'dev_bypass' } });

    const supplierProfile = await getSupplierProfileForUser(user.id);

    return res.status(200).json({
      status: 'success',
      data: { user, supplierProfile },
    });
  }

  let user;
  try {
    user = await resolveUserFromFirebaseToken(idToken);
  } catch {
    return next(
      new AppError('Invalid or expired Firebase token. Please log in again.', 401),
    );
  }

  event.emit({ name: 'user.logged_in', userId: user.id, req, resource: 'User', resourceId: user.id });

  const supplierProfile = await getSupplierProfileForUser(user.id);

  return res.status(200).json({
    status: 'success',
    data: { user, supplierProfile },
  });
});

exports.verifyToken = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bodyToken = req.body?.token;
  const idToken = bodyToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!idToken) {
    return next(new AppError('Token is required (provide via Authorization: Bearer header or request body)', 400));
  }

  if (process.env.NODE_ENV === 'development' && idToken === 'test-token') {
    let user = await prisma.user.findFirst({
      where: { firebaseUid: 'dev-uid' },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: 'dev-uid',
          name: 'Dev User',
          email: 'dev@test.com',
          photoURL: '',
          roles: ['admin'],
        },
      });
    }

    event.emit({ name: 'user.logged_in', userId: user.id, req, resource: 'User', resourceId: user.id, properties: { method: 'dev_bypass' } });

    const supplierProfile = await getSupplierProfileForUser(user.id);

    return res.status(200).json({
      status: 'success',
      data: { user, supplierProfile },
    });
  }

  let user;
  try {
    user = await resolveUserFromFirebaseToken(idToken);
  } catch {
    return next(new AppError('Invalid or expired token', 401));
  }

  const supplierProfile = await getSupplierProfileForUser(user.id);

  event.emit({
    name: 'user.logged_in',
    userId: user.id,
    req,
    resource: 'User',
    resourceId: user.id,
    properties: { method: 'verify_token' },
  });

  res.status(200).json({
    status: 'success',
    data: { user, supplierProfile },
  });
});

exports.logout = (req, res) => {
  event.emit({ name: 'user.logged_out', userId: req.user?.id, req });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};