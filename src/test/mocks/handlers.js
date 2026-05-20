import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://expedition-go-backend-v2.onrender.com';

// Mock data
const mockBookings = [
  {
    id: 'BK-2026-0001',
    bookingNumber: 'TGA-78234',
    customerName: 'John Smith',
    customerEmail: 'john@example.com',
    tourName: 'Serengeti Safari Adventure',
    travelDate: '2026-06-15',
    bookingDate: '2026-05-18',
    travelers: 4,
    total: 2400,
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
    currency: 'USD',
  },
];

const mockProducts = [
  {
    id: '1',
    title: 'Serengeti Safari Adventure',
    description: 'Experience the wildlife of Serengeti',
    category: 'safari',
    duration: 3,
    durationUnit: 'days',
    pricing: {
      basePrice: 600,
      currency: 'USD',
    },
    status: 'active',
  },
];

const mockUsers = [
  {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN',
    status: 'active',
  },
];

// API handlers
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: mockUsers[0],
        token: 'mock-jwt-token',
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),

  // Bookings endpoints
  http.get(`${API_BASE_URL}/bookings`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    
    let filteredBookings = mockBookings;
    if (status) {
      filteredBookings = mockBookings.filter(b => b.status === status);
    }
    
    return HttpResponse.json({
      data: filteredBookings,
      total: filteredBookings.length,
      page: 1,
      pageSize: 25,
    });
  }),

  http.get(`${API_BASE_URL}/bookings/:id`, ({ params }) => {
    const booking = mockBookings.find(b => b.id === params.id);
    
    if (!booking) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(booking);
  }),

  http.patch(`${API_BASE_URL}/bookings/:id/status`, async ({ params, request }) => {
    const body = await request.json();
    const booking = mockBookings.find(b => b.id === params.id);
    
    if (!booking) {
      return HttpResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json({
      ...booking,
      status: body.status,
    });
  }),

  // Products/Tours endpoints
  http.get(`${API_BASE_URL}/tours`, () => {
    return HttpResponse.json({
      data: mockProducts,
      total: mockProducts.length,
      page: 1,
      pageSize: 25,
    });
  }),

  http.get(`${API_BASE_URL}/tours/:id`, ({ params }) => {
    const product = mockProducts.find(p => p.id === params.id);
    
    if (!product) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(product);
  }),

  http.post(`${API_BASE_URL}/tours`, async ({ request }) => {
    const body = await request.json();
    
    const newProduct = {
      id: String(mockProducts.length + 1),
      ...body,
      status: 'draft',
    };
    
    mockProducts.push(newProduct);
    
    return HttpResponse.json(newProduct, { status: 201 });
  }),

  http.patch(`${API_BASE_URL}/tours/:id`, async ({ params, request }) => {
    const body = await request.json();
    const productIndex = mockProducts.findIndex(p => p.id === params.id);
    
    if (productIndex === -1) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...body,
    };
    
    return HttpResponse.json(mockProducts[productIndex]);
  }),

  http.delete(`${API_BASE_URL}/tours/:id`, ({ params }) => {
    const productIndex = mockProducts.findIndex(p => p.id === params.id);
    
    if (productIndex === -1) {
      return HttpResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }
    
    mockProducts.splice(productIndex, 1);
    
    return HttpResponse.json({ message: 'Product deleted successfully' });
  }),

  // Users endpoints
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      data: mockUsers,
      total: mockUsers.length,
      page: 1,
      pageSize: 25,
    });
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const user = mockUsers.find(u => u.id === params.id);
    
    if (!user) {
      return HttpResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(user);
  }),

  // Analytics endpoints
  http.get(`${API_BASE_URL}/admin/analytics/overview`, () => {
    return HttpResponse.json({
      totalRevenue: 125000,
      activeBookings: 45,
      totalProducts: 28,
      newCustomers: 12,
    });
  }),

  http.get(`${API_BASE_URL}/admin/analytics/revenue-trend`, () => {
    return HttpResponse.json({
      data: [
        { month: 'Jan', revenue: 15000 },
        { month: 'Feb', revenue: 18000 },
        { month: 'Mar', revenue: 22000 },
        { month: 'Apr', revenue: 25000 },
        { month: 'May', revenue: 28000 },
      ],
    });
  }),

  // Reviews endpoints
  http.get(`${API_BASE_URL}/reviews/admin/pending`, () => {
    return HttpResponse.json({
      data: [],
      total: 0,
    });
  }),

  // Notifications endpoints
  http.get(`${API_BASE_URL}/notifications`, () => {
    return HttpResponse.json({
      data: [],
      total: 0,
    });
  }),
];
